-- Recommended Database Improvements for Pipeline-Buddy
-- Author: @data-engineer (Dara)
-- Date: 2026-02-20
-- Purpose: Add missing indexes, constraints, and improvements identified in DB-AUDIT.md

-- Note: This is a DDL migration script for recommended improvements.
-- Review each change before applying to production.

-- ============================================================================
-- SECTION 1: PERFORMANCE INDEXES (HIGH PRIORITY)
-- ============================================================================
-- These indexes directly improve query performance for common access patterns

-- Index 1: Kanban board ordering (KanbanPage.tsx uses ORDER BY data_entrada_etapa)
CREATE INDEX IF NOT EXISTS idx_cards_data_entrada_etapa
  ON public.cards(data_entrada_etapa DESC);

-- Index 2: Kanban board filtering (implicit filtering by etapa in column grouping)
CREATE INDEX IF NOT EXISTS idx_cards_etapa
  ON public.cards(etapa);

-- Index 3: Composite index for common query: "get cards in stage, ordered by date"
CREATE INDEX IF NOT EXISTS idx_cards_etapa_date
  ON public.cards(etapa, data_entrada_etapa DESC);

-- Index 4: Movement audit timeline queries
CREATE INDEX IF NOT EXISTS idx_movimentacoes_criado_em
  ON public.movimentacoes(criado_em DESC);

-- Index 5: Lead filtering by type (reports)
CREATE INDEX IF NOT EXISTS idx_leads_tipo_cliente
  ON public.leads(tipo_cliente);

-- Index 6: Lead ordering by creation date (reports)
CREATE INDEX IF NOT EXISTS idx_leads_criado_em
  ON public.leads(criado_em DESC);

-- ============================================================================
-- SECTION 2: DATA INTEGRITY CONSTRAINTS (HIGH PRIORITY)
-- ============================================================================

-- Constraint 1: Enforce 1:1 relationship between leads and cards
-- This prevents multiple cards per lead (design intent)
-- Note: If existing data has multiple cards per lead, add WHERE clause:
--   ALTER TABLE public.cards
--   ADD CONSTRAINT unique_lead_per_card UNIQUE (lead_id)
--   WHERE (SELECT COUNT(*) FROM cards c2 WHERE c2.lead_id = lead_id) = 1;
ALTER TABLE public.cards
  ADD CONSTRAINT unique_lead_per_card UNIQUE (lead_id);

-- Constraint 2: Validate quantity of properties is positive
-- Prevents negative or zero values which are nonsensical
ALTER TABLE public.leads
  ADD CONSTRAINT check_quantidade_imoveis_positive
  CHECK (quantidade_imoveis IS NULL OR quantidade_imoveis > 0);

-- Constraint 3: Validate estimated contract value is positive
-- Prevents negative values which are nonsensical
ALTER TABLE public.leads
  ADD CONSTRAINT check_valor_estimado_positive
  CHECK (valor_estimado_contrato IS NULL OR valor_estimado_contrato > 0);

-- Constraint 4: Validate data_entrada_etapa is not in the future
-- Prevents impossible timestamps from being recorded
ALTER TABLE public.cards
  ADD CONSTRAINT check_data_entrada_not_future
  CHECK (data_entrada_etapa <= now());

-- Constraint 5: Validate movimentacao stage values
-- Ensures audit log only records valid stage transitions
ALTER TABLE public.movimentacoes
  ADD CONSTRAINT check_etapa_anterior_valid
  CHECK (etapa_anterior IN ('REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO', 'CONTRATO_GERADO', 'VENDA_FECHADA'));

ALTER TABLE public.movimentacoes
  ADD CONSTRAINT check_etapa_nova_valid
  CHECK (etapa_nova IN ('REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO', 'CONTRATO_GERADO', 'VENDA_FECHADA'));

-- Constraint 6: Ensure stage transitions are actually transitions
-- Prevents recording "moved from X to X"
ALTER TABLE public.movimentacoes
  ADD CONSTRAINT check_etapa_different
  CHECK (etapa_anterior != etapa_nova);

-- ============================================================================
-- SECTION 3: DATABASE FUNCTIONS (HIGH PRIORITY)
-- ============================================================================

-- Function 1: Atomic lead + card creation
-- Solves race condition in LeadsPage.tsx where lead creation succeeds but card creation fails
CREATE OR REPLACE FUNCTION create_lead_with_initial_card(
  p_nome TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_empresa TEXT,
  p_tipo_cliente TEXT,
  p_quantidade_imoveis INTEGER DEFAULT NULL,
  p_valor_estimado_contrato NUMERIC DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS TABLE(lead_id UUID, card_id UUID) AS $$
DECLARE
  v_lead_id UUID;
  v_card_id UUID;
BEGIN
  -- Insert lead and capture its ID
  INSERT INTO public.leads (
    nome, email, telefone, empresa, tipo_cliente,
    quantidade_imoveis, valor_estimado_contrato, origem, observacoes
  )
  VALUES (
    p_nome, p_email, p_telefone, p_empresa, p_tipo_cliente,
    p_quantidade_imoveis, p_valor_estimado_contrato, p_origem, p_observacoes
  )
  RETURNING id INTO v_lead_id;

  -- Insert initial card in same transaction
  INSERT INTO public.cards (lead_id, etapa)
  VALUES (v_lead_id, 'REUNIAO_REALIZADA')
  RETURNING id INTO v_card_id;

  -- Return both IDs to client
  RETURN QUERY SELECT v_lead_id, v_card_id;
EXCEPTION WHEN OTHERS THEN
  -- Transaction automatically rolls back on error
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: TRIGGERS FOR DATA CONSISTENCY (MEDIUM PRIORITY)
-- ============================================================================

-- Trigger 1: Validate movimentacao transitions match card state
-- Ensures etapa_anterior in movimentacoes always matches the previous stage
-- This prevents audit log inconsistencies
CREATE OR REPLACE FUNCTION validate_movimentacao_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_current_etapa TEXT;
  v_previous_etapa TEXT;
BEGIN
  -- Get current stage from card
  SELECT etapa INTO v_current_etapa
  FROM public.cards
  WHERE id = NEW.card_id;

  -- If this is not the first transition, verify etapa_anterior matches
  -- the previous movement's etapa_nova
  SELECT MAX(etapa_nova) INTO v_previous_etapa
  FROM public.movimentacoes
  WHERE card_id = NEW.card_id
    AND criado_em < NEW.criado_em;

  -- Validation: if there's a previous movement, it should match etapa_anterior
  -- If there's no previous movement, etapa_anterior should match first card's initial stage
  IF v_previous_etapa IS NOT NULL THEN
    IF NEW.etapa_anterior != v_previous_etapa THEN
      RAISE EXCEPTION 'etapa_anterior % does not match previous movement %',
        NEW.etapa_anterior, v_previous_etapa;
    END IF;
  ELSIF NEW.etapa_anterior != 'REUNIAO_REALIZADA' THEN
    -- First movement should start from REUNIAO_REALIZADA
    RAISE EXCEPTION 'First movement must have etapa_anterior = REUNIAO_REALIZADA, got %',
      NEW.etapa_anterior;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present (safety)
DROP TRIGGER IF EXISTS validate_movimentacao_transition_trigger ON public.movimentacoes;

-- Create trigger
CREATE TRIGGER validate_movimentacao_transition_trigger
BEFORE INSERT ON public.movimentacoes
FOR EACH ROW
EXECUTE FUNCTION validate_movimentacao_transition();

-- ============================================================================
-- SECTION 5: AUDIT COLUMNS (MEDIUM PRIORITY)
-- ============================================================================
-- These columns enable multi-user tracking and compliance

-- Add user attribution to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add user attribution to cards
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add user attribution to movimentacoes
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- ============================================================================
-- SECTION 6: SOFT DELETE SUPPORT (MEDIUM PRIORITY)
-- ============================================================================
-- Enables GDPR compliance and data recovery without permanent deletion

-- Add soft delete timestamp to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add soft delete timestamp to cards
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for soft delete queries (faster filtering out deleted records)
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at
  ON public.leads(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cards_deleted_at
  ON public.cards(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- SECTION 7: VIEW DEFINITIONS FOR REPORTING (LOW PRIORITY)
-- ============================================================================

-- View 1: Active leads and cards (excludes soft-deleted)
CREATE OR REPLACE VIEW v_active_leads_with_cards AS
SELECT
  l.id as lead_id,
  l.nome,
  l.email,
  l.telefone,
  l.empresa,
  l.tipo_cliente,
  l.quantidade_imoveis,
  l.valor_estimado_contrato,
  l.origem,
  l.observacoes,
  l.criado_em as lead_created_at,
  c.id as card_id,
  c.etapa,
  c.data_entrada_etapa,
  c.criado_em as card_created_at
FROM public.leads l
LEFT JOIN public.cards c ON l.id = c.lead_id
WHERE l.deleted_at IS NULL
  AND c.deleted_at IS NULL;

-- View 2: Movement history with stage progression
CREATE OR REPLACE VIEW v_movement_history AS
SELECT
  m.id,
  m.card_id,
  c.lead_id,
  l.nome as lead_name,
  l.empresa,
  m.etapa_anterior,
  m.etapa_nova,
  EXTRACT(EPOCH FROM (m.criado_em - LAG(m.criado_em) OVER (
    PARTITION BY m.card_id ORDER BY m.criado_em
  ))) / 86400 as dias_na_etapa_anterior,
  m.criado_em,
  ROW_NUMBER() OVER (PARTITION BY m.card_id ORDER BY m.criado_em) as transition_number
FROM public.movimentacoes m
JOIN public.cards c ON m.card_id = c.id
JOIN public.leads l ON c.lead_id = l.id
WHERE l.deleted_at IS NULL
  AND c.deleted_at IS NULL;

-- View 3: Pipeline statistics by stage
CREATE OR REPLACE VIEW v_pipeline_stats AS
SELECT
  c.etapa,
  COUNT(DISTINCT c.id) as card_count,
  COUNT(DISTINCT l.id) as lead_count,
  SUM(l.valor_estimado_contrato) as total_value,
  AVG(l.valor_estimado_contrato) as avg_value,
  MIN(l.valor_estimado_contrato) as min_value,
  MAX(l.valor_estimado_contrato) as max_value
FROM public.cards c
LEFT JOIN public.leads l ON c.lead_id = l.id
WHERE c.deleted_at IS NULL
  AND l.deleted_at IS NULL
GROUP BY c.etapa
ORDER BY c.etapa;

-- ============================================================================
-- SECTION 8: MIGRATION SAFETY NOTES
-- ============================================================================
/*

BEFORE APPLYING THIS MIGRATION:

1. **Backup Database**
   - Create snapshot in Supabase dashboard
   - Test in staging environment first

2. **Constraint Addition Safety**
   - If adding UNIQUE constraint on cards.lead_id:
     Run first: SELECT lead_id, COUNT(*) FROM cards GROUP BY lead_id HAVING COUNT(*) > 1;
     If results, decide how to handle duplicates before adding constraint

   - If adding CHECK constraints:
     Run first: SELECT * FROM <table> WHERE <constraint would fail>;
     If results, data is invalid. Fix or delete before adding constraint.

3. **Index Addition**
   - Safe to add online, does not block queries
   - May take a few seconds on large tables
   - No data loss

4. **Function/Trigger Addition**
   - Safe to add, does not affect existing data
   - Test new function before using in application

5. **View Addition**
   - Safe to add, read-only

6. **Rollback Plan**
   - DROP INDEX idx_cards_data_entrada_etapa;
   - DROP INDEX idx_cards_etapa;
   - ... (drop other new objects in reverse order)

7. **Deployment Order**
   - Step 1: Add indexes (no data risk)
   - Step 2: Add constraints (test for violations first)
   - Step 3: Add triggers (test function separately)
   - Step 4: Add audit columns (safe)
   - Step 5: Add soft delete columns (safe)
   - Step 6: Create views (safe)

*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Note: Verification queries can be run separately in SQL Editor
-- to confirm all indexes and constraints were created successfully
