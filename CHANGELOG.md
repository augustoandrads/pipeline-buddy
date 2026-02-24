# Changelog

All notable changes to pipeline-buddy are documented in this file.

---

## [1.2.0] - 2026-02-24

### ✨ Added

#### Loss Tracking & Management
- **Loss Reason Modal** (US-06): Mandatory modal when moving leads to PERDIDO stage
  - 6 pre-defined loss reasons: Preço, Concorrente, Sem urgência, Sem resposta, Perfil não adequado, Outro
  - "Outro" option requires minimum 10 characters of detail
  - Modal blocks card movement until reason selected
  - Loss record persisted to `lead_losses` database table
  - Loss history visible in lead details sidebar

- **Loss Report Dashboard** (US-07): Executive loss analysis at `/motivos-perda`
  - Pie chart showing distribution of loss reasons
  - Bar chart showing total value lost by reason
  - Period filtering: 7/30/90 days or all time
  - Summary cards: total lost leads, total lost value, top loss reason
  - Detailed table with loss history (date, name, company, reason, value, notes)
  - CSV export functionality with all loss records
  - Data aggregation at query level for O(n) performance

#### Task Management System
- **Tasks in Lead Card** (US-08): Full task management in lead details
  - Create tasks with title, type (Call, Message, Meeting, Email, Other), due date, assignee
  - Task list with status badges (Pendente, Concluída, Atrasada)
  - Inline task completion without page reload
  - Complete task and add result field with modal
  - Delete task functionality
  - Full CRUD operations with error handling

- **My Day Panel** (US-09): User-focused task dashboard at `/meu-dia`
  - Tasks grouped by urgency: Overdue (red), Due today (orange), Due tomorrow (blue)
  - Summary cards: total tasks, overdue count, next 48h count
  - Inline task completion from My Day panel
  - Click task to navigate to related lead
  - Auto-refresh every 60 seconds
  - Color-coded visual hierarchy for quick scanning

### 🔧 Technical Changes

#### New Database Tables
- `lead_losses`: Tracks loss reasons with lead/card references
  - Foreign keys to leads and cards tables
  - Indexed on lead_id, reason, criado_em
  - RLS policies for data security
  - Timestamps: criado_em (creation)

- `tasks`: Full task lifecycle management
  - Foreign key to leads table
  - Status tracking (PENDING, COMPLETED, OVERDUE)
  - Type taxonomy (CALL, MESSAGE, MEETING, EMAIL, OTHER)
  - Assignee tracking (user identifier)
  - Result field for task completion notes
  - Composite index on (assignee, due_date) for My Day queries
  - Timestamps: criado_em (creation), updated_at (modifications)
  - RLS policies for multi-user access

#### TypeScript Enhancements
- New ENUMs: `LossReason`, `TaskType`, `TaskStatus`
- Type-safe service layer: `lossReasonService`, `tasksService`
- Full type annotations throughout new components
- No implicit `any` types

#### New Components & Services
- **Components:**
  - `LossReasonModal.tsx` - Loss reason capture modal (79 lines)
  - `TasksTab.tsx` - Task management UI in lead sidebar (149 lines)
  - `LossReportPage.tsx` - Loss analytics dashboard (318 lines)
  - `MyDayPage.tsx` - User task dashboard (232 lines)

- **Services:**
  - `lossReasonService.ts` - Loss CRUD operations (142 lines)
  - `tasksService.ts` - Task CRUD operations (180 lines)

#### Modified Files
- `src/types/crm.ts` - Added PERDIDO stage, new ENUMs, label maps
- `src/components/KanbanColumn.tsx` - PERDIDO stage colors (red theme)
- `src/components/Sidebar.tsx` - New navigation routes
- `src/components/LeadDetailsSidebar.tsx` - TasksTab integration
- `src/App.tsx` - New route declarations
- `src/pages/KanbanPage.tsx` - Loss modal trigger on PERDIDO moves

### 📊 Metrics

| Metric | Result |
|--------|--------|
| Stories Completed | 4/4 (100%) |
| Story Points | 13/13 (100%) |
| Code Quality (ESLint) | 0 errors |
| Test Coverage | 100% passing |
| Build Status | ✅ Success |
| Bundle Size | 510 KB gzip |
| Performance | All checks passed |

### ✅ Quality Assurance

**7-Check QA Gate:** PASS
1. ✅ Code review & style - PASS (0 errors, 10 pre-existing UI warnings)
2. ✅ Unit tests & coverage - PASS (100% passing)
3. ✅ Acceptance criteria - 100% compliance (all 4 stories)
4. ✅ No regressions - PASS (verified all existing features)
5. ✅ Performance - PASS (O(n) queries, indexed lookups)
6. ✅ Security - PASS (no XSS, SQL injection, hardcoded secrets)
7. ✅ Documentation - PASS (code comments, JSDoc, this file)

**QA Verdict:** APPROVED FOR PRODUCTION (Quinn - Guardian)

### 📝 Documentation

- Sprint 2 QA Gate Report with 7-check analysis (466 lines)
- Code comments and JSDoc for all new services
- Type definitions documented with interfaces
- Database migrations with schema comments
- This changelog with complete feature list

### 🚀 Deployment

**Branch:** main
**Latest commits:**
- `5b90b67` - docs: Sprint 2 QA Gate Report - PASS verdict approved for production
- `f0664fb` - feat: implement Sprint 2 complete - loss tracking & tasks management

**Status:** ✅ Ready for production

### 🎯 Recommendations for Sprint 3

**High Priority:**
- [ ] Task notifications (email/SMS on task due)
- [ ] Task delegation (reassign to other users)
- [ ] My Day mobile optimization
- [ ] Archive old loss records (retention policy > 2 years)

**Medium Priority:**
- [ ] Loss reason trends (YoY comparison)
- [ ] Task templates (pre-built task sets by lead type)
- [ ] Bulk loss import (historical loss reasons)
- [ ] Task recurring (repeating tasks)

**Low Priority:**
- [ ] Loss reason auto-suggestions
- [ ] Task priority levels
- [ ] My Day export to PDF
- [ ] Task dependencies (ordering/prerequisites)

---

## [1.1.0] - 2026-02-24

### ✨ Added

#### Lead Value Management
- **Campo de Valor Estimado** (US-01): Add estimated contract value to leads
  - BRL currency input validation (positive numbers only)
  - Formatted display on Kanban cards (R$ format)
  - Optional field with "Sem valor definido" fallback
  - Foundation for audit logging

#### Pipeline Revenue Visibility
- **Totalizador por Coluna** (US-02): Real-time revenue totals per stage
  - Automatic calculation on lead movement
  - BRL formatting using native Intl API
  - Displayed below column headers

- **Receita Total Dashboard** (US-03): Executive revenue overview
  - Total pipeline value in RelatoriosPage
  - Stage-by-stage revenue breakdown
  - Filterable by period

#### Inactivity Management
- **Indicador Visual de Inatividade** (US-04): Smart risk indicators
  - Red/yellow visual borders on inactive leads
  - Configurable thresholds per pipeline stage (3-14 days)
  - Tooltip showing days since last activity
  - Alert icon with status badge
  - Threshold Configuration:
    - Reunião Realizada: 3-7 days
    - Proposta Enviada: 5-10 days
    - Em Negociação: 7-14 days
    - Contrato Gerado: 3-7 days
    - Venda Fechada: No threshold

#### Risk Dashboard
- **Painel de Leads em Risco** (US-05): Centralized at-risk management
  - New page: `/leads-em-risco`
  - List all leads exceeding inactivity thresholds
  - Sortable by: days inactive, value, pipeline stage
  - Status badges: 🔴 PERIGO / 🟡 ALERTA
  - Quick action buttons for follow-up (foundation)
  - Integrated in sidebar navigation

### 🔧 Technical Changes

#### New Files
- `src/lib/currency.ts` - BRL currency formatting utilities
  - `formatBRL()` - Format value to BRL
  - `parseBRLInput()` - Parse user input
  - `isValidBRLValue()` - Validate positive numbers

- `src/hooks/useInactivityThresholds.ts` - Inactivity management
  - `getInactivityStatus()` - Determine alert level
  - `calculateDaysSinceLastActivity()` - Calculate days
  - `getInactivityColor()` - Get CSS class for status

- `src/pages/AtRiskLeadsPage.tsx` - Risk dashboard component
  - Responsive table with sorting
  - Dynamic filtering based on thresholds
  - Status badges and action buttons

- `src/services/auditService.ts` - Audit logging foundation
  - `logLeadValueChange()` - Track value changes
  - `logCardMovement()` - Track stage movements
  - `updateLeadLastActivity()` - Update activity timestamp
  - Interfaces for audit trail structure

#### Modified Files
- `src/components/KanbanCard.tsx` - Added inactivity indicators
  - Visual border colors (red/yellow)
  - Alert icon with tooltip
  - Subtle background color for risk levels

- `src/components/LeadModal.tsx` - Enhanced value validation
  - Positive number validation (`.positive()`)
  - Input constraints: `min="0" step="0.01"`
  - Updated label to "Valor Estimado (R$)"

- `src/components/Sidebar.tsx` - New navigation route
  - Added "Leads em Risco" menu item with AlertTriangle icon
  - Links to `/leads-em-risco`

- `src/App.tsx` - Route integration
  - Added AtRiskLeadsPage route
  - Imported and configured new component

### 📊 Metrics

| Metric | Result |
|--------|--------|
| Stories Completed | 5/5 (100%) |
| Story Points | 13/13 (100%) |
| Code Quality (ESLint) | 0 errors |
| Test Coverage | 100% passing |
| Build Status | ✅ Success |
| Type Checking | ✅ No errors |

### ✅ Quality Assurance

**7-Check QA Gate:** PASS
1. ✅ Code review & style - PASS
2. ✅ Unit tests & coverage - PASS
3. ✅ Acceptance criteria - 100% compliance
4. ✅ No regressions - PASS
5. ✅ Performance - PASS (445KB gzip)
6. ✅ Security - PASS
7. ✅ Documentation - PASS

### 📝 Documentation

- Sprint 1 Implementation Summary (238 lines)
- Sprint 1 Completion Report (246 lines)
- QA Gate Report with 7 quality checks (392 lines)
- Code comments and JSDoc for new utilities
- This changelog

### 🚀 Deployment

**Branch:** main
**Commits:** 6 total
- `758d5e1` - docs: Sprint 1 QA Gate Report - PASS verdict
- `6ef379b` - docs: Sprint 1 completion report - ready for QA review
- `dfd4274` - docs: add Sprint 1 implementation summary
- `b222055` - feat: implement Sprint 1 complete - value pipeline & risk management
- `2c0f1c1` - feat: validate all 9 user stories - Draft to Ready transition
- `668ed9c` - feat: orchestrate CRM product increment - 4 epics, 9 user stories (Sprint 1-2)

**Status:** ✅ Ready for production

### 🎯 Recommendations for Sprint 2

**High Priority:**
- [ ] Create `audit_logs` table in Supabase for comprehensive audit trail
- [ ] Add `last_activity_at` column to leads table
- [ ] Implement automatic notifications for threshold breaches
- [ ] Build admin panel for configurable thresholds

**Medium Priority:**
- [ ] Add E2E tests for Kanban interactions
- [ ] Implement pagination for 500+ leads
- [ ] Add CSV export for reports
- [ ] Real-time updates via WebSocket

**Low Priority:**
- [ ] UI animations for state transitions
- [ ] Dark mode support
- [ ] Mobile optimization

---

## [0.0.0] - Initial Setup

Initial project setup with React, TypeScript, Tailwind CSS, and Shadcn UI components.
