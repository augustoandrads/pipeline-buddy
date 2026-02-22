import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, Lead } from "@/types/crm";
import { differenceInDays, parseISO } from "date-fns";
import { TrendingUp, Clock, Zap } from "lucide-react";

interface LeadStatsProps {
  card: Card;
  lead: Lead;
}

export function LeadStats({ card, lead }: LeadStatsProps) {
  const { data: stats } = useQuery({
    queryKey: ["leadStats", card.id],
    queryFn: async () => {
      // Get days in current stage
      const diasNaEtapa = differenceInDays(
        new Date(),
        parseISO(card.data_entrada_etapa)
      );

      // Get total days since creation
      const diasTotalCriado = differenceInDays(
        new Date(),
        parseISO(card.criado_em)
      );

      // Get all leads for comparison
      const { data: allLeads } = await supabase
        .from("leads")
        .select("valor_estimado_contrato, tipo_cliente, origem")
        .returns<Lead[]>();

      // Calculate statistics
      const sameTipeLeads = allLeads?.filter(
        (l) => l.tipo_cliente === lead.tipo_cliente
      ) || [];
      const avgValueForType =
        sameTipeLeads.length > 0
          ? sameTipeLeads.reduce((sum, l) => sum + (l.valor_estimado_contrato || 0), 0) /
            sameTipeLeads.length
          : 0;

      const leadsWithOrigin =
        allLeads?.filter((l) => l.origem === lead.origem) || [];
      const originPercentage =
        allLeads && allLeads.length > 0
          ? ((leadsWithOrigin.length / allLeads.length) * 100).toFixed(1)
          : 0;

      return {
        diasNaEtapa,
        diasTotalCriado,
        avgValueForType,
        originPercentage,
        leadsComMesmoTipo: sameTipeLeads.length,
      };
    },
    enabled: !!card && !!lead,
  });

  if (!stats) {
    return <div className="text-xs text-muted-foreground">Carregando...</div>;
  }

  const valuePercentage = lead.valor_estimado_contrato
    ? ((lead.valor_estimado_contrato / (stats.avgValueForType || 1)) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-3 border-t pt-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Análise & Comparativos
      </h3>

      {/* Days in stage */}
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Dias nesta etapa</p>
          <p className="text-sm font-semibold">{stats.diasNaEtapa} dias</p>
        </div>
      </div>

      {/* Total days */}
      <div className="flex items-center gap-3">
        <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Total desde criação</p>
          <p className="text-sm font-semibold">{stats.diasTotalCriado} dias</p>
        </div>
      </div>

      {/* Value vs type average */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Valor vs. média do tipo</p>
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold">{valuePercentage}%</p>
            <p className="text-xs text-muted-foreground">
              (média: R$ {stats.avgValueForType.toLocaleString("pt-BR", {
                maximumFractionDigits: 0,
              })})
            </p>
          </div>
        </div>
      </div>

      {/* Origin percentage */}
      <div className="bg-secondary/30 rounded p-2">
        <p className="text-xs text-muted-foreground mb-1">
          {stats.originPercentage}% dos leads vêm de "{lead.origem}"
        </p>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full"
            style={{ width: `${Math.min(parseFloat(stats.originPercentage as string), 100)}%` }}
          />
        </div>
      </div>

      {/* Same type count */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        <p>
          <span className="font-semibold">{stats.leadsComMesmoTipo}</span> leads do mesmo tipo
          estão no pipeline
        </p>
      </div>
    </div>
  );
}
