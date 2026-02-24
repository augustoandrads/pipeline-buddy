/**
 * Página: Painel de Leads em Risco
 * Exibe todos os leads com inatividade acima do threshold
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, Lead, ETAPAS } from '@/types/crm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  getInactivityStatus,
  getThresholdForStage,
  calculateDaysSinceLastActivity,
} from '@/hooks/useInactivityThresholds';
import { differenceInDays, parseISO } from 'date-fns';

type SortOption = 'dias' | 'valor' | 'etapa';

export default function AtRiskLeadsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('dias');

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cards').select('*, leads(*)');
      if (error) throw error;
      return data as Card[];
    },
  });

  // Filtrar leads em risco
  const atRiskLeads = useMemo(() => {
    return cards
      .filter((card) => {
        const diasNaEtapa = differenceInDays(new Date(), parseISO(card.data_entrada_etapa));
        const status = getInactivityStatus(card.etapa, diasNaEtapa);
        return status === 'alerta' || status === 'perigo';
      })
      .map((card) => ({
        card,
        lead: card.leads,
        diasNaEtapa: differenceInDays(new Date(), parseISO(card.data_entrada_etapa)),
        status: getInactivityStatus(
          card.etapa,
          differenceInDays(new Date(), parseISO(card.data_entrada_etapa))
        ),
      }));
  }, [cards]);

  // Ordenar
  const sortedLeads = useMemo(() => {
    const sorted = [...atRiskLeads];
    switch (sortBy) {
      case 'dias':
        return sorted.sort((a, b) => b.diasNaEtapa - a.diasNaEtapa);
      case 'valor':
        return sorted.sort(
          (a, b) => (b.lead?.valor_estimado_contrato ?? 0) - (a.lead?.valor_estimado_contrato ?? 0)
        );
      case 'etapa':
        return sorted.sort((a, b) => a.card.etapa.localeCompare(b.card.etapa));
      default:
        return sorted;
    }
  }, [atRiskLeads, sortBy]);

  const getEtapaLabel = (key: string) => {
    return ETAPAS.find((e) => e.key === key)?.label || key;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'perigo':
        return 'bg-red-100 text-red-800';
      case 'alerta':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <h1 className="text-lg font-semibold">Leads em Risco</h1>
            <p className="text-sm text-muted-foreground">
              {atRiskLeads.length} lead{atRiskLeads.length !== 1 ? 's' : ''} com inatividade acima do limite
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {atRiskLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-muted-foreground">Nenhum lead em risco no momento</p>
            <p className="text-xs text-muted-foreground">
              Todos os leads estão com atividades recentes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort Controls */}
            <div className="flex justify-end">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dias">Dias Parado</SelectItem>
                  <SelectItem value="valor">Maior Valor</SelectItem>
                  <SelectItem value="etapa">Etapa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-right">Dias Parado</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeads.map(({ card, lead, diasNaEtapa, status }) => (
                    <TableRow key={card.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge className={getStatusColor(status)}>
                          {status === 'perigo' ? '🔴 PERIGO' : '🟡 ALERTA'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{lead?.nome}</TableCell>
                      <TableCell>{lead?.empresa}</TableCell>
                      <TableCell>{getEtapaLabel(card.etapa)}</TableCell>
                      <TableCell className="text-right font-semibold">{diasNaEtapa}d</TableCell>
                      <TableCell className="text-right text-primary font-semibold">
                        R$ {(lead?.valor_estimado_contrato ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Implementar ações rápidas (follow-up, reassign, move stage)
                            console.log('Ação para card:', card.id);
                          }}
                        >
                          Agir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
