import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Etapa, ETAPAS } from "@/types/crm";

export interface FunnelData {
  etapa: Etapa;
  label: string;
  count: number;
  conversionRate: number;
  color: string;
}

export const useFunnelData = () => {
  return useQuery({
    queryKey: ["funnelData"],
    queryFn: async () => {
      // Fetch all cards with their current stage
      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .select("etapa");

      if (cardsError) throw cardsError;

      // Count unique cards per stage (current position, not movements)
      const stageCounts: Record<string, number> = {};
      cards?.forEach((c) => {
        stageCounts[c.etapa] = (stageCounts[c.etapa] ?? 0) + 1;
      });

      // Build funnel data
      const funnelData: FunnelData[] = [];

      // All stages in sequence (from first to last)
      const allStages: Etapa[] = [
        "REUNIAO_REALIZADA",
        "PROPOSTA_ENVIADA",
        "EM_NEGOCIACAO",
        "CONTRATO_GERADO",
        "VENDA_FECHADA",
      ];

      let previousCount = 0;

      allStages.forEach((stage) => {
        const count = stageCounts[stage] ?? 0;

        // For first stage, use total count as baseline
        let conversionRate = 100;
        if (previousCount > 0) {
          conversionRate = Math.round((count / previousCount) * 100);
        } else if (count > 0) {
          // First stage sets the baseline
          conversionRate = 100;
        }

        const etapaConfig = ETAPAS.find((e) => e.key === stage);

        funnelData.push({
          etapa: stage,
          label: etapaConfig?.label ?? stage,
          count,
          conversionRate,
          color: "bg-blue-500",
        });

        previousCount = count;
      });

      return funnelData;
    },
  });
};
