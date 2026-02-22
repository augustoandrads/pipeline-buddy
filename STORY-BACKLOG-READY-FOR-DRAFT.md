# Story Backlog — Ready for @sm *draft
## Production Ready Sprint (8 Weeks)

**Status:** Ready for story creation
**Prepared by:** @po (Pax) & @pm (Morgan)
**Consolidated from:** @architect, @qa, @analyst analysis
**Process:** Use this as source for `@sm *draft` commands

---

## How to Use This Document

### For @sm (Story Creator)
1. Take each story below
2. Run: `@sm *draft {epic-number} {story-number}`
3. Update the template with details from this document
4. Tag @po for validation

### For @po (Story Validator)
1. Receive drafted story from @sm
2. Validate against 10-point checklist
3. Run: `@po *validate-story-draft {story-id}`
4. If GO: story moves to Ready, ready for @dev sprint

### For @dev (Implementation)
1. Pick ready story from backlog
2. Run: `@dev *develop {story-id}`
3. Implement acceptance criteria
4. When done: ask @qa for QA gate

---

## EPIC 1: DATABASE HARDENING & PERFORMANCE

### Story 1.1: Add Performance Indexes
```
Epic: 1-Database Hardening
Story Number: 1.1
Title: Add Performance Indexes to Leads Table
Type: Technical Enhancement
Priority: CRITICAL (blocks performance)
Estimate: 4 hours / 3 story points

Description:
Database queries are 10-50ms slower than necessary due to missing indexes.
Current Kanban board loads take 50ms (target: <10ms).
Add strategic indexes on frequently-queried columns to optimize dashboard and report performance.

Why This Matters:
- Users wait for dashboard to load (poor UX)
- Reports are slow (unusable at scale)
- Current single-user design works but won't scale
- Index addition is zero-risk (backward compatible)

User Story:
As a dashboard user
I want the Kanban board to load instantly
So I can view my sales pipeline without waiting

Acceptance Criteria:
- [ ] Add index on leads.etapa (stage column frequently filtered)
- [ ] Add index on leads.data_entrada_etapa (stage entry time for sorting)
- [ ] Add composite index on (lead_id, created_at) for audit log queries
- [ ] Run EXPLAIN ANALYZE on all queries; verify indexes used
- [ ] Kanban board loads in <10ms (down from 50ms)
- [ ] Reports calculate in <100ms
- [ ] Zero N+1 query problems detected
- [ ] No regression on existing queries
- [ ] All application tests pass

Technical Approach:
CREATE INDEX idx_leads_etapa ON leads(etapa);
CREATE INDEX idx_leads_data_entrada_etapa ON leads(data_entrada_etapa DESC);
CREATE INDEX idx_auditlog_lead_created ON audit_log(lead_id, created_at DESC);

Verify with:
EXPLAIN ANALYZE SELECT * FROM leads WHERE etapa = 'qualification';
(Should show "Index Scan" not "Sequential Scan")

Definition of Done:
- [ ] Migrations tested in staging with production-like data
- [ ] No broken queries; all app tests pass
- [ ] Performance improvement measured and documented
- [ ] Rollback procedure documented (DROP INDEX if needed)
- [ ] Code reviewed by @data-engineer or @architect

Risks:
- Unintended performance regression if wrong index choice
- Mitigation: Test in staging first, compare EXPLAIN ANALYZE before/after
- Data type misalignment could cause index not to be used
- Mitigation: Verify column types in schema

Dependencies:
- None (independent)

Notes:
- Use PostgreSQL EXPLAIN ANALYZE tool (not EXPLAIN alone)
- Indexes trade write performance for read performance (acceptable here: few writes, many reads)
- Monitor index usage in production: pg_stat_user_indexes

Related Stories:
- 1.2: Add Data Integrity Constraints (should run together)

Files to Create/Modify:
- supabase/migrations/{timestamp}_add_indexes.sql (CREATE)
```

### Story 1.2: Add Data Integrity Constraints
```
Epic: 1-Database Hardening
Story Number: 1.2
Title: Add Data Integrity Constraints
Type: Technical Enhancement
Priority: CRITICAL (prevents data corruption)
Estimate: 5 hours / 4 story points

Description:
Database currently accepts invalid data (e.g., multiple cards per lead, negative values, invalid stage names).
Add CHECK and UNIQUE constraints to prevent data corruption at the database level.

Why This Matters:
- Corrupted data leads to incorrect business decisions
- Multiple cards per lead violates 1:1 relationship assumption
- Negative contract values cause calculation errors
- Data corruption is hard to debug (appears in UI as weird state)

User Story:
As a data analyst
I want guaranteed valid data in the database
So I can trust reports and make correct business decisions

Acceptance Criteria:
- [ ] Add UNIQUE constraint on cards(lead_id) — enforce 1:1 relationship
- [ ] Add CHECK constraint on leads.contract_value > 0 (if numeric field exists)
- [ ] Add CHECK constraint on leads.quantity > 0 (if numeric field exists)
- [ ] Add CHECK constraint on audit_log.etapa IN ('qualifier', 'negotiation', ...) — valid stages only
- [ ] Add CHECK constraint on timestamps: data_entrada_etapa <= NOW() — no future dates
- [ ] Verify no existing data violates constraints (migration includes validation query)
- [ ] Migration includes rollback procedure with DROP CONSTRAINT
- [ ] All application tests pass
- [ ] No constraint violations in production data

Technical Approach:
ALTER TABLE cards ADD CONSTRAINT unique_lead_card UNIQUE(lead_id);
ALTER TABLE leads ADD CONSTRAINT positive_contract_value CHECK(contract_value > 0);
ALTER TABLE leads ADD CONSTRAINT positive_quantity CHECK(quantity > 0);
ALTER TABLE audit_log ADD CONSTRAINT valid_etapa CHECK(etapa IN ('qualifier', 'negotiation', ...));
ALTER TABLE leads ADD CONSTRAINT valid_stage_timestamp CHECK(data_entrada_etapa <= NOW());

Verify Before Applying:
SELECT COUNT(*) FROM cards GROUP BY lead_id HAVING COUNT(*) > 1; — Should be 0
SELECT COUNT(*) FROM leads WHERE contract_value < 0; — Should be 0
SELECT COUNT(*) FROM audit_log WHERE etapa NOT IN ('qualifier', ...); — Should be 0

Definition of Done:
- [ ] Constraints applied in staging
- [ ] Validation query shows 0 constraint violations
- [ ] Migration tested with rollback
- [ ] No application changes needed (constraints are passive)
- [ ] Documented in SCHEMA.md

Risks:
- Constraint violations on existing data (requires data cleanup first)
- Mitigation: Run validation query first; if violations, stop and investigate
- Future development might expect "invalid" states temporarily
- Mitigation: Constraints enforce consistency; if needed, modify app logic

Dependencies:
- 1.1 (recommended to run together, but independent)
- Requires production data backup (story 0.1 if not done)

Notes:
- CHECK constraints are enforced by PostgreSQL, not application
- UNIQUE constraint prevents duplicate leads in card table
- Constraints are zero-performance cost (always on)
- If constraint violated, INSERT/UPDATE fails with clear error

Files to Create/Modify:
- supabase/migrations/{timestamp}_add_constraints.sql (CREATE)
- docs/SCHEMA.md (document constraints)
```

### Story 1.3: Add Soft Deletes & Audit Trail
```
Epic: 1-Database Hardening
Story Number: 1.3
Title: Prepare Soft Deletes & Audit Trail for GDPR/LGPD
Type: Technical Enhancement
Priority: HIGH (compliance requirement)
Estimate: 3 hours / 2 story points

Description:
Add schema support for soft deletes (deleted_at columns) to enable GDPR/LGPD compliance.
Users must be able to delete data, and we must be able to recover it for GDPR "right to be forgotten" with audit trail.
This story adds the schema; application integration happens in story 6.3 (Epic 6).

Why This Matters:
- GDPR requires data deletion capability
- LGPD (Brazil) requires user data deletion
- Can't permanently delete without audit trail (compliance violation)
- Current system has no data recovery option

User Story:
As a compliance officer
I want soft delete capability in the database
So we can comply with GDPR/LGPD deletion requests

Acceptance Criteria:
- [ ] Add deleted_at TIMESTAMP column to leads table (nullable)
- [ ] Add deleted_at TIMESTAMP column to cards table (nullable)
- [ ] Add deleted_at TIMESTAMP column to audit_log table (nullable)
- [ ] Add index on (deleted_at) for performance (soft-deleted data queries)
- [ ] Document data retention policy (e.g., "purge after 90 days")
- [ ] Migration includes rollback (DROP COLUMN)
- [ ] No application code changes (schema-only)
- [ ] All tests pass

Technical Approach:
ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE cards ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE audit_log ADD COLUMN deleted_at TIMESTAMP NULL;

CREATE INDEX idx_leads_deleted ON leads(deleted_at);
CREATE INDEX idx_cards_deleted ON cards(deleted_at);
CREATE INDEX idx_auditlog_deleted ON audit_log(deleted_at);

Queries using soft deletes (application code will implement):
SELECT * FROM leads WHERE deleted_at IS NULL; — Only active leads
SELECT * FROM leads WHERE deleted_at IS NOT NULL; — Only deleted leads

Definition of Done:
- [ ] Columns added to schema
- [ ] Indexes created
- [ ] Migration tested in staging
- [ ] SCHEMA.md updated with retention policy
- [ ] Rollback procedure documented

Risks:
- Existing queries must filter deleted_at IS NULL (application code responsibility)
- Mitigation: Story 6.3 handles application integration

Dependencies:
- None (independent schema change)
- Story 6.3: Soft Delete Integration (application code)

Notes:
- Soft deletes preserve data integrity and audit trail
- Hard deletes (permanent) will require DBA approval
- Data retention policy should be agreed with legal/compliance

Files to Create/Modify:
- supabase/migrations/{timestamp}_add_soft_deletes.sql (CREATE)
- docs/SCHEMA.md (update retention policy section)
```

---

## EPIC 2: MOBILE-FIRST RESPONSIVE DESIGN

### Story 2.1: Responsive Kanban Board Layout
```
Epic: 2-Mobile Design
Story Number: 2.1
Title: Responsive Kanban Board for Mobile (<640px)
Type: UI Enhancement
Priority: CRITICAL (25-30% user impact)
Estimate: 10 hours / 5 story points

Description:
Kanban board is broken on mobile (<640px). Stages overflow horizontally, unscrollable.
Implement responsive layout: 1-column (mobile) → 2-column (tablet) → 5-column (desktop).

Why This Matters:
- 60% of web traffic is mobile
- Current layout breaks on phones
- Mobile users 25-30% more likely to churn
- Desktop users unaffected by change

User Story:
As a sales rep on my phone
I want a usable Kanban board
So I can manage deals from the field

Acceptance Criteria:
- [ ] Mobile (<640px): Single column, stages stack vertically
- [ ] Tablet (640-1024px): Two columns (e.g., Qualifier + Negotiation | Proposal + Demo)
- [ ] Desktop (>1024px): Five columns (current layout, unchanged)
- [ ] Horizontal scroll removed on mobile (no overflow-x)
- [ ] Card touch targets ≥48x48px (WCAG requirement)
- [ ] No layout shift during drag-drop operations (CLS < 0.05)
- [ ] Verified on real devices: iPhone 12, 14 Pro, iPad Air, Android
- [ ] Lighthouse mobile score ≥85
- [ ] Desktop layout unchanged (zero regression)
- [ ] All tests pass

Technical Approach:
Use Tailwind CSS responsive prefixes + flexbox:

Desktop (lg:):
<div className="flex gap-4 overflow-x-auto">
  {stages.map(stage => <Column key={stage} />)}
</div>

Tablet (md:):
<div className="grid grid-cols-2 gap-4">
  {stages.map(stage => <Column key={stage} />)}
</div>

Mobile (base):
<div className="flex flex-col gap-4">
  {stages.map(stage => <Column key={stage} />)}
</div>

Card sizing:
<div className="p-4 min-h-[48px] touch-target">
  Card content
</div>

Testing Checklist:
- [ ] iPhone SE (375px wide)
- [ ] iPhone 12 (390px)
- [ ] iPhone 14 Pro (430px)
- [ ] iPad Air (768px)
- [ ] Samsung Galaxy S21 (360px, Android)
- [ ] Landscape orientation on each

Definition of Done:
- [ ] Visual regression testing passed (desktop unchanged)
- [ ] Tested on 5+ real devices (not just browser emulation)
- [ ] Lighthouse mobile 85+ (from current ~75)
- [ ] Touch interactions smooth (60fps scrolling)
- [ ] No layout shift (Cumulative Layout Shift <0.05)
- [ ] Accessibility preserved (keyboard nav still works)
- [ ] Code reviewed by @dev
- [ ] Performance metrics tracked

Risks:
- CSS breakpoint edge cases (exactly at 640px boundary)
- Mitigation: Test on multiple device widths
- Touch interaction conflicts with drag-drop
- Mitigation: Reference @dnd-kit touch handling guide

Dependencies:
- None (pure CSS/layout changes)

Notes:
- Use actual devices for testing (Chrome DevTools emulation not sufficient)
- Tailwind breakpoints: sm:640px md:768px lg:1024px xl:1280px
- Record before/after screenshots for regression tracking

Files to Modify:
- src/components/Kanban.tsx (layout responsive)
- src/styles/tailwind.config.ts (if custom breakpoints needed)
```

### Story 2.2: Responsive Forms & Tables
```
Epic: 2-Mobile Design
Story Number: 2.2
Title: Responsive Forms & Data Tables for Mobile
Type: UI Enhancement
Priority: CRITICAL (blocks form usage on mobile)
Estimate: 8 hours / 4 story points

Description:
Forms and tables overflow/break on mobile screens. Lead creation form unreadable, table columns squished.
Implement mobile-first responsive forms and table layouts.

Why This Matters:
- Users can't create leads on mobile
- Can't view lead details on small screens
- Poor user experience = high bounce rate

User Story:
As a mobile user
I want to create leads and view details on my phone
So I can work from the field

Acceptance Criteria:
- [ ] Forms stack vertically on <640px (one field per row)
- [ ] Form inputs full-width on mobile (padding: 0 sides)
- [ ] Labels above inputs (not beside)
- [ ] Submit button full-width, large touch target (48px)
- [ ] Tables scroll horizontally on mobile with sticky first column
- [ ] Table cells readable at any width
- [ ] No horizontal overflow on <640px
- [ ] All form validation messages visible on mobile
- [ ] Modal dialogs full-screen on mobile (not fixed size)
- [ ] Tested on real phones (iPhone, Android)
- [ ] Lighthouse mobile score ≥85

Technical Approach:
Form layout:
<form className="flex flex-col gap-4">
  <div className="flex flex-col gap-1"> {/* Stack on mobile */}
    <label>Name</label>
    <input className="w-full p-2 md:p-3" />
  </div>
  <button className="w-full py-3">Save</button>
</form>

Table scroll on mobile:
<div className="overflow-x-auto">
  <table className="min-w-[400px]">
    <thead>
      <tr className="sticky top-0">
        {/* Sticky header */}
      </tr>
    </thead>
  </table>
</div>

Definition of Done:
- [ ] All forms tested on 3 devices (iOS + Android)
- [ ] Table scrolling smooth (no jank)
- [ ] Form submission works on small screens
- [ ] Error messages visible
- [ ] No horizontal overflow on any field
- [ ] Accessibility preserved (labels associated, etc.)

Files to Modify:
- src/components/LeadModal.tsx (form layout)
- src/components/LeadsTable.tsx (table scroll)
- src/components/ReportsTable.tsx (if exists)
```

---

## EPIC 3: ACCESSIBILITY (WCAG 2.1 AA)

### Story 3.1: Keyboard Navigation for Kanban
```
Epic: 3-Accessibility
Story Number: 3.1
Title: Full Keyboard Navigation for Kanban Board
Type: Accessibility Compliance
Priority: CRITICAL (legal requirement)
Estimate: 8 hours / 5 story points

Description:
Kanban board is not navigable with keyboard only. Users with motor disabilities cannot use app.
Implement full keyboard navigation: Tab to navigate stages, Arrow keys to navigate cards, Enter to open.

Why This Matters:
- 15-20% of users have motor disabilities
- Legal requirement (WCAG 2.1 Level AA)
- EU legal liability without keyboard support
- Right thing to do (accessibility is inclusion)

User Story:
As a user with motor disabilities
I want to navigate and move cards using only keyboard
So I can use Pipeline-Buddy without a mouse

Acceptance Criteria:
- [ ] Tab/Shift+Tab navigates between stages (left-to-right)
- [ ] Arrow keys (Left/Right) navigate between stages
- [ ] Arrow keys (Up/Down) navigate within stage (card-to-card)
- [ ] Enter/Space opens card details modal
- [ ] Escape closes modal
- [ ] Focus always visible (clear, distinct indicator)
- [ ] No keyboard traps (can always move focus)
- [ ] Drag-drop not available via keyboard (use card menu instead)
- [ ] axe DevTools: 0 keyboard navigation violations
- [ ] Tested with actual keyboard (not dev tools)

Technical Approach:
Add onKeyDown handlers to cards/stages:

const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'Tab': // Native browser handles this
      break;
    case 'ArrowRight':
      focusNextStage();
      e.preventDefault();
      break;
    case 'ArrowLeft':
      focusPreviousStage();
      e.preventDefault();
      break;
    case 'ArrowDown':
      focusNextCard();
      e.preventDefault();
      break;
    case 'ArrowUp':
      focusPreviousCard();
      e.preventDefault();
      break;
    case 'Enter':
    case ' ':
      openCardModal();
      e.preventDefault();
      break;
    case 'Escape':
      closeModal();
      break;
  }
};

Focus management:
<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onFocus={() => setFocused(true)}
>
  Card content
</div>

Definition of Done:
- [ ] Manual keyboard testing complete
- [ ] Verified with screen reader (NVDA or VoiceOver)
- [ ] Mobile keyboard (on-screen) tested
- [ ] Focus management code reviewed
- [ ] No console errors/warnings
- [ ] axe DevTools reports 0 violations

Risks:
- Drag-drop not available via keyboard (breaking expectation)
- Mitigation: Offer card menu (move to stage dropdown) as alternative

Files to Modify:
- src/components/Kanban.tsx (keyboard handlers)
- src/components/Card.tsx (focus management)
```

### Story 3.2: ARIA Labels & Semantic HTML
```
Epic: 3-Accessibility
Story Number: 3.2
Title: ARIA Labels & Semantic HTML Tags
Type: Accessibility Compliance
Priority: CRITICAL (compliance requirement)
Estimate: 10 hours / 5 story points

Description:
Missing ARIA labels on interactive elements. Screen readers can't identify buttons, form fields.
Add ARIA labels, use semantic HTML (button, nav, main, article).

Why This Matters:
- Screen reader users can't understand UI
- WCAG requirement (every interactive element needs name)
- Simple fix, high impact

User Story:
As a screen reader user
I want clear labels on all buttons and forms
So I can understand what each element does

Acceptance Criteria:
- [ ] All buttons have aria-label or visible text
- [ ] All form inputs have associated <label> elements
- [ ] Interactive elements have role="button", role="form", etc. (or semantic HTML)
- [ ] Loading spinners: aria-label="Loading..." or role="status"
- [ ] Icons: aria-label or title attribute
- [ ] Links: descriptive text (not "click here")
- [ ] Color contrast ≥4.5:1 (WCAG AA standard)
- [ ] axe DevTools: 0 violations
- [ ] Tested with screen reader (NVDA or VoiceOver)

Technical Approach:
Button:
<button aria-label="Create new lead">
  <PlusIcon /> {/* Icon needs aria-label OR visible text */}
</button>

Form:
<label htmlFor="lead-name">Name</label>
<input id="lead-name" ... />

Loading:
<div role="status" aria-label="Loading leads...">
  <Spinner />
</div>

Navigation:
<nav>
  <a href="/">Home</a> {/* Semantic nav tag */}
</nav>

Color contrast fix:
Current: #999999 text on white (3:1) — TOO LOW
Fixed: #666666 text on white (4.5:1) — WCAG AA ✓

Definition of Done:
- [ ] All ~50 buttons audited and labeled
- [ ] All ~20 form fields have labels
- [ ] Icons have aria-label
- [ ] Color contrast tested (use WebAIM contrast checker)
- [ ] axe DevTools shows 0 violations
- [ ] Screen reader tested on all pages
- [ ] Code reviewed

Files to Modify:
- src/components/**/*.tsx (all components)
- src/styles/globals.css (color contrast updates)
```

---

## EPIC 4: TESTING INFRASTRUCTURE

### Story 4.1: Unit Tests for Custom Hooks
```
Epic: 4-Testing
Story Number: 4.1
Title: Unit Tests for useLeads, useCards, and Utility Hooks
Type: Quality Assurance
Priority: CRITICAL (60% of code coverage)
Estimate: 15 hours / 8 story points

Description:
0% test coverage currently. Start with custom hooks (business logic). Target: 30+ tests, >80% hook coverage.

Why This Matters:
- Can't catch regressions (bugs hide easily)
- Can't refactor confidently
- QA can't verify features
- Critical path: lead management, card movement

User Story:
As a developer
I want automated regression detection
So I can refactor without breaking functionality

Acceptance Criteria:
- [ ] useLeads hook fully tested (query, mutations, error handling, loading states)
- [ ] useCards hook fully tested
- [ ] useForm hook tested (validation, submission, errors)
- [ ] Utility functions tested (date formatting, calculations, validation)
- [ ] 30+ tests total
- [ ] All tests passing (100% pass rate)
- [ ] Coverage on hooks directory: >80%
- [ ] Tests cover happy path + error scenarios + edge cases
- [ ] Mocked Supabase client (no real DB calls)
- [ ] Tests run in <5s locally

Test Examples:
useLeads:
  - [x] Query fetches leads successfully
  - [x] Query refetches on trigger
  - [x] Mutation creates lead correctly
  - [x] Mutation handles validation error (duplicate lead)
  - [x] Mutation handles network error
  - [x] Mutation handles server error (500)
  - [x] Error state captured
  - [x] Loading state captured

useCards:
  - [x] Query fetches cards for lead
  - [x] Mutation moves card to stage
  - [x] Mutation handles invalid stage
  - [x] Cascade delete when lead deleted

useForm:
  - [x] Validation passes with valid data
  - [x] Validation fails with invalid data
  - [x] Submit calls mutation
  - [x] Error message shown on validation failure

Definition of Done:
- [ ] Tests passing in CI/CD (GitHub Actions)
- [ ] Coverage report visible in PR (>80% hooks)
- [ ] Code reviewed for test quality (not just %)
- [ ] Mocks verified (no real DB calls in tests)
- [ ] README updated with test setup instructions

Technical Approach:
Use Vitest + React Testing Library + MSW (Mock Service Worker)

Setup:
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeads } from './useLeads';

describe('useLeads', () => {
  it('should fetch leads on mount', async () => {
    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.leads).toEqual([...]);
    });
  });
});

Files to Create:
- src/hooks/useLeads.test.ts (20+ tests)
- src/hooks/useCards.test.ts (8+ tests)
- src/hooks/useForm.test.ts (5+ tests)
- src/utils/__tests__/ (utility tests)
```

### Story 4.2: Component Tests for UI Elements
```
Epic: 4-Testing
Story Number: 4.2
Title: Component Tests for Lead Form, Kanban, Dashboard
Type: Quality Assurance
Priority: HIGH (25+ tests, visual regression detection)
Estimate: 15 hours / 8 story points

Description:
Test key UI components: LeadModal (form), Kanban (board), Dashboard (layout).
Target: 25+ tests, >70% component coverage.

Acceptance Criteria:
- [ ] LeadModal renders correctly (form fields, validation)
- [ ] LeadModal validation errors displayed
- [ ] LeadModal submission calls mutation
- [ ] Kanban board renders stages and cards
- [ ] Kanban drag feedback works (visual feedback, not actual move)
- [ ] Dashboard shows metrics correctly
- [ ] Error boundary catches and displays errors
- [ ] Loading skeletons render while fetching
- [ ] Empty states render correctly
- [ ] 25+ tests total
- [ ] All tests passing

Definition of Done:
- [ ] Tests passing in CI
- [ ] Coverage >70% for components
- [ ] Visual regression tests (snapshots)
- [ ] Code reviewed

Files to Create:
- src/components/LeadModal.test.tsx
- src/components/Kanban.test.tsx
- src/components/Dashboard.test.tsx
```

### Story 4.3: Integration Tests for Critical Flows
```
Epic: 4-Testing
Story Number: 4.3
Title: Integration Tests for Lead Creation & Pipeline Movement
Type: Quality Assurance
Priority: HIGH (critical user paths)
Estimate: 15 hours / 8 story points

Description:
Test full user flows: create lead → move stage → mark as won.
Use React Testing Library + user-event to simulate real interactions.

Acceptance Criteria:
- [ ] Flow 1: Create lead from form, appears in Kanban
- [ ] Flow 2: Move card to next stage, persists on reload
- [ ] Flow 3: Update lead details, reflected in list
- [ ] Flow 4: Delete lead, removed from Kanban
- [ ] 10+ integration tests
- [ ] Each test <500ms (fast)

Definition of Done:
- [ ] Tests passing in CI
- [ ] No flaky tests (run 10x, all pass)
- [ ] Code reviewed

Files to Create:
- src/__tests__/integration/ (integration test directory)
- src/__tests__/integration/lead-flow.test.tsx
```

---

## EPIC 5: ERROR TRACKING & OBSERVABILITY

### Story 5.1: Sentry Error Tracking Setup
```
Epic: 5-Observability
Story Number: 5.1
Title: Sentry Error Tracking for Production Monitoring
Type: DevOps / Infrastructure
Priority: CRITICAL (can't debug production without it)
Estimate: 6 hours / 3 story points

Description:
Setup Sentry for real-time error tracking in production.
Users report bugs, but we can't see stack traces or debug them.
Sentry captures errors with full context.

Why This Matters:
- Without error tracking: user reports bug → we can't reproduce → guessing
- With Sentry: error happens → we see it in real-time with stack trace
- 80% faster debugging
- 50% fewer support requests (we proactively fix issues)

User Story:
As a developer
I want to see production errors in real-time
So I can fix issues before users report them

Acceptance Criteria:
- [ ] Sentry account created (free tier: 5K events/month)
- [ ] Sentry SDK installed in React app (npm install @sentry/react)
- [ ] Error boundary configured to send errors to Sentry
- [ ] Unhandled promise rejections captured
- [ ] API errors captured with response data
- [ ] Stack traces visible and source-mapped
- [ ] Slack integration: alerts on CRITICAL errors
- [ ] Errors appear in Sentry within 2 minutes
- [ ] Team can view Sentry dashboard
- [ ] Performance tracing enabled (1% sample)

Technical Approach:
Install:
npm install @sentry/react @sentry/tracing

Configure (main.tsx):
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    new Sentry.Replay(),
    new Sentry.Profiler(),
  ],
  tracesSampleRate: 0.01, // 1% of traffic
  replaysSessionSampleRate: 0.1, // 10% of sessions
  environment: process.env.NODE_ENV,
});

Error Boundary:
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>

API Error Capture:
try {
  await api.call();
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: "lead-creation" },
  });
}

Definition of Done:
- [ ] Test error capturing by throwing test error
- [ ] Error appears in Sentry dashboard within 2 min
- [ ] Slack notification received on CRITICAL
- [ ] Team trained on Sentry dashboard
- [ ] Documentation: "How to view errors in Sentry"

Files to Modify:
- src/main.tsx (Sentry init)
- src/error-boundary.tsx (ErrorBoundary)
- .env.example (add SENTRY_DSN)

Notes:
- Sentry free tier: 5K events/month (good for MVP)
- If errors >5K/month: upgrade to paid tier ($24+)
- Session replay available but has privacy implications
```

---

## EPIC 6: SECURITY HARDENING

### Story 6.1: Input Sanitization & XSS Prevention
```
Epic: 6-Security
Story Number: 6.1
Title: Sanitize User Input to Prevent XSS Attacks
Type: Security
Priority: CRITICAL (vulnerability)
Estimate: 3 hours / 2 story points

Description:
User input not sanitized. XSS vulnerability possible.
Example: User enters <script>alert('hacked')</script> as lead name.
Add DOMPurify library to sanitize all user input on save.

Why This Matters:
- XSS (Cross-Site Scripting) is OWASP A3 (top vulnerability)
- Users could inject malicious scripts
- Could steal data, redirect users, etc.
- Simple to fix: add sanitization library

User Story:
As a security officer
I want user input sanitized
So our app is protected from XSS attacks

Acceptance Criteria:
- [ ] DOMPurify library installed (npm install dompurify)
- [ ] All user text input sanitized on save (lead name, email, notes)
- [ ] Rich text sanitized if implemented (allow safe HTML tags)
- [ ] XSS payload test fails (payload is sanitized/escaped)
- [ ] Content Security Policy header configured (X-Content-Security-Policy)
- [ ] No breaking changes to user experience
- [ ] All tests pass

Technical Approach:
import DOMPurify from 'dompurify';

On input save:
const cleanName = DOMPurify.sanitize(userInput, { ALLOWED_TAGS: [] });
// Result: <script>alert('x')</script> → &lt;script&gt;alert('x')&lt;/script&gt;

CSP Header (server-side or via meta tag):
<meta http-equiv="Content-Security-Policy" content="default-src 'self';" />

Test:
const malicious = "<img src=x onerror='alert(1)'>";
const clean = DOMPurify.sanitize(malicious);
expect(clean).not.toContain('onerror');

Definition of Done:
- [ ] Sanitization applied to all user input fields
- [ ] XSS payload test passing
- [ ] CSP header configured
- [ ] Code reviewed by @dev
- [ ] Performance impact <1ms per save

Files to Modify:
- src/api/mutations.ts (sanitize on save)
- public/index.html (CSP meta tag)
- Or server middleware if using backend

Notes:
- DOMPurify is standard choice (25KB bundle, widely used)
- Alternative: sanitize-html (if rich text needed)
```

---

## EPIC 7: PERFORMANCE OPTIMIZATION

### Story 7.1: Code Splitting by Route
```
Epic: 7-Performance
Story Number: 7.1
Title: Code Splitting by Route to Reduce Bundle Size
Type: Performance Optimization
Priority: MEDIUM (high for mobile)
Estimate: 6 hours / 3 story points

Description:
Current bundle 737KB (88% over recommended <250KB).
Implement code splitting by route: lazy-load Dashboard, Reports, Settings.
Expected reduction: -35% (500KB → 325KB).

Why This Matters:
- Slow on 4G networks (important for mobile users)
- 4s delay = 40% bounce rate
- Code splitting: free performance win
- Users only download code they use

User Story:
As a mobile user
I want fast app load times
So I can access the app without waiting

Acceptance Criteria:
- [ ] Dashboard lazy-loaded (React.lazy)
- [ ] Reports page lazy-loaded
- [ ] Settings page lazy-loaded (if exists)
- [ ] Loading state shown while chunk downloads
- [ ] Bundle main chunk <250KB (gzip: <50KB)
- [ ] Secondary chunks <100KB each
- [ ] No loading screen on main routes
- [ ] No regression on performance (actual improvement)

Technical Approach:
Use React.lazy + Suspense:

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Reports = React.lazy(() => import('./pages/Reports'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/reports" element={<Reports />} />
  </Routes>
</Suspense>

Verify Bundle Size:
npm run build
# Output shows chunk sizes:
# dist/index.*.js 150.5 kB (main chunk)
# dist/Dashboard.*.js 80.2 kB
# dist/Reports.*.js 75.8 kB

Definition of Done:
- [ ] Main chunk <250KB (gzip)
- [ ] Build succeeds without errors
- [ ] Lazy load chunks download on route change
- [ ] No flashing/jank on navigation
- [ ] Performance metrics improved

Files to Modify:
- src/App.tsx (add React.lazy)
- src/pages/Dashboard.tsx (export as lazy)
- src/pages/Reports.tsx (export as lazy)
```

---

## EPIC 8: CI/CD & DEVOPS

### Story 8.1: GitHub Actions Test Workflow
```
Epic: 8-DevOps
Story Number: 8.1
Title: Automate Testing with GitHub Actions CI/CD
Type: DevOps / Automation
Priority: CRITICAL (blocks PRs without tests)
Estimate: 6 hours / 3 story points

Description:
Setup GitHub Actions to run tests, linting, typechecking on every PR.
Block PRs if tests fail.
Publish coverage reports.

Why This Matters:
- Manual testing = mistakes slip through
- CI/CD = automated gating (tests must pass before merge)
- 90% fewer production bugs
- Fast feedback (dev sees test results in 2 min)

User Story:
As a developer
I want automated tests to catch bugs before I merge
So broken code never reaches production

Acceptance Criteria:
- [ ] `.github/workflows/test.yml` created
- [ ] Workflow triggered on: PR open, PR update, push to main
- [ ] Steps: lint, typecheck, test, coverage
- [ ] PR blocked if any step fails
- [ ] Coverage report visible in PR
- [ ] Tests complete in <5 min

Technical Approach:
Create `.github/workflows/test.yml`:

name: Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Test
        run: npm test -- --run

      - name: Coverage report
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

Branch Protection Rule (GitHub Settings):
Require status checks to pass before merging:
- ✓ Tests
- ✓ Lint
- ✓ Typecheck

Definition of Done:
- [ ] Workflow file created and tested
- [ ] PR shows test results in UI
- [ ] Coverage report visible in PR
- [ ] Branch protection enabled
- [ ] Team trained on workflow

Files to Create:
- .github/workflows/test.yml

Notes:
- Workflow runs for ~3-5 min per PR
- Cost: Free for public repos, limited for private (2000 min/month free)
- Can add more steps: E2E tests, security scanning, etc.
```

---

## Summary Table: All Stories Ready to Draft

| Epic | Story | Title | Hours | Priority |
|------|-------|-------|-------|----------|
| 1 | 1.1 | Add Performance Indexes | 4h | CRITICAL |
| 1 | 1.2 | Add Data Integrity Constraints | 5h | CRITICAL |
| 1 | 1.3 | Add Soft Deletes & Audit Trail | 3h | HIGH |
| 2 | 2.1 | Responsive Kanban Board | 10h | CRITICAL |
| 2 | 2.2 | Responsive Forms & Tables | 8h | CRITICAL |
| 3 | 3.1 | Keyboard Navigation | 8h | CRITICAL |
| 3 | 3.2 | ARIA Labels & Semantics | 10h | CRITICAL |
| 4 | 4.1 | Unit Tests for Hooks | 15h | CRITICAL |
| 4 | 4.2 | Component Tests | 15h | HIGH |
| 4 | 4.3 | Integration Tests | 15h | HIGH |
| 5 | 5.1 | Sentry Error Tracking | 6h | CRITICAL |
| 6 | 6.1 | Input Sanitization (XSS) | 3h | CRITICAL |
| 7 | 7.1 | Code Splitting by Route | 6h | MEDIUM |
| 8 | 8.1 | GitHub Actions CI/CD | 6h | CRITICAL |
| --- | --- | **TOTAL** | **154h** | --- |

---

## Next Steps

### 1. @sm (Story Creator)
- [ ] Review this document
- [ ] Start with Epic 1 stories (database foundation)
- [ ] Run: `@sm *draft 1 1.1` (then 1.2, 1.3)
- [ ] Tag @po for validation after each story created

### 2. @po (Validator)
- [ ] Review drafted stories
- [ ] Validate against 10-point checklist
- [ ] Run: `@po *validate-story-draft {story-id}`
- [ ] If GO: story moves to Ready status

### 3. @pm (Project Manager)
- [ ] Prioritize stories into weeks (see roadmap)
- [ ] Create GitHub project board
- [ ] Assign to @dev
- [ ] Schedule daily standups

### 4. @dev (Developer)
- [ ] Pick first story from Ready backlog
- [ ] Run: `@dev *develop {story-id}`
- [ ] Implement acceptance criteria
- [ ] Request @qa review when done

---

**Document prepared by:** @po (Pax) & @pm (Morgan)
**Consolidated from:** @architect, @qa, @analyst analysis
**Status:** Ready for story creation
**Date:** 2026-02-22

*Synkra AIOS | Production Ready in 8 Weeks*
