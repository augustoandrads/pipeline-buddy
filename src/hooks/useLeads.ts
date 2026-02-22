import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createLeadWithCardRetry, CreateLeadInput } from "@/integrations/supabase/mutations";
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

  // Create a new lead with initial card (with exponential backoff retry)
  // Epic 1: TAREFA 4 - Implement retry logic for race condition prevention
  const createLeadMutation = useMutation({
    mutationFn: async (newLead: CreateLeadInput) => {
      // Use mutation with automatic retry logic (exponential backoff, max 4 attempts)
      // This prevents orphaned leads when card creation fails
      const result = await createLeadWithCardRetry(newLead);
      return result;
    },
    onSuccess: () => {
      // Invalidate the leads query to refetch with new data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    // Error handling is done in the component via mutation.error
    // The mutation will throw after all retries are exhausted
  });

  return {
    leads,
    isLoading,
    error,
    createLead: createLeadMutation.mutate,
    isCreatingLead: createLeadMutation.isPending,
    createLeadError: createLeadMutation.error,
  };
};
