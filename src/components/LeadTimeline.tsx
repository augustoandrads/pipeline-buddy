import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movimentacao, ETAPAS } from "@/types/crm";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeadTimelineProps {
  cardId: string;
}

const ETAPA_LABELS: Record<string, string> = ETAPAS.reduce(
  (acc, etapa) => ({ ...acc, [etapa.key]: etapa.label }),
  {}
);

export function LeadTimeline({ cardId }: LeadTimelineProps) {
  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["movimentacoes", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*")
        .eq("card_id", cardId)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as Movimentacao[];
    },
    enabled: !!cardId,
  });

  if (movimentacoes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">Sem histórico de movimentações</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64 pr-4">
      <div className="space-y-4">
        {movimentacoes.map((mov, index) => {
          const time = formatDistanceToNow(new Date(mov.criado_em), {
            addSuffix: true,
            locale: ptBR,
          });

          const etapaAnteriorLabel =
            ETAPA_LABELS[mov.etapa_anterior] || mov.etapa_anterior;
          const etapaNovaLabel = ETAPA_LABELS[mov.etapa_nova] || mov.etapa_nova;

          return (
            <div key={mov.id} className="flex gap-3">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                {index < movimentacoes.length - 1 && (
                  <div className="w-0.5 h-8 bg-border my-1" />
                )}
              </div>

              {/* Timeline content */}
              <div className="flex-1 pb-4">
                <div className="text-xs text-muted-foreground mb-1">{time}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium bg-secondary/50 px-2 py-1 rounded">
                    {etapaAnteriorLabel}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                    {etapaNovaLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
