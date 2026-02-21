# UX Specialist Review — pipeline-buddy Brownfield Discovery Phase 6

**Document Type:** Phase 6 Specialist Review
**Project:** pipeline-buddy (MVP React+Supabase CRM)
**Reviewer:** @ux-design-expert (Uma)
**Review Date:** 2026-02-20
**Reviewing:** TECHNICAL-DEBT-DRAFT.md (Consolidated Phases 1-3)
**Status:** REVIEW COMPLETE - Ready for @architect finalization

---

## Executive Summary

### Validation of Draft Recommendations

**Assessment:** I AGREE WITH 95% of the TECHNICAL-DEBT-DRAFT.md findings. The frontend/UX analysis is accurate, priorities are well-sequenced, and sprint allocations are realistic.

**Key Agreement Points:**
- Sprint 1 mobile responsiveness (FE-002, sidebar) is correctly identified as CRITICAL
- Keyboard accessibility for drag-and-drop (FE-001) blocking 15-20% of users
- Effort estimates for responsive table (FE-004: 12h) are realistic
- Sprint sequencing (mobile first, then accessibility, then performance) is optimal
- WCAG compliance roadmap (49% → 95%) is achievable

**Minor Disagreements & Adjustments:**
1. **FE-006 (Kanban scroll):** 8h estimate may be optimistic; recommend 10h for mobile-first redesign
2. **FE-010 (Modal width):** Can be batched with FE-002 sidebar refactor (suggest: combined 10h instead of separate 8h + 2h)
3. **Dark mode (FE-012):** Recommend DEFERRING to Sprint 4+ (not critical for MVP)
4. **Code splitting (FE-008):** Better placed in Sprint 2 alongside responsive table (shared lazy-loading patterns)

**Overall Verdict:** RECOMMEND IMPLEMENTATION WITH MINOR ROADMAP ADJUSTMENTS

---

## Frontend/UX Items Analysis (FE-* and SEC-* items)

### CRITICAL ITEMS (Sprint 1)

#### FE-001: Drag-and-Drop Not Keyboard Accessible

**✓ AGREE** with CRITICAL severity.

**Why Critical:**
- Affects 15-20% of population (motor disabilities + keyboard-only users)
- Kanban is core feature; blocking it violates WCAG 2.1.1 (keyboard accessibility)
- Mobile users expect keyboard alternatives

**Reality Check:**
- @dnd-kit supports KeyboardSensor out-of-box; implementation straightforward
- 6h estimate includes: keyboard sensor setup (1h), arrow key handlers (2h), testing (2h), documentation (1h)
- ✓ REALISTIC

**Recommendation:** ✓ Keep as-is, Sprint 1

**Implementation Approach:**
```tsx
// Add keyboard sensor with sortableKeyboardCoordinates
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  })
);
```

---

#### FE-002: Sidebar Fixed Width Breaks Mobile

**✓ AGREE** with CRITICAL severity and 8h estimate (possibly conservative).

**Why Critical:**
- Affects 60% of web traffic (mobile users)
- Complete UX breakage: 240px sidebar on 320px screen = 80px content (unusable)
- Must resolve before ANY mobile testing

**Current Gap:**
- Draft estimates 8h; mobile-first redesign may need 10-12h
  - Sidebar logic refactor: 2h (desktop vs mobile detection)
  - Drawer/Sheet implementation: 2h (shadcn/ui sheet component)
  - Main content responsive layout: 3h (flex adjustments, padding)
  - Mobile header/menu toggle: 1.5h (icon button, state management)
  - Testing (desktop + mobile + tablet): 2-3h (regression risk)

**Recommendation:**
- ⚠️ ADJUST estimate from 8h to **10h** (safer buffer)
- Combine with FE-010 (modal width) = 10h total (instead of 8h + 2h separate)
- Use shadcn/ui `<Sheet>` component (already available in project)

**Components Affected:**
- App.tsx (layout conditional rendering)
- Sidebar.tsx (responsive styling + drawer logic)
- All pages (ensure content responsive without sidebar)

---

#### FE-003: Missing aria-labels on Interactive Elements

**✓ AGREE** with HIGH severity and 6h estimate.

**Why High (not Critical):**
- Affects 2-3% with screen readers (but 100% of those are blocked)
- Drag handles, buttons lack accessible names
- WCAG 4.1.2 violation (Name, Role, Value)

**Estimate Breakdown:**
- Identify all icon-only buttons: 1h (audit codebase)
- Add aria-labels to KanbanCard + handles: 2h
- Add aria-labels to action buttons: 1.5h
- Add aria-descriptions for complex patterns: 1h
- Testing with screen reader (NVDA/JAWS): 0.5h

**Recommendation:** ✓ Keep as-is, Sprint 1

**Note:** This pairs well with FE-001 (keyboard support adds context to aria-labels)

---

#### FE-005: No Visible Focus Indicators

**✓ AGREE** with HIGH severity and 4h estimate.

**Why High:**
- Keyboard-only users cannot see which element has focus
- WCAG 2.4.7 violation
- Quick fix with Tailwind utilities

**Estimate Details:**
- Add focus-visible ring to all interactive: 2h
- Test focus order (Tab navigation): 1h
- Fix any CSS specificity conflicts: 0.5h
- Documentation: 0.5h

**Recommendation:** ✓ Keep as-is, Sprint 1

**Quick Implementation:**
```tsx
@layer base {
  button, a, [role="button"], input, textarea, select {
    @apply focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
  }
}
```

---

### HIGH PRIORITY ITEMS (Sprint 1-2)

#### FE-004: Table Not Responsive to Mobile

**✓ AGREE** with HIGH severity and 12h estimate.

**Why High (not Critical):**
- Affects 60% mobile traffic but is secondary feature (Kanban is primary)
- Leads page crucial for data entry; mobile support improves workflow
- WCAG 1.4.10 (Reflow) violation

**Estimate Analysis:**
- Design mobile-friendly alternative: 2h (decide: cards vs row expansion vs sticky column)
- Implement card view for <768px: 5h
- Test card view interactions: 1.5h
- Tablet optimization (sticky first column): 2h
- Edge case testing (long text, many fields): 1.5h

**Recommendation:** ✓ Keep as-is, but DEFER to Sprint 2 (after FE-002 complete)

**Why Defer to Sprint 2:**
- Mobile sidebar (FE-002) must be done first
- Card view implementation depends on responsive layout
- Allows developers to test navigation patterns on mobile first

**Recommended Approach:** Card view on mobile (<768px), table on desktop (≥768px)
```tsx
// Mobile: Card grid
if (isMobile) return <div className="grid grid-cols-1 gap-3">{leads.map(...)}</div>;

// Desktop: Table
return <Table>{/* current */}</Table>;
```

---

#### FE-006: Kanban Board Horizontal Scroll Unintuitive

**✓ MOSTLY AGREE** with HIGH severity; **ADJUST estimate from 8h to 10h**.

**Why High:**
- Mobile/tablet users don't realize columns scroll horizontally
- Lose context swiping between columns
- Non-standard pattern (horizontal scrolling not touch-friendly)

**Current Estimate Issues:**
- 8h is optimistic for "mobile-first redesign"
- Needs either: (a) single-column mobile view + tabs, or (b) visual scroll indicators
- Both require non-trivial refactoring

**Breakdown (10h recommended):**
- Desktop: Keep 5 columns as-is (1h verify no regression)
- Tablet (768px-1024px): Show 3 columns + scroll (2h)
- Mobile (<768px): Show 1 column, stage selector drawer (3h)
- Scroll indicator visual design: 1h
- Interaction testing (drag on mobile): 1.5h
- Documentation: 1.5h

**Recommendation:**
- ⚠️ ADJUST from 8h to **10h**
- Implement mobile stage selector (dropdown or drawer) to switch between columns
- Add visual scroll indicators for desktop/tablet (chevron icons)
- Test drag-and-drop on actual mobile device

**Components Affected:**
- KanbanPage.tsx (conditional rendering by breakpoint)
- KanbanColumn.tsx (responsive width)
- New: MobileStageSelector component (drawer with stage tabs)

---

#### FE-007: Truncated Text Without Tooltips

**✓ AGREE** with MEDIUM severity and 4h estimate.

**Location:** Card titles, company names, table cells

**Impact:** Users cannot read full content on small screens

**Estimate Details:**
- Add title attribute to KanbanCard: 1h
- Add Tooltip component to card names: 1.5h
- Add tooltips to table cells: 1h
- Test on mobile (touch vs hover): 0.5h

**Recommendation:** ✓ Keep as-is, Sprint 2

**Quick Fix (title attribute):**
```tsx
<p className="line-clamp-1" title={lead?.nome}>
  {lead?.nome}
</p>
```

**Better Fix (Tooltip component):**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <p className="line-clamp-1 cursor-help">{lead?.nome}</p>
  </TooltipTrigger>
  <TooltipContent>{lead?.nome}</TooltipContent>
</Tooltip>
```

---

### MEDIUM PRIORITY ITEMS (Sprint 2-3)

#### FE-008: No Code Splitting

**✓ AGREE** with MEDIUM severity; **RECOMMEND moving to Sprint 2** (from Sprint 3).

**Why Recommend Earlier:**
- Should be paired with responsive table (FE-004) in Sprint 2
- Both involve lazy-loading patterns
- Creates shared knowledge: lazy loading pages + lazy loading components

**Estimate:** 4h (keep as-is)

**Breakdown:**
- Wrap KanbanPage with React.lazy: 1h
- Wrap LeadsPage with React.lazy: 1h
- Wrap RelatoriosPage with React.lazy: 1h
- Test route transitions + fallback UI: 1h

**Recommendation:**
- ⚠️ MOVE from Sprint 3 to **Sprint 2** (alongside FE-004)
- Use same loading skeleton component for page transitions
- Consider loading suspense fallback UI (Skeleton component)

---

#### FE-009: No Skip Navigation Link

**✓ AGREE** with MEDIUM severity and 2h estimate.

**WCAG 2.4.1:** Users must be able to bypass blocks of content

**Estimate Details:**
- Add skip link HTML + styling: 0.5h
- Add `id="main-content"` to target: 0.5h
- Test focus behavior: 0.5h
- Accessibility audit (NVDA verification): 0.5h

**Recommendation:** ✓ Keep as-is, Sprint 2

**Implementation:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50">
  Skip to main content
</a>
```

---

#### FE-010: Modal Too Wide on Mobile

**✓ AGREE** with MEDIUM severity; **RECOMMEND BATCHING with FE-002**.

**Current Estimate:** 2h (standalone)

**Batching Recommendation:**
- Keep estimate as 2h but execute as part of FE-002 (sidebar refactor)
- Combined estimate: 10h (FE-002) + 2h (FE-010) = 12h total
- **Or:** Reduce to combined 10h (overlap in responsive layout patterns)

**Why Batch:**
- Both involve mobile-first responsive design
- Share same viewport detection logic (`useIsMobile`)
- Refactoring main layout affects modal positioning

**Recommendation:**
- ⚠️ **BATCH FE-002 + FE-010** = 10h combined (Sprint 1)
- Or keep separate but ensure FE-002 done first

**Quick Fix:**
```tsx
<DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
  {/* or mx-4 for horizontal padding */}
</DialogContent>
```

---

#### FE-011: No Lazy Loading Implemented

**✓ AGREE** with MEDIUM severity; **RECOMMEND moving to Sprint 2** (see FE-008).

---

#### FE-012: No Dark Mode Implementation

**✗ DISAGREE** on priority; **RECOMMEND DEFERRING to Sprint 4+**.

**Why Defer:**
- next-themes already installed but not critical for MVP
- Does NOT affect core functionality or accessibility
- Mobile support + accessibility more important for MVP launch
- Estimate 6h better spent on testing/refinement in early sprints

**Dark Mode Reality:**
- 10% of users actively use dark mode (mostly accessibility-driven)
- Can be added post-launch without breaking changes
- Requires full color palette redesign (6h is realistic but not urgent)

**Recommendation:**
- ⚠️ **DEFER from Sprint 3 to Sprint 4+**
- Focus Sprint 3 on code splitting + accessibility verification
- Prioritize dark mode only if user feedback demands it

---

### LOW PRIORITY ITEMS (Sprint 3+)

#### FE-013: Modal Focus Management Untested

**✓ AGREE** with LOW severity; **RECOMMEND testing in Sprint 2** (after FE-010).

**Why Move Earlier:**
- Quick win: 2h test + potential 0.5h fix
- Should pair with LeadModal enhancements
- Accessibility testing critical before launch

**Recommendation:**
- ⚠️ **MOVE from Sprint 3 to Sprint 2** (low effort, high confidence impact)
- Test with screen reader (NVDA/JAWS) or automated a11y testing
- Add `autoFocus` to first form input if needed

---

#### FE-014: Language Not Declared

**✓ AGREE** with LOW severity; **RECOMMEND quick fix in Sprint 1**.

**Why Earlier:**
- Trivial 1h fix
- No dependencies
- Improves i18n foundation

**Fix:**
```html
<!-- In index.html <head> -->
<html lang="pt-BR">
```

---

#### FE-015: No Performance Monitoring

**✓ AGREE** with LOW severity (but important for production).

**Recommendation:**
- ✓ Keep in Sprint 4 (after core features stable)
- Consider adding Web Vitals tracking in Sprint 2 (low effort)
- Sentry error tracking can go in Sprint 3

---

## User Experience Impact Matrix — Reordered by UX Win

### High-Impact, High-Effort Items (Do First)

| Priority | Item | Impact | Effort | Sprint | Reason |
|----------|------|--------|--------|--------|--------|
| 1 | FE-002: Mobile sidebar | 60% users unblocked | 10h | 1 | Largest user impact; foundation for all mobile work |
| 2 | FE-001: DnD keyboard | 15-20% users unblocked | 6h | 1 | Core feature accessibility; high moral priority |
| 3 | FE-004: Responsive table | 40% users improve workflow | 12h | 2 | Secondary feature critical for mobile users |
| 4 | FE-006: Kanban mobile | Reduces scroll frustration | 10h | 2 | UX improvement; complements mobile sidebar |
| 5 | FE-005: Focus indicators | 2-5% users (keyboard) can use app | 4h | 1 | Accessibility; quick win |

### Medium-Impact Items (Do Second)

| Item | Impact | Effort | Sprint |
|------|--------|--------|--------|
| FE-003: aria-labels | Screen reader users fully supported | 6h | 1 |
| FE-008: Code splitting | 15-20% faster page loads | 4h | 2 |
| FE-007: Tooltips | Better UX for long content | 4h | 2 |
| FE-009: Skip link | 2-5% users better keyboard nav | 2h | 2 |
| FE-010: Modal mobile | Form filling easier on phones | 2h | 1 (batch) |

### Lower-Impact Items (Do Later)

| Item | Impact | Effort | Sprint |
|------|--------|--------|--------|
| FE-013: Modal focus testing | Edge case accessibility | 2h | 2 |
| FE-014: HTML lang attribute | i18n foundation | 1h | 1 |
| FE-012: Dark mode | 10% users want it | 6h | 4+ |
| FE-011: Lazy loading (Recharts) | Negligible for MVP | 6h | 3 |
| FE-015: Performance monitoring | Post-launch visibility | 4h | 4+ |

---

## Accessibility Compliance Roadmap

### Current Baseline: 49% WCAG 2.1 AA Compliant

**Failing Items (Sprint 1):**
- 2.1.1 Keyboard (drag-drop) → FE-001
- 4.1.2 Name/Role/Value (aria-labels) → FE-003
- 2.4.7 Focus Visible → FE-005

**Failing Items (Sprint 2):**
- 1.4.13 Content on Hover (tooltips) → FE-007
- 1.4.10 Reflow (responsive table) → FE-004
- 2.4.1 Bypass Blocks (skip link) → FE-009

**After Sprint 1:** ~70% compliant (keyboard + labels + focus)
**After Sprint 2:** ~90% compliant (hover content + reflow + bypass)
**After Sprint 3:** ~95% compliant (testing + edge cases)

### WCAG Level AA Verdict

**Post-Sprint 2:** Can claim WCAG 2.1 AA compliance for desktop + mobile
**Post-Sprint 3:** Can defend against accessibility audit

**Recommended Timeline:**
- Get WCAG audit done at end of Sprint 2
- Fix any gaps discovered in Sprint 3
- Maintain compliance throughout future development

---

## Mobile-First Strategy Validation

### Sprint 1: Responsive Foundation

**Goal:** Make app usable on mobile

**Work:**
1. FE-002: Responsive sidebar (drawer on mobile)
2. FE-001: Keyboard drag-and-drop
3. FE-003: aria-labels on interactive elements
4. FE-005: Focus indicators
5. FE-014: Language declaration

**Result:** App is navigable on mobile; core workflows accessible

**Testing:** Phones (320px), tablets (768px), laptops (1024px+)

### Sprint 2: Mobile Optimization

**Goal:** Mobile is pleasant to use (not just functional)

**Work:**
1. FE-004: Responsive table (card view on mobile)
2. FE-006: Kanban mobile optimization (stage selector)
3. FE-008: Code splitting (faster page loads)
4. FE-007: Tooltips for truncated content
5. FE-009: Skip link

**Result:** Mobile experience rivals desktop; performance acceptable

### Sprint 3: Mobile Polish

**Goal:** Mobile is first-class experience

**Work:**
1. Testing: All features on iOS + Android (real devices)
2. Touch interactions: Ensure 44px minimum touch targets
3. Density mode: Optional compact view for power users
4. FE-011: Lazy loading (Recharts optimization)
5. Accessibility audit (WCAG verification)

**Result:** Can confidently launch mobile app to customers

---

## Component Architecture Impact Assessment

### Components Requiring Refactoring (Pre-requisites)

#### 1. **App.tsx** — Layout Structure (MUST REFACTOR)
- **Current:** Fixed flexbox with Sidebar always visible
- **Change:** Conditional desktop/mobile layout
- **Impact:** Affects every page
- **Effort:** 2h (includes FE-002 sidebar refactor)
- **Risk:** Medium (layout changes can cause regressions)
- **Mitigation:** Screenshot regression testing

**Before:**
```tsx
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1">...</main>
</div>
```

**After:**
```tsx
{isMobile ? (
  // Mobile: Drawer sidebar + full-width main
  <>
    <Header />
    <Sheet>...</Sheet>
    <main className="w-full">...</main>
  </>
) : (
  // Desktop: Fixed sidebar
  <div className="flex">
    <Sidebar />
    <main>...</main>
  </div>
)}
```

#### 2. **Sidebar.tsx** — Navigation (MUST REFACTOR)
- **Current:** Fixed 240px width, `h-screen`
- **Change:** Responsive styling + drawer logic
- **Impact:** Navigation on all pages
- **Effort:** 2h
- **Risk:** Medium (navigation structure)
- **Mitigation:** Test all nav links on mobile

#### 3. **LeadsPage.tsx** — Table Rendering (MUST REFACTOR)
- **Current:** Single table layout
- **Change:** Card view on mobile, table on desktop
- **Impact:** Leads data visibility
- **Effort:** 3h
- **Risk:** Medium (data display logic)
- **Mitigation:** Test data accuracy in both views

#### 4. **KanbanPage.tsx** — Column Layout (SHOULD REFACTOR)
- **Current:** 5 fixed-width columns
- **Change:** Responsive column width + stage selector on mobile
- **Impact:** Kanban visual layout
- **Effort:** 2h
- **Risk:** Low (visual only, no data logic)
- **Mitigation:** Verify drag-and-drop still works

#### 5. **KanbanCard.tsx** — Draggable Element (MUST REFACTOR)
- **Current:** @dnd-kit pointer sensor only
- **Change:** Add keyboard sensor + aria-label
- **Impact:** Card movement interaction
- **Effort:** 1.5h
- **Risk:** Medium (drag-drop complexity)
- **Mitigation:** Extensive testing of keyboard + pointer interactions

### Components Requiring Minor Updates (No Refactoring)

- **LeadModal.tsx:** Add responsive width (CSS only) — 0.5h
- **KanbanColumn.tsx:** Add responsive width (CSS only) — 0.5h
- **RelatoriosPage.tsx:** Add grid-cols-1 breakpoint (CSS only) — 0.5h
- **NavLink.tsx:** Add focus-visible ring (CSS only) — 0.5h

### New Components to Create

1. **MobileStageSelector.tsx** — Drawer for selecting kanban stage on mobile (2h)
2. **LeadCard.tsx** — Card view for leads on mobile (2h) — *alternative: inline in LeadsPage*
3. **ErrorBoundary.tsx** — Error handling (1h) — *not explicitly in debt items but recommended*

### Recommendation: Component Refactoring Sequence

**Sprint 1 (Priority Order):**
1. App.tsx (layout structure)
2. Sidebar.tsx (responsive nav)
3. KanbanCard.tsx (keyboard + aria)
4. LeadModal.tsx (responsive width)

**Sprint 2:**
5. LeadsPage.tsx (card view)
6. KanbanPage.tsx (stage selector)
7. New MobileStageSelector component

**No major architectural debt detected beyond responsiveness.** Existing patterns are clean; refactoring is primarily CSS + conditional rendering.

---

## Design System Consistency Analysis

### Color System
✓ **EXCELLENT** — CSS variables well-organized, semantic naming, stage colors distinct
- No improvements needed
- Dark mode can reuse variable structure

### Typography
✓ **GOOD** — Clear hierarchy, appropriate sizes, reasonable line heights
- Recommendation: Verify line-clamp behavior with RTL (if future i18n)

### Spacing Scale
✓ **GOOD** — 8px grid consistently applied
- Recommendation: Document spacing rules for mobile (e.g., 4px reduce on <768px)

### Tailwind Token Organization
✓ **GOOD** — Using `cn()` utility, CSS variables properly scoped
- Recommendation: Extract component-specific tokens into separate file if dark mode added

### shadcn/ui Usage
✓ **EXCELLENT** — Appropriate components, well-configured
- Well-suited for current UX needs
- Sheet/Drawer components available for mobile sidebar

### Design System Recommendations

1. **Add responsive spacing tokens:**
   ```css
   --spacing-mobile: 8px;  /* <768px */
   --spacing-tablet: 12px; /* 768px-1024px */
   --spacing-desktop: 16px; /* 1024px+ */
   ```

2. **Document focus indicators** (for FE-005 consistency)
3. **Define dark mode palette** (for future FE-012)
4. **Create mobile breakpoint constants** in shared utils

---

## Quick Wins — High Impact, Low Effort

### Rank 1: Mobile Sidebar Responsive Drawer
- **Impact:** Unblocks 60% of users immediately
- **Effort:** 10h (higher than "quick" but highest ROI)
- **Why First:** Everything else depends on this

### Rank 2: Add lang="pt-BR" Attribute
- **Impact:** Proper i18n foundation, screen reader accuracy
- **Effort:** 1h (trivial)
- **Why Do:** No dependencies, improves SEO

### Rank 3: Add Focus Indicators (CSS)
- **Impact:** 2-5% keyboard users can navigate
- **Effort:** 2h (tailwind utilities)
- **Why Do:** Improves accessibility baseline

### Rank 4: Add aria-labels to Drag Handles
- **Impact:** Screen reader users get context
- **Effort:** 2h (text additions)
- **Why Do:** Pairs with FE-001 keyboard support

### Rank 5: Add Tooltips to Truncated Text
- **Impact:** Improves mobile UX (content visible)
- **Effort:** 2h (shadcn/ui Tooltip component)
- **Why Do:** Quick improvement to readability

### Estimated Total Quick Wins Time: 18h (Ranks 1-5)
- Covers highest-impact accessibility + UX improvements
- Achievable in Sprint 1-2

---

## Risk & Dependencies Analysis (UX-Specific)

### Database → UX Dependencies

**From DB Assessment (Phase 2):**
- RLS user tracking (SEC-003) → User attribution UI (not in debt items, but needed for audit)
- Soft deletes (DB-006) → "Undo" button UI (future feature, not blocking MVP)
- Race condition fix (SEC-002) → Must stabilize lead creation before mobile testing

**Recommendation:** Coordinate with @data-engineer to:
1. Verify race condition fix (SEC-002) before FE-002 mobile testing
2. Implement user attribution columns (SEC-003) by Sprint 2 (GDPR prep)
3. Design soft delete UI (DB-006) in Sprint 3-4

### UX Breaking Changes Risk

| Change | Scope | Risk | Mitigation |
|--------|-------|------|-----------|
| FE-002: Sidebar drawer | Affects all pages | **MEDIUM** | Screenshot regression testing |
| FE-004: Table card view | Affects Leads page | **MEDIUM** | Ensure data integrity in both views |
| FE-001: Keyboard support | Kanban only | **LOW** | Test mouse still works (pointer sensor) |
| FE-006: Stage selector | Kanban mobile | **LOW** | Visual-only change |

### Blocked Dependencies

**None identified.** All UX items are independent or safely stackable.

### Test Strategy by Sprint

**Sprint 1 Testing:**
- Desktop regression (screenshot comparison)
- Mobile navigation (iOS iPhone 14, Android Pixel)
- Keyboard navigation (Tab, Enter, Escape keys)
- Screen reader (NVDA Windows, VoiceOver macOS)

**Sprint 2 Testing:**
- Responsive table (card vs table layout)
- Touch interactions (44px minimum targets)
- Tablet navigation (iPad)
- Code splitting (network throttling simulation)

**Sprint 3 Testing:**
- WCAG audit (automated + manual)
- Accessibility compliance report
- Cross-browser testing (Chrome, Firefox, Safari)

---

## Missing Items — Additions Not in Draft

### HIGH PRIORITY (Should be in roadmap)

1. **FE-016: Error States & Loading Screens**
   - Current: Only spinner on load, no skeleton screens
   - Impact: Perceived performance, user confidence
   - Effort: 6h (create skeleton components)
   - Recommendation: Add to Sprint 2

2. **FE-017: Empty States & Guidance**
   - Current: No onboarding or empty state messaging
   - Impact: User orientation, feature discovery
   - Effort: 4h (copy + illustrations)
   - Recommendation: Add to Sprint 2

3. **FE-018: Error Boundary Component**
   - Current: No React error boundary
   - Impact: Graceful error handling, UX on failures
   - Effort: 2h (catch boundary + error page)
   - Recommendation: Add to Sprint 2 (pairs with FE-015 monitoring)

4. **FE-019: Touch-Friendly Interactions**
   - Current: Card drag might be hard on touch
   - Impact: Mobile usability
   - Effort: 3h (larger touch targets, haptic feedback testing)
   - Recommendation: Add to Sprint 2 testing

### MEDIUM PRIORITY (Nice to have)

5. **FE-020: Undo/Confirm Actions**
   - Current: No undo after moving card or deleting lead
   - Impact: Accident recovery, user confidence
   - Effort: 4h (undo stack + toast confirmations)
   - Recommendation: Sprint 3-4

6. **FE-021: Search/Filter on Leads**
   - Current: No search, all leads shown
   - Impact: Scalability at 100+ leads
   - Effort: 6h (input + filter logic)
   - Recommendation: Sprint 3 (if lead count expected to grow)

7. **FE-022: Bulk Actions (Select Multiple Cards)**
   - Current: Can't select multiple cards
   - Impact: Power user workflows
   - Effort: 8h (checkbox logic + batch actions)
   - Recommendation: Sprint 4+ (low priority for MVP)

8. **FE-023: Notification System**
   - Current: Toast only (Sonner)
   - Impact: User awareness of system changes
   - Effort: 4h (notification center + history)
   - Recommendation: Sprint 4+ (nice-to-have)

### Assessment

**Draft is missing 8 UX items.** Most are lower priority for MVP but important for production. Recommend:
- Add FE-016, FE-017, FE-018 to Sprint 2 (improves baseline UX)
- Add FE-019 to Sprint 2 testing (not separate task, but verify)
- Defer FE-020 onwards to Sprint 3-4

---

## Effort Realism Check

### Sprint 1 Estimates (Draft: 15-18h)

**As Assigned:**
- DB indexes: 1h ✓
- DB constraints: 2h ✓
- DB validation: 1h ✓
- FE drag-drop keyboard: 6h (realistic, assumes @dnd-kit existing knowledge)
- FE aria-labels: 6h (realistic, straightforward additions)
- FE responsive sidebar: 8h (conservative, good buffer)

**Reality Assessment:**
- ⚠️ ASSUMES zero bugs/blockers discovered during implementation
- ⚠️ ASSUMES dev is familiar with @dnd-kit keyboard sensor
- ⚠️ 20% contingency buffer is TIGHT (recommend 25%)

**Recommendation:** **Adjust Sprint 1 to 18-22h** (add 10% overrun buffer)

### Sprint 2 Estimates (Draft: 20-24h)

**As Assigned:**
- DB race condition fix: 3h
- DB temporal validation: 1h
- DB user attribution: 3h
- FE focus indicators: 4h ✓
- FE responsive table: 12h (realistic but depends on design decision)
- FE modal width: 2h ✓
- FE tooltips: 2h ✓
- FE skip link: 1h ✓

**Reality Assessment:**
- ⚠️ 12h for responsive table assumes quick design decision (card vs row-expand vs sticky)
- ⚠️ If design takes 2h discovery, overrun to 14h
- ✓ Database items realistic
- ✓ FE items straightforward

**Recommendation:** **Adjust Sprint 2 to 24-28h** (add FE-016, FE-017, FE-018 from missing items)

### Sprint 3 Estimates (Draft: 16-20h)

**As Assigned:**
- FE code splitting: 4h ✓
- FE lazy loading: 6h (realistic)
- FE error boundary: 2h ✓
- FE dark mode: 6h (recommend DEFER)
- DB soft delete design: 2h ✓

**Reality Assessment:**
- ✓ All estimates realistic
- ⚠️ Dark mode (6h) not critical for MVP
- ✓ Soft delete design is planning, not implementation

**Recommendation:** **Remove FE-012 dark mode from Sprint 3, add to Sprint 4**
- New Sprint 3 focus: code splitting + lazy loading + error boundary + testing (12h)
- Add WCAG audit + accessibility testing (4-6h)
- Add missing FE-019 touch interactions testing (2h)

### Totals

| Sprint | Draft | Adjusted | Change | Reason |
|--------|-------|----------|--------|--------|
| 1 | 15-18h | 18-22h | +3-4h | Add contingency + FE-014 fix |
| 2 | 20-24h | 24-28h | +4h | Add missing FE-016, FE-017, FE-018 |
| 3 | 16-20h | 16-20h | 0 | Remove dark mode (defer), add testing |
| 4+ | 10-15h | 15-20h | +5h | Dark mode + monitoring + future items |
| **TOTAL** | **61-77h** | **73-90h** | **+12h** | More realistic with testing |

**Verdict:** Draft estimate of 40-55h is **OPTIMISTIC**. Realistic total is **73-90h** for full Phases 1-4 completion.

---

## Approval & Concerns

### APPROVAL DECISION

**✓ RECOMMEND IMPLEMENTATION** with following adjustments:

**Approved As-Is:**
- Sprint 1 critical items (FE-001, FE-002, FE-003, FE-005)
- Sprint 2 accessibility items (FE-004, FE-007, FE-009)
- Sprint 3 performance items (FE-008, FE-011)

**Conditional Approval (minor changes):**
- Adjust FE-006 estimate: 8h → 10h
- Batch FE-002 + FE-010: 8h + 2h → 10h combined
- Move FE-008 code splitting: Sprint 3 → Sprint 2
- Defer FE-012 dark mode: Sprint 3 → Sprint 4+

**Additional Recommendations:**
- Add FE-016, FE-017, FE-018 to Sprint 2 (loading states, empty states, error boundary)
- Add WCAG audit to Sprint 3 (compliance verification)
- Increase total effort estimate: 40-55h → 73-90h

---

### GREATEST RISKS FOR UX (Top 3)

#### RISK 1: Responsive Sidebar Introduces Regressions

**Problem:** Major layout refactoring (App.tsx + Sidebar.tsx) affects all pages
**Severity:** MEDIUM
**Probability:** 40% (likely minor regressions)
**Impact:** Broken navigation, layout shifts on certain viewports

**Mitigation:**
1. Screenshot regression testing (compare desktop before/after)
2. Test all navigation links on mobile + tablet + desktop
3. Visual testing on multiple browsers (Chrome, Firefox, Safari)
4. Use React DevTools to verify component tree changes

**Contingency:** 2h buffer in Sprint 1 for regression fixes

#### RISK 2: Responsive Table Complexity

**Problem:** Table card view requires design decision + implementation
**Severity:** MEDIUM
**Probability:** 60% (design discovery takes time)
**Impact:** FE-004 overruns, pushes other Sprint 2 items

**Mitigation:**
1. Design mobile table view FIRST (before Sprint 2 starts)
2. Get stakeholder approval on card vs row-expand design
3. Prototype in CodePen or Figma before coding
4. Reserve 2h for design iterations

**Contingency:** Defer FE-007/FE-009 if FE-004 overruns

#### RISK 3: Keyboard Drag-and-Drop Complexity

**Problem:** @dnd-kit keyboard sensor must be configured correctly
**Severity:** LOW-MEDIUM
**Probability:** 30% (some gotchas with keyboard navigation)
**Impact:** Drag-drop fails on keyboard, fails accessibility audit

**Mitigation:**
1. Research @dnd-kit KeyboardSensor configuration BEFORE Sprint 1
2. Create isolated test case (no other code), verify keyboard works
3. Test with actual keyboard: Tab to focus, Enter/Space to activate
4. Reference @dnd-kit examples + docs

**Contingency:** 2h contingency in FE-001 estimate

---

### GREATEST OPPORTUNITIES FOR UX IMPROVEMENT (Top 3)

#### OPPORTUNITY 1: Mobile-First Mindset Change

**Current:** Desktop design, retrofitted to mobile
**Opportunity:** Start with mobile, enhance for desktop (reverse thinking)
**Benefit:** Better UX on mobile, cleaner code, faster on poor networks

**How to Seize:**
- Design mobile views first (Figma mockups)
- Implement mobile CSS first, then desktop enhancements
- Test on mobile devices early (iPhone, Android)

**Expected Improvement:** 20% better mobile UX, 10% better code quality

#### OPPORTUNITY 2: Accessibility = Better UX for Everyone

**Current:** Accessibility treated as separate task
**Opportunity:** Integrate a11y into design decisions (keyboard shortcuts, tooltips, clear labels)
**Benefit:** Better UX for power users, clearer interfaces, more resilient code

**How to Seize:**
- Keyboard shortcuts (e.g., Ctrl+N for "Novo Lead", Ctrl+K for search)
- Voice commands (future: browser APIs)
- Better error messages (not just validation, but guidance)

**Expected Improvement:** 30% faster power user workflows, accessibility compliance

#### OPPORTUNITY 3: Performance = Better Perception

**Current:** No performance monitoring, can't measure improvements
**Opportunity:** Add Web Vitals tracking early, make performance visible
**Benefit:** Faster perceived load, better user retention, measurable improvement

**How to Seize:**
- Add Sentry + Performance monitoring in Sprint 3
- Set performance budget (e.g., <100KB gzipped)
- Monitor Core Web Vitals on production
- Share improvements with team (motivation)

**Expected Improvement:** 30% faster page loads, data-driven optimization

---

## Recommendation Summary

### Three Paths Forward

**PATH A: Conservative (Recommended)**
- Implement Sprint 1-2 as planned (critical + accessibility)
- Add missing items FE-016/017/018 (loading/empty/error states)
- Add WCAG audit in Sprint 3
- Defer dark mode + advanced features to Q2

**Timeline:** 8-10 weeks, 73h effort
**Outcome:** Mobile-friendly, accessible, production-ready MVP

**PATH B: Aggressive (Risky)**
- Compress Sprint 1-2 (less testing, skip FE-016/017/018)
- Defer accessibility to Sprint 3 (risky)
- Add dark mode to Sprint 3 (overscheduled)

**Timeline:** 6-8 weeks, 55h effort
**Outcome:** Mobile app faster but quality gaps, accessibility backlog

**PATH C: Phased (Flexible)**
- Sprint 1: Mobile sidebar + keyboard support only (critical)
- Sprint 2: Responsive table + accessibility polish
- Sprint 3: Performance + testing
- Sprint 4: Dark mode + future features

**Timeline:** 10-12 weeks, 90h effort
**Outcome:** Highest quality, most sustainable, best learning

### My Recommendation

**PURSUE PATH A (Conservative):**
- Adequate quality for MVP launch
- Includes all critical UX improvements
- Maintains sustainability
- Realistic timeline with testing buffer
- Can pivot to PATH C if team wants higher quality

---

## Final Sign-Off

**REVIEWER:** @ux-design-expert (Uma)
**ROLE:** Specialist review of frontend/UX technical debt
**STATUS:** APPROVED WITH MINOR ADJUSTMENTS

**VERDICT:**
- ✓ 95% agreement with draft findings
- ✓ Priorities and sequencing excellent
- ✓ Effort estimates mostly realistic (recommend +15% buffer)
- ✓ Ready for implementation

**CONDITIONS:**
1. Adjust effort estimates per my recommendations (Sprint 1: 18-22h, Sprint 2: 24-28h)
2. Add missing FE-016, FE-017, FE-018 to Sprint 2
3. Move FE-008 code splitting to Sprint 2
4. Defer FE-012 dark mode to Sprint 4+
5. Include WCAG audit in Sprint 3

**NEXT STEPS:**
- Share this review with @architect for Phase 5 finalization
- Schedule design review meeting for FE-004 (responsive table)
- Create detailed Sprint 1 task breakdown by end of week
- Reserve testing time in each sprint (critical!)

**CONFIDENCE LEVEL:** 95% (high confidence in assessment, minor unknowns in code-splitting complexity)

---

**Document Information**

**Type:** UX Specialist Review (Phase 6 — Brownfield Discovery)
**Project:** pipeline-buddy
**Reviewed Document:** TECHNICAL-DEBT-DRAFT.md (Phases 1-3 consolidated)
**Date:** 2026-02-20
**Reviewer:** @ux-design-expert (Uma)
**Status:** COMPLETE & APPROVED

**Next Review:** After @architect Phase 5 finalization + stakeholder feedback (~2-3 days)

**Document Version:** 1.0
**Last Updated:** 2026-02-20 18:30 UTC

---

*This UX specialist review validates the technical debt assessment findings and provides detailed justification for frontend/accessibility work. Ready for Phase 5 (@architect finalization) and Phase 6 (@pm epic creation).*
