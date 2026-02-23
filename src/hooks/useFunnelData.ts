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
      // Step 1: Count total leads (baseline for REUNIAO_REALIZADA)
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id");

      if (leadsError) throw leadsError;
      const totalLeads = leads?.length ?? 0;

      // Step 2: For each stage after REUNIAO, count DISTINCT cards that reached it
      // (via movimentacoes table - how many unique cards advanced to that stage)
      const { data: movements, error: movementsError } = await supabase
        .from("movimentacoes")
        .select("card_id, etapa_nova");

      if (movementsError) throw movementsError;

      // Count distinct card_ids per stage (how many reached each stage)
      const stageReachedCounts: Record<string, Set<string>> = {};
      movements?.forEach((m) => {
        if (!stageReachedCounts[m.etapa_nova]) {
          stageReachedCounts[m.etapa_nova] = new Set();
        }
        stageReachedCounts[m.etapa_nova].add(m.card_id);
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

      let previousCount = totalLeads; // Start with total leads

      allStages.forEach((stage, index) => {
        let count = 0;
        let conversionRate = 100;

        if (index === 0) {
          // First stage: all leads start here
          count = totalLeads;
          conversionRate = 100;
        } else {
          // Subsequent stages: count distinct cards that reached this stage
          count = stageReachedCounts[stage]?.size ?? 0;
          // Conversion rate from previous stage
          conversionRate = previousCount > 0 ? Math.round((count / previousCount) * 100) : 0;
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
