import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/types/crm";

export const useCards = () => {
  const queryClient = useQueryClient();

  // Fetch all cards with lead details
  const {
    data: cards = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*, leads(nome, empresa, email)")
        .order("data_entrada_etapa", { ascending: false });

      if (error) throw error;
      return data as Card[];
    },
  });

  // Update card stage (move in kanban)
  const updateCardStageMutation = useMutation({
    mutationFn: async ({
      cardId,
      newStage,
    }: {
      cardId: string;
      newStage: string;
    }) => {
      // Get current stage first
      const { data: currentCard, error: fetchError } = await supabase
        .from("cards")
        .select("etapa")
        .eq("id", cardId)
        .single();

      if (fetchError) throw fetchError;

      const currentStage = currentCard.etapa;

      // Update card stage
      const { error: updateError } = await supabase
        .from("cards")
        .update({
          etapa: newStage,
          data_entrada_etapa: new Date().toISOString(),
        })
        .eq("id", cardId);

      if (updateError) throw updateError;

      // Record the movement
      const { error: movementError } = await supabase
        .from("movimentacoes")
        .insert({
          card_id: cardId,
          etapa_anterior: currentStage,
          etapa_nova: newStage,
          criado_em: new Date().toISOString(),
        });

      if (movementError) throw movementError;

      return { cardId, newStage };
    },
    onSuccess: () => {
      // Invalidate both queries to refetch
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });

  // Get movement history for a card
  const {
    data: movements = [],
    isLoading: isLoadingMovements,
  } = useQuery({
    queryKey: ["movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    cards,
    isLoading,
    error,
    updateCardStage: updateCardStageMutation.mutate,
    isUpdatingStage: updateCardStageMutation.isPending,
    movements,
    isLoadingMovements,
  };
};
