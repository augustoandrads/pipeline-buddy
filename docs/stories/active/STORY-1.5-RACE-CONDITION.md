# STORY-1.5-RACE-CONDITION — Atomic Lead+Card Creation & Race Condition Fix

**Epic:** Brownfield Sprint 1
**Status:** Ready
**Priority:** High
**Points:** 5

---

## Description

When a new lead is created, the system must atomically create both the lead record AND its initial card in a single transaction. Currently, if the card creation fails after the lead is created, the database is left in an inconsistent state (lead exists but no card).

Additionally, rapid consecutive lead creation requests can trigger race conditions due to missing database constraints.

---

## Acceptance Criteria

- [ ] Lead + Card creation wrapped in atomic PostgreSQL transaction
- [ ] Initial card automatically created with REUNIÃO_REALIZADA status
- [ ] Unique constraint prevents duplicate leads by email
- [ ] Race condition test added and passing
- [ ] Rollback tested: if card fails, lead is rolled back
- [ ] API response includes both lead ID and card ID
- [ ] Documentation updated with new atomic function

---

## Scope

### In
- PostgreSQL transaction logic (atomic function)
- API endpoint modification to use atomic function
- Unit tests for race condition scenarios
- Database migration for constraints

### Out
- UI changes
- Frontend state management changes
- Notification system improvements

---

## Dependencies

- ✅ Sprint 1.0 completed (database migration ready)
- STORY-2.0 (can be done in parallel)

---

## Implementation Notes

**Database Changes:**
```sql
CREATE FUNCTION create_lead_with_initial_card(
  p_name VARCHAR,
  p_email VARCHAR,
  p_company VARCHAR,
  p_type VARCHAR,
  p_created_by UUID
) RETURNS TABLE(lead_id UUID, card_id UUID) AS $$
BEGIN
  -- Insert lead
  INSERT INTO leads (nome, email, empresa, tipo_cliente, created_by)
  VALUES (p_name, p_email, p_company, p_type, p_created_by)
  RETURNING id INTO lead_id;

  -- Insert initial card
  INSERT INTO cards (lead_id, data_entrada, etapa, status, created_by)
  VALUES (lead_id, NOW(), 'initial', 'REUNIÃO_REALIZADA', p_created_by)
  RETURNING id INTO card_id;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

**API Change:**
Replace individual INSERT calls with single transaction using atomic function.

---

## Criteria of Done

- [ ] All acceptance criteria met
- [ ] Database migration executed and verified
- [ ] Unit tests pass (including race condition test)
- [ ] Integration test passes
- [ ] Code review approved
- [ ] QA gate PASS
- [ ] Documentation updated

---

## Change Log

- **2026-02-21 12:15 UTC** — Story created in YOLO mode
- **Status:** Ready for implementation
