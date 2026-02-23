-- Migration: Initial Schema Hardening + Performance Indexes
-- Date: 2026-02-24
-- Description: Add indexes, constraints, and soft delete columns

-- ============================================================================
-- SECTION: Performance Indexes
-- ============================================================================

-- Index on leads.etapa for frequent filtering
CREATE INDEX idx_leads_etapa ON leads(etapa);
COMMENT ON INDEX idx_leads_etapa IS 'For filtering leads by stage (e.g., WHERE etapa = ''negotiation'')';

-- Index on leads.data_entrada_etapa for sorting by stage entry time
CREATE INDEX idx_leads_data_entrada_etapa ON leads(data_entrada_etapa DESC);
COMMENT ON INDEX idx_leads_data_entrada_etapa IS 'For sorting/filtering leads by time in stage';

-- Composite index for audit log queries by lead_id and created date
CREATE INDEX idx_auditlog_lead_created ON audit_log(lead_id, created_at DESC);
COMMENT ON INDEX idx_auditlog_lead_created IS 'For querying audit trail by lead and date';

-- ============================================================================
-- SECTION: Data Integrity Constraints
-- ============================================================================

-- Ensure 1:1 relationship between cards and leads
ALTER TABLE cards
ADD CONSTRAINT unique_lead_card UNIQUE(lead_id);
COMMENT ON CONSTRAINT unique_lead_card ON cards IS 'Enforce one card per lead (1:1 relationship)';

-- Validate contract_value is positive
ALTER TABLE leads
ADD CONSTRAINT positive_contract_value CHECK(contract_value > 0);
COMMENT ON CONSTRAINT positive_contract_value ON leads IS 'Contract value must be positive';

-- Validate quantity is positive
ALTER TABLE leads
ADD CONSTRAINT positive_quantity CHECK(quantity > 0);
COMMENT ON CONSTRAINT positive_quantity ON leads IS 'Quantity must be positive';

-- Ensure stage entry time is not in future
ALTER TABLE leads
ADD CONSTRAINT valid_stage_timestamp CHECK(data_entrada_etapa <= NOW());
COMMENT ON CONSTRAINT valid_stage_timestamp ON leads IS 'Stage entry time cannot be in future';

-- ============================================================================
-- SECTION: Soft Delete Support (GDPR/LGPD Compliance)
-- ============================================================================

-- Add soft delete column to leads table
ALTER TABLE leads
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_leads_deleted ON leads(deleted_at);
COMMENT ON COLUMN leads.deleted_at IS 'Soft delete timestamp for GDPR/LGPD compliance';

-- Add soft delete column to cards table
ALTER TABLE cards
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_cards_deleted ON cards(deleted_at);
COMMENT ON COLUMN cards.deleted_at IS 'Soft delete timestamp for data recovery';

-- Add soft delete column to audit_log table
ALTER TABLE audit_log
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_auditlog_deleted ON audit_log(deleted_at);
COMMENT ON COLUMN audit_log.deleted_at IS 'Soft delete timestamp for audit trail';

-- ============================================================================
-- SECTION: Validation Queries (PRE-FLIGHT)
-- ============================================================================

-- Query to check constraint violations before applying (run this first)
-- SELECT COUNT(*) FROM cards GROUP BY lead_id HAVING COUNT(*) > 1;  -- Should be 0
-- SELECT COUNT(*) FROM leads WHERE contract_value < 0;  -- Should be 0
-- SELECT COUNT(*) FROM leads WHERE data_entrada_etapa > NOW();  -- Should be 0

-- ============================================================================
-- SECTION: ROLLBACK PROCEDURE
-- ============================================================================

-- To rollback this migration, run:
-- DROP INDEX IF EXISTS idx_leads_etapa;
-- DROP INDEX IF EXISTS idx_leads_data_entrada_etapa;
-- DROP INDEX IF EXISTS idx_auditlog_lead_created;
-- DROP INDEX IF EXISTS idx_leads_deleted;
-- DROP INDEX IF EXISTS idx_cards_deleted;
-- DROP INDEX IF EXISTS idx_auditlog_deleted;
-- ALTER TABLE cards DROP CONSTRAINT unique_lead_card;
-- ALTER TABLE leads DROP CONSTRAINT positive_contract_value;
-- ALTER TABLE leads DROP CONSTRAINT positive_quantity;
-- ALTER TABLE leads DROP CONSTRAINT valid_stage_timestamp;
-- ALTER TABLE leads DROP COLUMN deleted_at;
-- ALTER TABLE cards DROP COLUMN deleted_at;
-- ALTER TABLE audit_log DROP COLUMN deleted_at;
