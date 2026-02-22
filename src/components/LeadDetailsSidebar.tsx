import { Lead, TIPO_CLIENTE_LABELS } from "@/types/crm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Mail, Phone, Building2, DollarSign, Tags, FileText, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadDetailsSidebarProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsSidebar({ lead, open, onOpenChange }: LeadDetailsSidebarProps) {
  if (!lead) return null;

  const createdDate = new Date(lead.criado_em);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: ptBR });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold">{lead.nome}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground mt-1">
                {lead.empresa}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-6">
            {/* Tipo Cliente Badge */}
            {lead.tipo_cliente && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tipo de Cliente
                </label>
                <Badge variant="secondary" className="w-full justify-center py-1.5">
                  {TIPO_CLIENTE_LABELS[lead.tipo_cliente]}
                </Badge>
              </div>
            )}

            {/* Contato */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Informações de Contato
              </h3>

              {/* Email */}
              {lead.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-sm font-medium break-all hover:text-primary transition-colors"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Telefone */}
              {lead.telefone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <a
                      href={`tel:${lead.telefone}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {lead.telefone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Empresa e Detalhes */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Detalhes da Empresa
              </h3>

              {/* Empresa */}
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="text-sm font-medium">{lead.empresa}</p>
                </div>
              </div>

              {/* Quantidade de Imóveis */}
              {lead.quantidade_imoveis && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Quantidade de Imóveis</p>
                    <p className="text-sm font-medium">{lead.quantidade_imoveis}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Valor e Origem */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Oportunidade
              </h3>

              {/* Valor Estimado */}
              {lead.valor_estimado_contrato && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Valor Estimado</p>
                    <p className="text-sm font-bold text-primary">
                      R$ {lead.valor_estimado_contrato.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Origem */}
              {lead.origem && (
                <div className="flex items-start gap-3">
                  <Tags className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <Badge variant="outline" className="text-xs">
                      {lead.origem}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            {lead.observacoes && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Observações
                </h3>
                <div className="flex gap-3">
                  <FileText className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lead.observacoes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data de Criação */}
            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Criado {timeAgo}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
