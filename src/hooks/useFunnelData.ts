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
      // Fetch all leads (total na primeira etapa)
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id");

      if (leadsError) throw leadsError;

      const totalLeads = leads?.length ?? 0;

      // Fetch all movements to count progression through each stage
      const { data: movements, error: movementsError } = await supabase
        .from("movimentacoes")
        .select("etapa_nova");

      if (movementsError) throw movementsError;

      // Count how many times each stage appears in etapa_nova
      const stageCounts: Record<string, number> = {};
      movements?.forEach((m) => {
        stageCounts[m.etapa_nova] = (stageCounts[m.etapa_nova] ?? 0) + 1;
      });

      // Build funnel data
      const funnelData: FunnelData[] = [];

      // First stage: all leads start in REUNIAO_REALIZADA
      const reuniaoRealizada: FunnelData = {
        etapa: "REUNIAO_REALIZADA",
        label: "Reunião Realizada",
        count: totalLeads,
        conversionRate: 100,
        color: "bg-blue-500",
      };
      funnelData.push(reuniaoRealizada);

      // Calculate conversion rates for subsequent stages
      let previousCount = totalLeads;

      // For each remaining stage, count how many reached it
      const remainingStages: Etapa[] = [
        "PROPOSTA_ENVIADA",
        "EM_NEGOCIACAO",
        "CONTRATO_GERADO",
        "VENDA_FECHADA",
      ];

      remainingStages.forEach((stage) => {
        const count = stageCounts[stage] ?? 0;
        const conversionRate = previousCount > 0 ? Math.round((count / previousCount) * 100) : 0;

        const etapaConfig = ETAPAS.find((e) => e.key === stage);

        funnelData.push({
          etapa: stage,
          label: etapaConfig?.label ?? stage,
          count,
          conversionRate,
          color: "bg-blue-500", // Will be colored based on position
        });

        previousCount = count;
      });

      return funnelData;
    },
  });
};
