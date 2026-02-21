-- Sprint 1.5: Atomic Lead + Card Creation & Race Condition Fix
-- This migration adds database functions for atomically creating leads with initial cards

-- 1. Add unique constraint on email to prevent race conditions
ALTER TABLE leads ADD CONSTRAINT unique_lead_email UNIQUE(email) WHERE email IS NOT NULL;

-- 2. Create atomic function for lead + card creation
CREATE OR REPLACE FUNCTION create_lead_with_card(
  p_name VARCHAR,
  p_email VARCHAR,
  p_company VARCHAR,
  p_tipo_cliente VARCHAR,
  p_telefone VARCHAR DEFAULT NULL,
  p_quantidade_imoveis INTEGER DEFAULT NULL,
  p_valor_estimado_contrato DECIMAL DEFAULT NULL,
  p_origem VARCHAR DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS TABLE(lead_id UUID, card_id UUID) AS $$
DECLARE
  v_lead_id UUID;
  v_card_id UUID;
BEGIN
  -- Insert lead (email uniqueness enforced by constraint)
  INSERT INTO leads (
    nome,
    email,
    empresa,
    tipo_cliente,
    telefone,
    quantidade_imoveis,
    valor_estimado_contrato,
    origem,
    observacoes,
    created_by
  ) VALUES (
    p_name,
    p_email,
    p_company,
    p_tipo_cliente,
    p_telefone,
    p_quantidade_imoveis,
    p_valor_estimado_contrato,
    p_origem,
    p_observacoes,
    p_created_by
  )
  RETURNING leads.id INTO v_lead_id;

  -- Insert initial card (REUNIAO_REALIZADA stage)
  INSERT INTO cards (
    lead_id,
    etapa,
    data_entrada,
    status,
    created_by
  ) VALUES (
    v_lead_id,
    'REUNIAO_REALIZADA',
    NOW(),
    'REUNIAO_REALIZADA',
    p_created_by
  )
  RETURNING cards.id INTO v_card_id;

  -- Return both IDs
  RETURN QUERY SELECT v_lead_id, v_card_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Create verification function to check for race conditions
CREATE OR REPLACE FUNCTION verify_lead_card_consistency()
RETURNS TABLE(lead_id UUID, card_count INT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    COALESCE(COUNT(c.id)::INT, 0) AS card_count,
    CASE
      WHEN COUNT(c.id) = 0 THEN 'ORPHANED_LEAD'
      WHEN COUNT(c.id) = 1 THEN 'OK'
      ELSE 'DUPLICATE_CARDS'
    END AS status
  FROM leads l
  LEFT JOIN cards c ON l.id = c.lead_id
  GROUP BY l.id;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_lead_with_card IS
  'Atomically creates a lead and its initial card in a single transaction. '
  'Prevents race conditions and orphaned leads. Returns lead_id and card_id.';

COMMENT ON FUNCTION verify_lead_card_consistency IS
  'Verifies data consistency between leads and cards. '
  'Returns ORPHANED_LEAD, OK, or DUPLICATE_CARDS status.';
