# Developer Handoff — Pipeline Buddy Technical Debt Implementation

**Status:** ✅ Ready to Start Sprint 1.0
**Date:** 2026-02-20
**Handoff From:** @architect (Aria) Brownfield Discovery Complete
**Handoff To:** @dev (Dex) Implementation Phase
**Total Effort:** 115-130 hours over 6-8 weeks

---

## 🎯 Quick Start (5 min read)

### What You're Building
Fix a well-built MVP (React + Supabase) to be production-ready. Focus on:
1. **Mobile** — 60% of users currently blocked
2. **Accessibility** — WCAG compliance (49% → 95%)
3. **Database** — Performance & integrity (missing indexes, constraints)
4. **Security** — Multi-user readiness (RLS, user tracking)

### Your First Task (Sprint 1.0 — Week 1)
**Do these in parallel:**
- Database engineer: Add 5 performance indexes (1h) → `STORY-DB-001`
- Frontend developer: Make sidebar responsive for mobile (10h) → `STORY-FE-001`
- Frontend developer: Add keyboard accessibility to drag-drop (6h) → `STORY-FE-002`

**By end of Week 1:** Unlock 60% mobile users + 15% accessibility users

### Timeline
- **Sprint 1.0** (Week 1): Foundation (21h)
- **Sprint 1.5** (Week 2): Safety (3h)
- **Sprint 2** (Weeks 3-4): Mobile Polish (30h) ← HEAVY
- **Sprint 3** (Weeks 5-6): Performance (18h)
- **Sprint 4+** (Weeks 7+): Future-proofing (20h)

---

## 📖 Documentation Index

**Read First (5-10 min):**
1. `TECHNICAL-DEBT-REPORT.md` — What & why (business context)
2. `IMPLEMENTATION-ROADMAP.md` — When & how (timeline + capacity)
3. `TECHNICAL-DEBT-ASSESSMENT.md` — Deep dive (full technical details)

**Reference During Development:**
- `BROWNFIELD-DISCOVERY-EPICS.yaml` — Epic definitions
- `docs/stories/epics/BROWNFIELD-DISCOVERY-EPICS.yaml` — Stories with acceptance criteria
- `SCHEMA.md` → Database schema review
- `DB-AUDIT.md` → Performance analysis
- `FRONTEND-SPEC.md` → Frontend architecture
- `UX-AUDIT.md` → UX findings
- `ACCESSIBILITY-CHECKLIST.md` → WCAG requirements
- `supabase/migrations/20260220_recommended_indexes_and_constraints.sql` → Ready-to-run SQL

---

## 🚀 Sprint 1.0 — START HERE (Week 1)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] `npm install` dependencies (done)
- [ ] Supabase CLI configured locally
- [ ] Git branch created: `feat/brownfield-sprint-1`

### Your Team Allocation
Assuming 1 developer (you can parallelize these):

**Priority Sequence (do in order):**

#### Task 1: Database Indexes (1h) → UNBLOCKS EVERYTHING
**Story:** `STORY-DB-001: Add Performance Indexes`

```bash
# File: supabase/migrations/20260220_recommended_indexes_and_constraints.sql
# Status: Migration ready to apply

# 1. Review the migration file
cat supabase/migrations/20260220_recommended_indexes_and_constraints.sql

# 2. Apply to local database
supabase db push

# 3. Verify indexes created
supabase db execute "SELECT indexname FROM pg_indexes WHERE tablename = 'cards';"

# 4. Benchmark before/after
# Before: SELECT * FROM cards WHERE etapa = 'em_andamento' AND data_entrada_etapa > now() - interval '7 days';
# After: Same query should be 10-100x faster

# 5. Commit
git add supabase/migrations/
git commit -m "feat: add performance indexes on hot query paths [Story-DB-001]"
```

**Success Criteria:**
- ✅ 5 indexes created (verify in DB)
- ✅ Query performance improved 10-100x (use EXPLAIN ANALYZE)
- ✅ No data loss or corruption

---

#### Task 2: Mobile Sidebar (10h) → UNBLOCKS 60% OF USERS
**Story:** `STORY-FE-001: Responsive Sidebar Navigation`

**Current State:** Sidebar is 240px fixed (breaks on mobile)
**Target State:** Responsive drawer on mobile, sidebar on desktop

```typescript
// File: src/components/Sidebar.tsx
// Status: Refactor needed

// Current structure:
export function Sidebar() {
  return (
    <aside className="w-60 bg-slate-900 text-white p-4"> {/* FIXED WIDTH */}
      <nav>{/* Navigation items */}</nav>
    </aside>
  )
}

// What to do:
// 1. Use useIsMobile() hook to detect viewport
// 2. On mobile: Render Sheet (shadcn drawer component)
// 3. On desktop: Render current sidebar
// 4. Update App.tsx layout to accommodate drawer

// Reference: shadcn/ui Sheet component
// Docs: https://ui.shadcn.com/docs/components/sheet

// Step-by-step:
// a) Import Sheet from @/components/ui/sheet
// b) Add hamburger button (Lucide: Menu icon) to header
// c) Create drawer that slides in from left
// d) Move all navigation items into drawer
// e) Test on breakpoints: 320px, 375px, 768px, 1024px, 1280px
```

**File Changes:**
- `src/components/Sidebar.tsx` — Refactor (add Sheet drawer)
- `src/App.tsx` — Update layout (sidebar vs drawer)
- `src/components/ui/sheet.tsx` — Already exists (shadcn)
- `src/hooks/use-mobile.tsx` — Already exists (useIsMobile)

**Testing:**
```bash
# Mobile breakpoints to test
# 320px (iPhone SE) - drawer fills screen
# 375px (iPhone 12) - drawer takes 80% width
# 768px (iPad) - transitions to sidebar
# 1024px+ (Desktop) - full sidebar

# Test in Chrome DevTools → Device toolbar
# Or: npm run dev → Open on phone (same WiFi, ngrok)
```

**Acceptance Criteria:**
- ✅ Mobile viewport (<768px) shows hamburger + drawer
- ✅ Desktop viewport (>1024px) shows sidebar
- ✅ Drawer animates smoothly (no jank)
- ✅ Navigation items all accessible in drawer
- ✅ Hamburger menu icon shows/hides drawer

---

#### Task 3: Keyboard Accessibility (6h) → UNBLOCKS 15% OF USERS
**Story:** `STORY-FE-002: Keyboard Accessibility for Drag-Drop`

**Current State:** Drag-drop only works with mouse
**Target State:** Can move cards with keyboard (arrow keys + Enter)

```typescript
// File: src/components/KanbanPage.tsx
// Status: Add KeyboardSensor

// What to do:
// 1. Import KeyboardSensor from @dnd-kit
// 2. Add to DndContext sensors
// 3. Implement keyboard handlers (arrow keys)
// 4. Test with NVDA/JAWS screen readers

// Reference: dnd-kit docs
// https://docs.dndkit.org/api-documentation/sensors/keyboard

// Step-by-step:
// a) Add KeyboardSensor to sensors array in DndContext
// b) Focus on card → arrow keys to navigate
// c) Enter key to select/drop card
// d) ESC to cancel
// e) Visual indicator (focus ring) on focused card

import { KeyboardSensor, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

// In DndContext:
<DndContext
  sensors={[MouseSensor, TouchSensor, KeyboardSensor]} // ADD THIS
  onDragEnd={handleDragEnd}
  collisionDetection={closestCorners}
>
```

**Files to Update:**
- `src/components/KanbanPage.tsx` — Add KeyboardSensor
- `src/components/KanbanCard.tsx` — Add focus-visible styling
- `src/index.css` — Add focus-visible ring style

**Testing:**
```bash
# Test keyboard navigation
# 1. Open Kanban page
# 2. Click on card (focus)
# 3. Press arrow keys (should navigate)
# 4. Press Enter (should start drag)
# 5. Press arrow keys (should move to new column)
# 6. Press Enter (should drop)

# Test with screen reader (Windows: NVDA, Mac: VoiceOver)
# npm run dev → Right-click → Inspect → Accessibility tab
```

**Acceptance Criteria:**
- ✅ Card can be moved with keyboard alone
- ✅ Focus ring visible on focused card
- ✅ Arrow keys navigate between columns
- ✅ Enter key selects/drops
- ✅ Screen reader announces card position

---

### After Sprint 1.0 Tasks Complete

**Commit & Push:**
```bash
git add .
git commit -m "feat: sprint 1.0 foundation - indexes, mobile sidebar, keyboard a11y [Sprint-1.0]"
git push origin feat/brownfield-sprint-1
```

**Notify:**
- [ ] @qa (Quinn) — Ready for testing
- [ ] @architect (Aria) — Tasks complete, proceed to Sprint 1.5
- [ ] @pm (Morgan) — Update stakeholders: 60% mobile unblocked, 15% a11y unblocked

**Metrics Captured:**
- Before/After query performance (indexes)
- Mobile usability score (sidebar)
- Keyboard navigation coverage (a11y)

---

## 📋 Sprint 1.5 — Race Condition Fix (Week 2)

**Story:** `STORY-DB-002: Atomic Lead+Card Creation`

**Why:** Currently, lead can be created without card (or vice versa) if request fails mid-operation

**What to do:**
```sql
-- Create database function for atomic creation
CREATE OR REPLACE FUNCTION create_lead_with_card(
  p_nome TEXT,
  p_email TEXT,
  -- ... other params
) RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  -- Insert lead
  INSERT INTO leads (nome, email, ...) VALUES (...) RETURNING id INTO v_lead_id;

  -- Insert card in initial stage
  INSERT INTO cards (lead_id, etapa, data_entrada_etapa)
  VALUES (v_lead_id, 'lead', now());

  RETURN v_lead_id;
EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically in transaction
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Update API call to use function
-- Old: INSERT into leads, then INSERT into cards
-- New: SELECT create_lead_with_card(...)
```

**Files:**
- `supabase/migrations/20260220_atomic_lead_creation.sql` — New migration
- `src/integrations/supabase/client.ts` — Update create lead function
- `src/components/LeadModal.tsx` — No changes needed

**Testing:**
```bash
# Simulate race condition with concurrency test
# Try to create 100 leads simultaneously
# Verify: 100 leads + 100 cards (no orphans)

# Load test:
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/leads \
    -H "Content-Type: application/json" \
    -d "{\"nome\": \"Lead $i\", \"email\": \"lead$i@test.com\"}" &
done
wait

# Verify in DB:
SELECT COUNT(*) FROM leads;          -- Should be 100
SELECT COUNT(*) FROM cards;          -- Should be 100
SELECT COUNT(DISTINCT lead_id) FROM cards; -- Should be 100
```

**Acceptance Criteria:**
- ✅ Lead + Card created atomically (both or neither)
- ✅ 0 orphaned leads after concurrent creates
- ✅ API handles transaction rollback gracefully

---

## 📋 Sprint 2 — Mobile & Accessibility Polish (Weeks 3-4)

**Stories:** `STORY-FE-003` to `STORY-FE-010` + `STORY-ACC-001` to `STORY-ACC-002`

This is the **HEAVY sprint** (30 hours). Focus:
- Responsive table (card view on mobile)
- WCAG accessibility (aria-labels, focus management)
- Mobile Kanban view

**Key Stories:**
- `STORY-FE-003: Responsive LeadsPage Table` (12h)
- `STORY-ACC-001: Add Aria-Labels` (6h)
- `STORY-ACC-002: Fix Focus Management` (4h)

See `TECHNICAL-DEBT-ASSESSMENT.md` Section 5 for detailed Sprint 2 breakdown.

---

## 📋 Sprint 3 — Performance & Compliance (Weeks 5-6)

**Stories:** `STORY-PERF-001` to `STORY-PERF-003` + `STORY-ACC-003` + `STORY-DATA-001`

Focus:
- Code splitting (lazy load pages)
- WCAG final audit (target 95%)
- Soft delete preparation

---

## 📋 Sprint 4+ — DevOps & Future-Proofing (Weeks 7+)

**Stories:** `STORY-DEVOPS-001`, `STORY-DATA-002`, etc.

Focus:
- CI/CD pipeline (GitHub Actions)
- Monitoring setup (Sentry)
- Admin UI for soft-deleted recovery

---

## 🔗 Key Resources

### Database
- Schema: `supabase/migrations/` directory
- DDL to apply: `supabase/migrations/20260220_recommended_indexes_and_constraints.sql`
- Query analysis: `DB-AUDIT.md` Section 2

### Frontend
- Architecture: `FRONTEND-SPEC.md`
- Components: `src/components/` directory
- Design system: Tailwind config in `tailwind.config.ts`
- Accessibility: `ACCESSIBILITY-CHECKLIST.md`

### Testing
- Unit tests: `vitest` in `src/test/`
- Manual testing: Chrome DevTools → Device toolbar
- Screen reader: NVDA (Windows), VoiceOver (Mac)
- Performance: Lighthouse in Chrome DevTools

### Git & Commits
- Commit message format: `feat: description [Story-XX]`
- Branch naming: `feat/brownfield-sprint-1`
- Always reference story ID in commit

---

## ⚠️ Critical Blockers & Dependencies

**Order Matters:**

1. **Database Indexes (1h)** → DO FIRST
   - Unblocks all other work
   - No dependencies
   - Run indexes before constraints

2. **Mobile Sidebar (10h)** → DO SECOND (can parallelize with indexes)
   - Required before Sprint 2 responsive table work
   - Dependency: useIsMobile() hook (exists)
   - Dependency: Sheet component from shadcn (exists)

3. **Keyboard Accessibility (6h)** → DO THIRD (can parallelize)
   - Enables 15% of users with disabilities
   - Dependency: @dnd-kit/keyboard (exists)

4. **Race Condition (3h)** → DO IN SPRINT 1.5
   - Depends on indexes from Sprint 1.0
   - Must be done before multi-user launch

**Parallelizable:**
- Indexes + Sidebar work can happen simultaneously
- Keyboard a11y can happen alongside sidebar

**Not Parallelizable:**
- Sprint 1.0 must complete before Sprint 2
- Race condition fix depends on indexes

---

## 🧪 Testing Checklist

### Before Each Commit
- [ ] `npm run lint` passes (ESLint)
- [ ] `npm run typecheck` passes (TypeScript)
- [ ] `npm test` passes (Unit tests)
- [ ] `npm run build` succeeds (Production build)

### Functional Testing
- [ ] Desktop browser (Chrome 120+, Firefox 121+, Safari 17+)
- [ ] Mobile breakpoints (320px, 375px, 768px, 1024px)
- [ ] Keyboard navigation (Tab, Arrow, Enter, Esc)
- [ ] Screen reader (NVDA or VoiceOver)

### Performance Testing
- [ ] Lighthouse score >85
- [ ] Query performance <10ms (use EXPLAIN ANALYZE)
- [ ] Bundle size <100KB gzipped

---

## 📞 Communication & Escalation

### Daily Standup
- What did you complete?
- What are you working on?
- Any blockers?

### Report Issues to:
- **Database issues** → @data-engineer (Dara)
- **Design/UX issues** → @ux-design-expert (Uma)
- **Architecture questions** → @architect (Aria)
- **QA/Testing issues** → @qa (Quinn)

### Escalation Path
1. Try to solve (1-2 hours)
2. Ask on Slack/Discord
3. Schedule 15min sync with domain expert
4. If still blocked: @architect escalates to @aios-master

---

## 📊 Progress Tracking

### Sprint 1.0 Metrics (Track Daily)
- [ ] Database indexes deployed (1h) → 0 items blocked
- [ ] Mobile sidebar in progress (10h) → X% complete
- [ ] Keyboard a11y in progress (6h) → X% complete
- [ ] Query performance baseline captured (before/after)
- [ ] Mobile usability tested on real devices

### Sprint Completion Criteria
All stories meet acceptance criteria:
- ✅ Code changes reviewed
- ✅ Tests passing (unit + manual)
- ✅ Committed to git
- ✅ Documented in story file
- ✅ Ready for QA gate

---

## 🎯 Success Looks Like

**End of Week 1 (Sprint 1.0):**
- 60% of users can now use mobile version (was 0%)
- 15% of accessibility users can navigate with keyboard (was 0%)
- Database queries 10-100x faster (indexed)
- 0 technical debt items from Sprint 1.0 remaining

**End of Week 2 (Sprint 1.5):**
- Race condition fix deployed
- Multi-user architecture safe
- 0 orphaned data during stress tests

**End of Week 4 (Sprint 2):**
- 95% mobile usable (Responsive table, Kanban mobile view)
- WCAG compliance 85%+ (accessibility foundation)
- All High-priority stories complete

**End of Week 6 (Sprint 3):**
- WCAG compliance 95%+ (full accessibility)
- Performance optimized (code splitting, bundle <100KB)
- Production-ready baseline achieved

**End of Week 8 (Sprint 4+):**
- CI/CD pipeline operational
- Monitoring enabled (Sentry)
- Full enterprise-grade readiness

---

## 📝 Next Steps

1. **Review this document** (5 min)
2. **Read TECHNICAL-DEBT-REPORT.md** (10 min) — Business context
3. **Read TECHNICAL-DEBT-ASSESSMENT.md** (30 min) — Technical details
4. **Create feature branch:** `git checkout -b feat/brownfield-sprint-1`
5. **Start Task 1:** Database indexes (1h)
6. **Track in GitHub issues** or Jira
7. **Daily commits** with story references
8. **Weekly standup** with team

---

## 🆘 Quick Help

**"I'm stuck on X"**
- Check `TECHNICAL-DEBT-ASSESSMENT.md` Section 4 (Debt Matrix)
- Check `TECHNICAL-DEBT-ASSESSMENT.md` Section 7 (Risk Mitigation)
- Ask in Slack: #pipeline-buddy or @architect

**"Query is slow"**
- Use `EXPLAIN ANALYZE` on query
- Check `DB-AUDIT.md` for index recommendations
- See `supabase/migrations/` for index DDL

**"Component is breaking"**
- Check `FRONTEND-SPEC.md` for component specs
- Run `npm run typecheck` for type errors
- Check browser console for errors

**"Accessibility test failing"**
- Use Chrome accessibility inspector
- Check `ACCESSIBILITY-CHECKLIST.md`
- Run `axe DevTools` browser extension

---

## 📞 Contact & Resources

**Team:**
- @architect (Aria) — Architecture questions
- @data-engineer (Dara) — Database questions
- @ux-design-expert (Uma) — UX/design questions
- @qa (Quinn) — Testing questions

**Documentation:**
- Full analysis: `/Users/augustoandrads/AIOS/pipeline-buddy/`
- Epic definitions: `docs/stories/epics/BROWNFIELD-DISCOVERY-EPICS.yaml`
- Stories ready: Each story has acceptance criteria in YAML

**Milestones:**
- Sprint 1.0 Goal: 60% mobile + 15% a11y by end of Week 1 ✅
- Sprint 2 Goal: 95% mobile + 85% WCAG by end of Week 4 ✅
- Sprint 3 Goal: 100% WCAG + CI/CD by end of Week 6 ✅
- Sprint 4+ Goal: Enterprise-ready by Week 8 ✅

---

**You're ready to start! Go build something great. 🚀**

— Aria, arquitetando o futuro 🏗️

---

**Document Version:** 1.0
**Last Updated:** 2026-02-20
**Status:** ✅ Ready for Development
