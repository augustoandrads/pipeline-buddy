# Database Migration Guide — Sprint 1.0, Task 1

## Objective
Apply performance indexes and integrity constraints to Pipeline Buddy database.

**Status:** Ready to Apply
**Migration File:** `supabase/migrations/20260220_recommended_indexes_and_constraints.sql`
**Expected Impact:** 10-100x query performance improvement

---

## Two Options to Apply Migration

### Option A: Using Supabase Dashboard (Recommended for First-Time)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `wnarqsqdsydrjmevioku`
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy entire contents of `supabase/migrations/20260220_recommended_indexes_and_constraints.sql`
6. Paste into SQL Editor
7. Review the migration (check SECTION 1-7 comments)
8. Click **Run** button
9. Verify success in the Results section

**Time:** ~2-3 minutes
**Risk:** Low (read the safety notes in migration file Section 8)

---

### Option B: Using Node.js Script (Automated)

#### Step 1: Get Database Connection String

1. Go to Supabase Dashboard
2. Select project `wnarqsqdsydrjmevioku`
3. Click **Project Settings** (gear icon)
4. Click **Database**
5. Copy connection string from "Connection pooling" section (URI)
   - Should look like: `postgresql://postgres:PASSWORD@db.XXX.supabase.co:5432/postgres`

#### Step 2: Set Environment Variable

```bash
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.wnarqsqdsydrjmevioku.supabase.co:5432/postgres"
```

#### Step 3: Run Migration Script

```bash
node scripts/apply-db-migration.js
```

**Time:** ~5-10 minutes
**Advantages:** Automated, repeatable, logged results

---

## What Gets Applied

### Performance Indexes (SECTION 1)
- `idx_cards_data_entrada_etapa` — Kanban board ordering
- `idx_cards_etapa` — Kanban board filtering
- `idx_cards_etapa_date` — Composite for common queries
- `idx_movimentacoes_criado_em` — Audit timeline queries
- `idx_leads_tipo_cliente` — Lead filtering
- `idx_leads_criado_em` — Lead ordering

### Data Integrity (SECTION 2)
- Unique constraint on cards.lead_id (1:1 relationship)
- CHECK constraints for positive values
- CHECK constraints for valid stage values
- Prevents invalid timestamps

### Database Functions (SECTION 3)
- `create_lead_with_initial_card()` — Atomic lead+card creation (fixes race condition)

### Triggers (SECTION 4)
- Validates stage transitions in audit log

### Audit Columns (SECTION 5)
- `created_by` and `updated_by` for leads, cards, movements
- `updated_at` timestamp

### Soft Delete Support (SECTION 6)
- `deleted_at` columns for soft deletes
- Indexes for soft delete queries

### Reporting Views (SECTION 7)
- `v_active_leads_with_cards` — Active data only
- `v_movement_history` — Stage progression timeline
- `v_pipeline_stats` — Statistical aggregates

---

## Verify Migration Success

After applying, run this verification query:

```sql
-- Should show all indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Should show all constraints created
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND (constraint_name LIKE '%check_%' OR constraint_name LIKE 'unique_%')
ORDER BY constraint_name;
```

**Expected Results:**
- 8+ indexes created
- 6+ constraints added
- 0 errors

---

## Performance Baseline

### Before Migration
```sql
-- Example slow query (without index)
SELECT * FROM cards
WHERE etapa = 'PROPOSTA_ENVIADA'
  AND data_entrada_etapa > now() - interval '7 days'
ORDER BY data_entrada_etapa DESC;
-- Time: ~500ms (sequential scan)
```

### After Migration
```sql
-- Same query (with index)
SELECT * FROM cards
WHERE etapa = 'PROPOSTA_ENVIADA'
  AND data_entrada_etapa > now() - interval '7 days'
ORDER BY data_entrada_etapa DESC;
-- Time: ~5-10ms (index scan) ← 50-100x faster! 🚀
```

**How to Verify:**
1. Supabase Dashboard → SQL Editor
2. Run query with `EXPLAIN ANALYZE` before and after migration
3. Compare execution time
4. Compare scan type (Seq Scan vs Index Scan)

---

## Rollback Plan (if needed)

If something goes wrong:

1. Go to Supabase Dashboard
2. Click **Backups** (in left sidebar)
3. Restore from point-in-time before 2026-02-20 22:00 UTC
4. All database changes will be undone

Alternative: Drop individual objects
```sql
DROP INDEX IF EXISTS idx_cards_data_entrada_etapa;
DROP INDEX IF EXISTS idx_cards_etapa;
-- ... etc
DROP FUNCTION IF EXISTS create_lead_with_initial_card;
```

---

## Next Steps After Migration

1. ✅ Migration applied
2. ⏳ Task 2: Mobile Sidebar (STORY-FE-001)
3. ⏳ Task 3: Keyboard Accessibility (STORY-FE-002)
4. ⏳ Commit all changes to git
5. ⏳ Run tests and validation

---

## Questions?

- Check `DB-AUDIT.md` for detailed query analysis
- Check `TECHNICAL-DEBT-ASSESSMENT.md` Section 2 for database findings
- Ask @data-engineer (Dara) for database questions

---

**Migration Created:** 2026-02-20
**Status:** ✅ Ready to Apply
**Estimated Time:** 5-10 minutes
