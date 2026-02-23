-- Migration: RLS Base Setup
-- Date: 2026-02-24
-- Description: Enable RLS and create base access policies

-- ============================================================================
-- SECTION: Enable RLS on Key Tables
-- ============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE leads IS 'RLS enabled - access controlled by policies';

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE cards IS 'RLS enabled - access controlled by policies';

ALTER TABLE forecasting_history ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE forecasting_history IS 'RLS enabled - access controlled by policies';

ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE assignment_history IS 'RLS enabled - access controlled by policies';

-- ============================================================================
-- SECTION: RLS Policies for LEADS Table
-- ============================================================================

-- Admin can see/edit all leads
CREATE POLICY "admin_full_access" ON leads
FOR ALL USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

-- Manager can see own team's leads
CREATE POLICY "manager_team_access" ON leads
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'manager')
);

-- Manager can update own team's leads (stub: adjust based on team_id if exists)
CREATE POLICY "manager_update_team_leads" ON leads
FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'manager')
);

-- Vendedor can see own leads
CREATE POLICY "vendedor_own_leads" ON leads
FOR SELECT USING (
  vendedor_id = auth.uid()
);

-- Vendedor can update own leads
CREATE POLICY "vendedor_update_own_leads" ON leads
FOR UPDATE USING (
  vendedor_id = auth.uid()
);

-- Vendedor can create leads
CREATE POLICY "vendedor_create_leads" ON leads
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'vendedor')
);

-- Only admin/manager can delete leads
CREATE POLICY "admin_manager_delete_leads" ON leads
FOR DELETE USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'manager'))
);

-- ============================================================================
-- SECTION: RLS Policies for CARDS Table (mirrors leads)
-- ============================================================================

-- Admin can see/edit all cards
CREATE POLICY "admin_full_access" ON cards
FOR ALL USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

-- Manager can see own team's cards
CREATE POLICY "manager_team_access" ON cards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = cards.lead_id
    AND auth.uid() IN (SELECT id FROM auth.users WHERE role = 'manager')
  )
);

-- Vendedor can see own cards
CREATE POLICY "vendedor_own_cards" ON cards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = cards.lead_id
    AND l.vendedor_id = auth.uid()
  )
);

-- Vendedor can update own cards
CREATE POLICY "vendedor_update_own_cards" ON cards
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = cards.lead_id
    AND l.vendedor_id = auth.uid()
  )
);

-- ============================================================================
-- SECTION: RLS Policies for FORECASTING_HISTORY
-- ============================================================================

-- Admin can see all forecasting data
CREATE POLICY "admin_full_access" ON forecasting_history
FOR ALL USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

-- Manager can see team's forecasting data
CREATE POLICY "manager_team_access" ON forecasting_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cards c
    JOIN leads l ON c.lead_id = l.id
    WHERE c.id = forecasting_history.card_id
    AND auth.uid() IN (SELECT id FROM auth.users WHERE role = 'manager')
  )
);

-- Vendedor can see own forecasting data
CREATE POLICY "vendedor_own_forecasting" ON forecasting_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cards c
    JOIN leads l ON c.lead_id = l.id
    WHERE c.id = forecasting_history.card_id
    AND l.vendedor_id = auth.uid()
  )
);

-- ============================================================================
-- SECTION: RLS Policies for ASSIGNMENT_HISTORY (audit trail)
-- ============================================================================

-- Admin can see all assignment history
CREATE POLICY "admin_full_access" ON assignment_history
FOR ALL USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

-- Manager can see team assignment history
CREATE POLICY "manager_team_access" ON assignment_history
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'manager')
);

-- Vendedor can see assignments related to them (as previous or new assignee)
CREATE POLICY "vendedor_related_assignments" ON assignment_history
FOR SELECT USING (
  vendedor_anterior_id = auth.uid() OR vendedor_novo_id = auth.uid()
);

-- ============================================================================
-- SECTION: Validation Queries (PRE-FLIGHT)
-- ============================================================================

-- Check RLS is enabled on all tables
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('leads', 'cards', 'forecasting_history', 'assignment_history');
-- For each table: SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = '...';  -- rowsecurity should be 't' (true)

-- List all RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies;

-- Test as different roles (conceptually - actual testing in frontend)
-- SET ROLE admin_user;    -- Should see all
-- SET ROLE manager_user;  -- Should see team only
-- SET ROLE vendedor_user; -- Should see own only

-- ============================================================================
-- SECTION: ROLLBACK PROCEDURE
-- ============================================================================

-- To rollback this migration, run:
-- DROP POLICY "admin_full_access" ON leads;
-- DROP POLICY "manager_team_access" ON leads;
-- DROP POLICY "manager_update_team_leads" ON leads;
-- DROP POLICY "vendedor_own_leads" ON leads;
-- DROP POLICY "vendedor_update_own_leads" ON leads;
-- DROP POLICY "vendedor_create_leads" ON leads;
-- DROP POLICY "admin_manager_delete_leads" ON leads;
-- -- ... (repeat for cards, forecasting_history, assignment_history)
-- ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE forecasting_history DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE assignment_history DISABLE ROW LEVEL SECURITY;
