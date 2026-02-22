// Epic 1: Database Hardening & Performance - TAREFA 4
// Mutations with Retry Logic for Race Condition Handling
// Author: @dev (Dex)
// Purpose: Implement exponential backoff retry strategy for atomic lead creation
// Pattern: Prevents orphaned leads when card creation fails

import { supabase } from './client';
import type { Lead } from '@/types/crm';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 4,
  initialBackoffMs: 50,
  maxBackoffMs: 2000,
  backoffMultiplier: 2,
};

// ============================================================================
// UTILITY: Exponential Backoff with Jitter
// ============================================================================

/**
 * Calculate exponential backoff time with optional jitter
 * Prevents thundering herd when multiple clients retry simultaneously
 */
function calculateBackoffMs(
  attempt: number,
  config: RetryConfig,
  addJitter: boolean = true
): number {
  const exponentialMs = Math.min(
    config.initialBackoffMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxBackoffMs
  );

  if (!addJitter) {
    return exponentialMs;
  }

  // Add ±20% jitter to prevent synchronized retries
  const jitter = exponentialMs * 0.2;
  return exponentialMs + (Math.random() - 0.5) * 2 * jitter;
}

/**
 * Sleep utility for awaiting retry delays
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN MUTATION: Create Lead with Card (with retry logic)
// ============================================================================

export interface CreateLeadInput extends Omit<Lead, 'id' | 'criado_em'> {}

export interface CreateLeadResponse {
  lead_id: string;
  card_id: string;
}

/**
 * Create a lead with its initial card atomically, with exponential backoff retry
 *
 * This function prevents race conditions where:
 * - Lead insert succeeds
 * - Card insert fails
 * - Result: Orphaned lead with no card
 *
 * Strategy:
 * 1. Call database RPC create_lead_with_card (transaction)
 * 2. If fails due to transient error:
 *    - Wait exponential backoff time
 *    - Retry (max 4 times)
 * 3. If fails due to permanent error (validation, duplicate):
 *    - Throw immediately (don't retry)
 * 4. If succeeds:
 *    - Return {lead_id, card_id}
 *
 * Backoff schedule:
 * - Attempt 1: 50ms base (no wait on first try)
 * - Attempt 2: 50ms + jitter
 * - Attempt 3: 100ms + jitter
 * - Attempt 4: 200ms + jitter
 * Total max wait: ~350ms (fast retry strategy)
 *
 * @param leadData - Lead data to create (nombre, email, etc.)
 * @param config - Optional retry configuration (defaults provided)
 * @returns {lead_id, card_id} or throws error if all retries exhausted
 */
export async function createLeadWithCardRetry(
  leadData: CreateLeadInput,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<CreateLeadResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      // Attempt: Call atomic RPC function
      const { data, error } = await supabase.rpc('create_lead_with_card', {
        p_name: leadData.nome,
        p_email: leadData.email,
        p_company: leadData.empresa,
        p_tipo_cliente: leadData.tipo_cliente,
        p_telefone: leadData.telefone || null,
        p_quantidade_imoveis: leadData.quantidade_imoveis || null,
        p_valor_estimado_contrato: leadData.valor_estimado_contrato || null,
        p_origem: leadData.origem || null,
        p_observacoes: leadData.observacoes || null,
      });

      // Success case
      if (!error && data && data.length > 0) {
        return data[0] as CreateLeadResponse;
      }

      // Error from RPC
      if (error) {
        lastError = new Error(`RPC Error: ${error.message}`);

        // Determine if error is transient (retry) or permanent (fail fast)
        const isTransientError =
          error.message.includes('ECONNREFUSED') || // Network error
          error.message.includes('timeout') || // Timeout
          error.message.includes('temporarily unavailable'); // Transient service error

        const isPermanentError =
          error.message.includes('UNIQUE violation') || // Duplicate email
          error.message.includes('CHECK violation') || // Constraint violation
          error.message.includes('FOREIGN KEY violation') || // Invalid type_cliente
          error.message.includes('NOT NULL violation'); // Missing required field

        if (isPermanentError) {
          // Don't retry permanent errors
          throw new Error(
            `Permanent error creating lead: ${error.message}. ` +
            `Attempt ${attempt + 1}/${config.maxRetries}. ` +
            `Check input validation.`
          );
        }

        if (!isTransientError) {
          // Unknown error - treat as transient
          console.warn(`Unknown error type: ${error.message}, retrying...`);
        }

        // Retry transient errors
        if (attempt < config.maxRetries - 1) {
          const backoffMs = calculateBackoffMs(attempt, config);
          console.debug(
            `Lead creation failed (attempt ${attempt + 1}), ` +
            `retrying in ${backoffMs.toFixed(0)}ms...`,
            { error: error.message }
          );
          await sleep(backoffMs);
          continue;
        }
      }

      throw new Error('No data returned from create_lead_with_card RPC');
    } catch (error) {
      lastError = error as Error;

      // Log each attempt for debugging
      console.error(
        `Lead creation attempt ${attempt + 1}/${config.maxRetries} failed:`,
        lastError.message
      );

      // If this is the last attempt, don't retry
      if (attempt === config.maxRetries - 1) {
        throw new Error(
          `Failed to create lead after ${config.maxRetries} attempts: ${lastError.message}`
        );
      }

      // Wait before next retry
      const backoffMs = calculateBackoffMs(attempt, config);
      await sleep(backoffMs);
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Unknown error in createLeadWithCardRetry');
}

// ============================================================================
// VERIFICATION MUTATION: Check Lead-Card Consistency
// ============================================================================

export interface LeadCardConsistency {
  lead_id: string;
  card_count: number;
  status: 'ORPHANED_LEAD' | 'OK' | 'DUPLICATE_CARDS';
}

/**
 * Verify that leads have the correct number of cards (1 per lead)
 * Used for post-deployment validation or debugging race conditions
 *
 * Returns:
 * - ORPHANED_LEAD: Lead with 0 cards (race condition occurred)
 * - OK: Lead with exactly 1 card (normal)
 * - DUPLICATE_CARDS: Lead with 2+ cards (schema issue)
 */
export async function verifyLeadCardConsistency(): Promise<LeadCardConsistency[]> {
  const { data, error } = await supabase.rpc('verify_lead_card_consistency');

  if (error) {
    throw new Error(`Failed to verify consistency: ${error.message}`);
  }

  return data as LeadCardConsistency[];
}

// ============================================================================
// OPTIONAL: Optimistic Update Pattern
// ============================================================================

/**
 * Optimistic lead creation with rollback capability
 *
 * This is an advanced pattern for React Query/SWR where:
 * 1. UI immediately shows new lead (optimistic)
 * 2. Request sent to server
 * 3. If success: UI updates confirmed
 * 4. If fail: UI reverts to previous state (rollback)
 *
 * Used by: useLeads.ts hook (onSuccess callback)
 */
export async function createLeadOptimistic(
  leadData: CreateLeadInput,
  onOptimisticUpdate: (tempLead: Lead) => void,
  onRollback: (tempLeadId: string) => void
): Promise<CreateLeadResponse> {
  // 1. Create temporary lead for optimistic UI
  const tempLeadId = `temp-${Date.now()}`;
  const tempLead: Lead = {
    id: tempLeadId,
    ...leadData,
    criado_em: new Date().toISOString(),
  };

  // 2. Show temporary lead in UI
  onOptimisticUpdate(tempLead);

  try {
    // 3. Attempt actual creation with retries
    const result = await createLeadWithCardRetry(leadData);
    return result;
  } catch (error) {
    // 4. On failure, rollback UI to previous state
    onRollback(tempLeadId);
    throw error;
  }
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * Public API:
 * 1. createLeadWithCardRetry() - Main mutation with exponential backoff
 * 2. verifyLeadCardConsistency() - Validation utility
 * 3. createLeadOptimistic() - Advanced UI pattern
 *
 * Usage in hooks (useLeads.ts):
 * ```typescript
 * const createLeadMutation = useMutation({
 *   mutationFn: (lead) => createLeadWithCardRetry(lead),
 *   onSuccess: () => queryClient.invalidateQueries(['leads']),
 *   onError: (error) => toast.error(error.message),
 * });
 * ```
 */
