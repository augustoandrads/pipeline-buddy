# 🔴 CRITICAL BUG REPORT - CF-0 Foundation

**Date**: 2026-02-22
**Priority**: CRITICAL
**Impact**: Core functionality broken (Kanban + Reporting)
**Reporter**: Gage (DevOps)

---

## BUG #1: Kanban Card Movement Error on Repeated Moves

### Location
- File: `src/pages/KanbanPage.tsx`
- Lines: 53-73 (moveCard mutation)

### Symptoms
1. User moves card once → ✅ Works
2. User moves same card again quickly → ❌ Error toast appears
3. User refreshes page → ✅ Card is actually in new position
4. UI shows error but data saved (state mismatch)

### Root Cause Analysis
```typescript
// Lines 53-73: moveCard mutation
const moveCard = useMutation({
  mutationFn: async ({ cardId, novaEtapa, etapaAnterior }) => {
    // ... update operations ...
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["cards"] });  // Full refetch
    toast({ title: "Card movido com sucesso!" });
  },
  onError: () => {
    toast({ title: "Erro ao mover card", variant: "destructive" });  // ← But no rollback!
  },
});
```

**Problems**:
1. **No Optimistic Update**: UI doesn't update immediately before server confirms
2. **No Rollback on Error**: If mutation fails, UI stays in wrong state
3. **No Error Details**: User doesn't know WHY it failed (RLS? Validation?)
4. **Potential RLS Issue**: Second move might trigger RLS policy blocking

### Expected Behavior
1. Move card → UI updates immediately (optimistic)
2. Server confirms → Keep UI state
3. Server rejects → Rollback UI to previous state + show error details

### Fix Required
Implement optimistic update pattern:
```typescript
- Save previous etapa state
- Update UI immediately
- Send mutation to server
- If success: keep UI state
- If error: rollback to previous state + detailed error message
```

---

## BUG #2: Relatório Duplicado - Funnel Data Counting Movements Instead of Leads

### Location
- File: `src/hooks/useFunnelData.ts`
- Lines: 26-37 (movement counting logic)

### Symptoms
1. Shows 4 "proposta enviada" in funnel
2. But only 2 "reunião realizada" (impossible, source must have more than destination)
3. Duplicate values impossible in valid sales funnel

### Root Cause Analysis
```typescript
// Lines 26-37: ❌ WRONG - Counts movements, not unique leads
const { data: movements, error: movementsError } = await supabase
  .from("movimentacoes")
  .select("etapa_nova");

// This counts EVERY movement record
movements?.forEach((m) => {
  stageCounts[m.etapa_nova] = (stageCounts[m.etapa_nova] ?? 0) + 1;
});
```

**Example of the Error**:
```
Lead A:  REUNIAO → PROPOSTA (1 movement to PROPOSTA)
Lead B:  REUNIAO → PROPOSTA → (back to REUNIAO) → PROPOSTA → EM_NEG (2 movements to PROPOSTA!)
Lead C:  REUNIAO → EM_NEG (0 movements to PROPOSTA)

Current Query Result:
- PROPOSTA_ENVIADA: 3 (WRONG! Counting movements)
- Actual unique leads in PROPOSTA: 2 (CORRECT)
```

### The Real Problem
- Funnel should show: "How many unique leads reached this stage?"
- Current implementation shows: "How many times did cards move TO this stage?"
- These are different! One lead can move to same stage multiple times.

### Fix Required
Use distinct count of **cards by their current etapa**:
```typescript
// Instead of counting movements:
const { data: cards } = await supabase
  .from("cards")
  .select("etapa");

// Count unique cards per etapa
const stageCounts = {};
cards?.forEach(c => {
  stageCounts[c.etapa] = (stageCounts[c.etapa] ?? 0) + 1;
});
```

OR count distinct card_ids from movements (first time each card reached each stage):
```sql
-- SQL query (better for performance):
SELECT DISTINCT ON (card_id)
  etapa_nova,
  COUNT(DISTINCT card_id)
FROM movimentacoes
GROUP BY etapa_nova;
```

---

## Impact Assessment

| Feature | Status | Users Affected |
|---------|--------|-----------------|
| Kanban drag-drop (2x+) | 🔴 BROKEN | All users |
| Funnel chart accuracy | 🔴 BROKEN | Management/Sales |
| Reporting metrics | 🔴 WRONG | Data-driven decisions |

---

## Testing Strategy

### BUG #1 Testing
1. Open Kanban page
2. Move card from "Reunião Realizada" to "Proposta Enviada" → ✅ Should succeed
3. Move SAME card again to "Em Negociação" → ✅ Should succeed (currently fails)
4. Repeat 3x without page refresh → ✅ All should succeed

### BUG #2 Testing
1. Open Relatórios page
2. Note funnel counts
3. Verify: First stage count ≥ all other stages (logical funnel)
4. Verify: No duplicate high values
5. Cross-check: Leads in "Proposta Enviada" stage should match funnel count

---

## Acceptance Criteria

- [ ] Card moves 3+ times consecutively without error
- [ ] Error messages show specific reason (RLS, validation, etc)
- [ ] Funnel shows valid progression (decreasing or equal)
- [ ] No duplicate/impossible counts
- [ ] All tests pass
- [ ] No regression in other features

---

## Timeline
- **Reported**: 2026-02-22 21:30 UTC
- **Target Fix**: ASAP (blocks feature)
- **Severity**: 🔴 CRITICAL
