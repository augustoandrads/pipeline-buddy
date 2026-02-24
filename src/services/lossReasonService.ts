/**
 * Service for managing lead loss reasons (US-06, US-07)
 */

import { supabase } from "@/integrations/supabase/client";
import { LeadLoss, LossReason } from "@/types/crm";

/**
 * Record when a lead is marked as lost
 */
export async function recordLeadLoss(
  leadId: string,
  cardId: string,
  reason: LossReason,
  otherDetails?: string
): Promise<LeadLoss | null> {
  try {
    // Validate required fields
    if (!leadId || !cardId || !reason) {
      throw new Error("leadId, cardId, and reason are required");
    }

    // Validate otherDetails if reason is OTHER
    if (reason === "OTHER" && (!otherDetails || otherDetails.trim().length < 10)) {
      throw new Error("Other details must be at least 10 characters");
    }

    const { data, error } = await supabase
      .from("lead_losses")
      .insert({
        lead_id: leadId,
        card_id: cardId,
        reason,
        other_details: otherDetails || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadLoss;
  } catch (error) {
    console.error("Error recording lead loss:", error);
    throw error;
  }
}

/**
 * Get loss history for a specific lead
 */
export async function getLeadLossHistory(
  leadId: string
): Promise<LeadLoss | null> {
  try {
    const { data, error } = await supabase
      .from("lead_losses")
      .select("*")
      .eq("lead_id", leadId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as LeadLoss | null;
  } catch (error) {
    console.error("Error fetching lead loss history:", error);
    return null;
  }
}

/**
 * Get loss statistics for dashboard (US-07)
 */
export async function getLossStatistics(startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from("lead_losses")
      .select("reason, lead_id, leads(valor_estimado_contrato)");

    if (startDate) {
      query = query.gte("criado_em", startDate);
    }
    if (endDate) {
      query = query.lte("criado_em", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by reason
    const stats: Record<
      string,
      { count: number; totalValue: number; leads: string[] }
    > = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data || []).forEach((record: Record<string, any>) => {
      const reason = record.reason;
      if (!stats[reason]) {
        stats[reason] = { count: 0, totalValue: 0, leads: [] };
      }
      stats[reason].count += 1;
      stats[reason].totalValue += record.leads?.valor_estimado_contrato || 0;
      stats[reason].leads.push(record.lead_id);
    });

    return stats;
  } catch (error) {
    console.error("Error fetching loss statistics:", error);
    return {};
  }
}

/**
 * Get detailed lost leads list
 */
export async function getLostLeads(startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from("lead_losses")
      .select(
        "*, leads(id, nome, empresa, valor_estimado_contrato), cards(etapa)"
      )
      .order("criado_em", { ascending: false });

    if (startDate) {
      query = query.gte("criado_em", startDate);
    }
    if (endDate) {
      query = query.lte("criado_em", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching lost leads:", error);
    return [];
  }
}
