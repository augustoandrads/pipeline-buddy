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
        .select("id, etapa");

      if (cardsError) throw cardsError;

      const cardsList = cards ?? [];

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

      // Define which stages come AFTER each stage (for funnel calculation)
      const stageHierarchy: Record<Etapa, Etapa[]> = {
        "REUNIAO_REALIZADA": [
          "REUNIAO_REALIZADA",
          "PROPOSTA_ENVIADA",
          "EM_NEGOCIACAO",
          "CONTRATO_GERADO",
          "VENDA_FECHADA",
        ],
        "PROPOSTA_ENVIADA": [
          "PROPOSTA_ENVIADA",
          "EM_NEGOCIACAO",
          "CONTRATO_GERADO",
          "VENDA_FECHADA",
        ],
        "EM_NEGOCIACAO": [
          "EM_NEGOCIACAO",
          "CONTRATO_GERADO",
          "VENDA_FECHADA",
        ],
        "CONTRATO_GERADO": ["CONTRATO_GERADO", "VENDA_FECHADA"],
        "VENDA_FECHADA": ["VENDA_FECHADA"],
      };

      let previousCount = cardsList.length; // Total cards as baseline

      allStages.forEach((stage) => {
        // Count cards that are in THIS STAGE or BEYOND (for funnel progression)
        const count = cardsList.filter((c) =>
          stageHierarchy[stage].includes(c.etapa as Etapa)
        ).length;

        // Conversion rate from previous stage
        const conversionRate = previousCount > 0 ? Math.round((count / previousCount) * 100) : 0;

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
