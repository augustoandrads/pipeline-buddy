import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/crm";

export const useLeads = () => {
  const queryClient = useQueryClient();

  // Fetch all leads
  const {
    data: leads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  // Create a new lead with initial card
  const createLeadMutation = useMutation({
    mutationFn: async (newLead: Omit<Lead, "id" | "criado_em">) => {
      // Use the atomic function to create lead + card in one transaction
      const { data, error } = await supabase.rpc("create_lead_with_card", {
        p_name: newLead.nome,
        p_email: newLead.email,
        p_company: newLead.empresa,
        p_tipo_cliente: newLead.tipo_cliente,
        p_telefone: newLead.telefone,
        p_quantidade_imoveis: newLead.quantidade_imoveis,
        p_valor_estimado_contrato: newLead.valor_estimado_contrato,
        p_origem: newLead.origem,
        p_observacoes: newLead.observacoes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate the leads query to refetch
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });

  return {
    leads,
    isLoading,
    error,
    createLead: createLeadMutation.mutate,
    isCreatingLead: createLeadMutation.isPending,
  };
};
