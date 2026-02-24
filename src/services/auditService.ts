/**
 * Serviço de auditoria para rastrear alterações em leads
 */

import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  entity_type: 'lead' | 'card';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'move';
  field_name?: string;
  old_value?: string | number | null;
  new_value?: string | number | null;
  changed_by: string;
  changed_at: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Registra uma mudança de valor em um lead
 */
export async function logLeadValueChange(
  leadId: string,
  oldValue: number | null,
  newValue: number | null,
  userId: string = 'anonymous'
): Promise<void> {
  try {
    // TODO: Implementar quando tabela audit_logs estiver criada no Supabase
    // const { error } = await supabase
    //   .from('audit_logs')
    //   .insert({
    //     entity_type: 'lead',
    //     entity_id: leadId,
    //     action: 'update',
    //     field_name: 'valor_estimado_contrato',
    //     old_value: oldValue,
    //     new_value: newValue,
    //     changed_by: userId,
    //     changed_at: new Date().toISOString(),
    //   });
    // if (error) throw error;

    console.log(
      `[AUDIT] Lead ${leadId}: valor alterado de R$ ${oldValue} para R$ ${newValue} por ${userId}`
    );
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    // Não falhar operação principal se auditoria falhar
  }
}

/**
 * Registra movimento de card entre etapas
 */
export async function logCardMovement(
  cardId: string,
  leadId: string,
  oldStage: string,
  newStage: string,
  userId: string = 'anonymous'
): Promise<void> {
  try {
    console.log(
      `[AUDIT] Card ${cardId} (Lead ${leadId}): movido de ${oldStage} para ${newStage} por ${userId}`
    );
    // Já registrado em movimentacoes table
  } catch (error) {
    console.error('Erro ao registrar movimento:', error);
  }
}

/**
 * Atualiza o lastActivityAt de um lead
 */
export async function updateLeadLastActivity(leadId: string): Promise<void> {
  try {
    // TODO: Implementar quando coluna last_activity_at estiver criada
    // const { error } = await supabase
    //   .from('leads')
    //   .update({ last_activity_at: new Date().toISOString() })
    //   .eq('id', leadId);
    // if (error) throw error;

    console.log(`[AUDIT] Lead ${leadId}: última atividade atualizada`);
  } catch (error) {
    console.error('Erro ao atualizar última atividade:', error);
  }
}

/**
 * Obtém o histórico de alterações de um lead
 */
export async function getLeadAuditHistory(leadId: string): Promise<AuditLogEntry[]> {
  try {
    // TODO: Implementar quando tabela audit_logs estiver criada
    // const { data, error } = await supabase
    //   .from('audit_logs')
    //   .select('*')
    //   .eq('entity_id', leadId)
    //   .eq('entity_type', 'lead')
    //   .order('changed_at', { ascending: false });
    // if (error) throw error;
    // return data || [];

    console.log(`[AUDIT] Histórico do lead ${leadId}: (em desenvolvimento)`);
    return [];
  } catch (error) {
    console.error('Erro ao obter histórico de auditoria:', error);
    return [];
  }
}
