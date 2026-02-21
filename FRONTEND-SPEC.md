# Frontend Specification - pipeline-buddy

**Document Type:** Technical Specification
**Framework:** React 18 + Vite + Tailwind CSS + shadcn/ui
**Last Updated:** 2026-02-20
**Status:** Active (Post-Brownfield Discovery Phase 3)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Design System](#design-system)
4. [State Management](#state-management)
5. [Navigation & Routing](#navigation--routing)
6. [Performance Characteristics](#performance-characteristics)
7. [Accessibility Status](#accessibility-status)
8. [Responsiveness](#responsiveness)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Bundler** | Vite | 5.4.19 | Fast ES module bundler |
| **Framework** | React | 18.3.1 | UI library |
| **Router** | React Router DOM | 6.30.1 | Client-side routing |
| **State** | TanStack React Query | 5.83.0 | Server state management |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **Components** | shadcn/ui + Radix UI | Latest | Headless component system |
| **DnD** | @dnd-kit | 6.3.1 + 10.0.0 | Drag-and-drop |
| **Forms** | React Hook Form + Zod | Latest | Form state & validation |
| **Database** | Supabase (PostgreSQL) | 2.97.0 | Backend services |
| **Charting** | Recharts | 2.15.4 | Data visualization |
| **Notifications** | Sonner | 1.7.4 | Toast notifications |
| **Icons** | Lucide React | 0.462.0 | Icon library |

### Project Structure

```
src/
├── App.tsx                        # Root app wrapper with routing
├── main.tsx                       # Vite entry point
├── index.css                      # Tailwind directives + design tokens
├── components/
│   ├── Sidebar.tsx                # Main navigation sidebar (dark mode, fixed width)
│   ├── NavLink.tsx                # Custom React Router NavLink wrapper
│   ├── KanbanCard.tsx             # Draggable kanban card component
│   ├── KanbanColumn.tsx           # Kanban column container
│   ├── LeadModal.tsx              # Lead creation/edit dialog
│   └── ui/                        # shadcn/ui component library (60+ components)
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── table.tsx
│       ├── sheet.tsx
│       ├── drawer.tsx
│       └── ... (60 total UI primitives)
├── pages/
│   ├── KanbanPage.tsx             # Pipeline Kanban board (main)
│   ├── LeadsPage.tsx              # Leads table with CRUD
│   ├── RelatoriosPage.tsx         # Reports/analytics dashboard
│   ├── NotFound.tsx               # 404 error page
│   └── Index.tsx                  # Legacy index (unused)
├── hooks/
│   ├── use-toast.ts               # Toast notification hook
│   └── use-mobile.tsx             # Mobile breakpoint detection hook
├── lib/
│   └── utils.ts                   # clsx/cn utilities
├── types/
│   └── crm.ts                     # Domain types (Lead, Card, Etapa, etc.)
├── integrations/
│   └── supabase/
│       ├── client.ts              # Supabase client initialization
│       └── types.ts               # Auto-generated Supabase types
└── test/
    ├── example.test.ts
    └── setup.ts
```

---

## Component Structure

### Component Hierarchy (Tree View)

```
App
├── QueryClientProvider (TanStack React Query)
│   └── TooltipProvider (Radix UI)
│       ├── Toaster (shadcn/ui)
│       ├── Sonner (Toast notifications)
│       └── BrowserRouter (React Router)
│           ├── Sidebar (width: 240px, fixed, dark background)
│           │   ├── Logo section
│           │   ├── NavLink x3
│           │   │   ├── Kanban
│           │   │   ├── Leads
│           │   │   └── Relatórios
│           │   └── Footer (System version)
│           │
│           └── main (flex-1)
│               └── Routes
│                   ├── /kanban → KanbanPage
│                   │   ├── Page header (title + card count)
│                   │   └── DndContext
│                   │       └── KanbanColumn x5
│                   │           └── KanbanCard x N
│                   │
│                   ├── /leads → LeadsPage
│                   │   ├── Page header (title + "Novo Lead" button)
│                   │   ├── Table (with leads data)
│                   │   │   ├── TableHeader
│                   │   │   └── TableBody
│                   │   │       └── TableRow x N
│                   │   └── LeadModal
│                   │
│                   ├── /relatorios → RelatoriosPage
│                   │   ├── Page header
│                   │   ├── StatCard x4
│                   │   │   ├── Total Leads
│                   │   │   ├── Pipeline Total
│                   │   │   ├── Vendas Fechadas
│                   │   │   └── Média na Etapa
│                   │   ├── Stage Distribution Section
│                   │   │   └── Progress bar x5 etapas
│                   │   └── Leads by Type Section
│                   │       └── 3-column grid (IMOBILIARIA, CONSTRUTORA, CORRETOR)
│                   │
│                   └── * → NotFound
```

### Component Breakdown

#### 1. **Sidebar** (`src/components/Sidebar.tsx`)
- **Type:** Layout container
- **Width:** Fixed 240px (`w-60`)
- **Background:** Dark sidebar color (`--sidebar-background: 222 30% 10%`)
- **Children:**
  - Logo section (icon + text)
  - Navigation menu (3 items via NavLink)
  - Footer (system version)
- **Issues:**
  - Not responsive on mobile (240px width on 320px screens = overflow)
  - No hamburger menu implementation
  - No mobile drawer/sheet support

#### 2. **KanbanPage** (`src/pages/KanbanPage.tsx`)
- **Type:** Main feature page
- **Features:**
  - Real-time drag-and-drop via @dnd-kit
  - 5-column Kanban layout (min-width: 280px per column)
  - Horizontal scroll on overflow
  - Auto-invalidate React Query on card move
  - Smooth animations on drag
- **Queries:**
  - `cards` (with nested `leads` relationship)
- **Mutations:**
  - `moveCard` (updates etapa + logs to movimentacoes table)
- **UX Issues:**
  - No loading skeleton (only spinner)
  - No empty state guidance
  - No error toast on failed moves
  - Horizontal scroll bad on mobile (no touch-friendly indicators)

#### 3. **LeadsPage** (`src/pages/LeadsPage.tsx`)
- **Type:** CRUD management page
- **Features:**
  - Table view with 7 columns
  - Empty state (dashed border + CTA)
  - Lead creation via modal
  - Auto-create card in first stage on lead creation
- **Queries:**
  - `leads` (ordered by criado_em DESC)
- **Mutations:**
  - `createLead` (dual insert: leads + cards)
- **UX Issues:**
  - No edit/delete functionality
  - Table not responsive (horizontal scroll on mobile)
  - No pagination or infinite scroll
  - No filters or search
  - Cell text overflow (line-clamp-1 but no tooltip)

#### 4. **RelatoriosPage** (`src/pages/RelatoriosPage.tsx`)
- **Type:** Analytics dashboard
- **Widgets:**
  - StatCard x4 (KPIs)
  - Stage distribution bar chart
  - Leads by type grid
- **Calculations:**
  - Total pipeline value
  - Closed deals sum
  - Average days per stage
  - Per-type lead count
- **UX Issues:**
  - Grid layout not responsive (2 cols on tablet breaks)
  - No date range filters
  - No export functionality
  - No trend visualization

#### 5. **LeadModal** (`src/components/LeadModal.tsx`)
- **Type:** Form dialog
- **Fields:** 9 form inputs with validation (Zod)
- **Features:**
  - Dialog pattern (responsive max-width: 448px)
  - Form validation feedback
  - Loading state on submit
- **UX Issues:**
  - Modal overflow on small screens (max-h-[90vh] can still be too large)
  - No rich field descriptions
  - Auto-focus not set
  - No required field visual indicator

#### 6. **KanbanCard** (`src/components/KanbanCard.tsx`)
- **Type:** Draggable component
- **Features:**
  - Drag feedback (opacity, scale, rotate)
  - Days in stage calculation
  - Truncated text with clamp-1
- **UX Issues:**
  - No visual feedback on touch devices
  - No context menu
  - No quick actions (edit, delete)

#### 7. **KanbanColumn** (`src/components/KanbanColumn.tsx`)
- **Type:** Droppable container
- **Features:**
  - Drop zone feedback (bg-accent/30 on hover)
  - Column total value sum
  - Card count badge
  - Color-coded top border per stage
- **UX Issues:**
  - Empty state text not visible on first load
  - No column actions (clear, collapse)

---

## Design System

### Color Palette

#### Semantic Colors (CSS Variables)

| Variable | Value | HSL | Usage |
|----------|-------|-----|-------|
| `--primary` | Blue | 217 91% 48% | Buttons, links, active states |
| `--secondary` | Light gray | 220 14% 93% | Badge backgrounds |
| `--muted` | Light gray | 220 14% 93% | Disabled states, placeholders |
| `--accent` | Light blue | 217 91% 95% | Hover states, focus rings |
| `--destructive` | Red | 0 84% 60% | Error states, dangerous actions |
| `--background` | Off-white | 220 20% 97% | Page backgrounds |
| `--foreground` | Dark gray | 222 30% 12% | Text |
| `--card` | White | 0 0% 100% | Card surfaces |

#### Sidebar (Dark Mode)

| Variable | Value | HSL | Purpose |
|----------|-------|-----|---------|
| `--sidebar-background` | Dark | 222 30% 10% | Sidebar background |
| `--sidebar-foreground` | Light gray | 220 20% 80% | Sidebar text |
| `--sidebar-accent` | Dark blue | 222 25% 16% | Active nav item |
| `--sidebar-primary` | Blue | 217 91% 55% | Logo icon background |

#### Stage Colors (Kanban Stages)

| Stage | CSS Variable | HSL | Color |
|-------|-------------|-----|-------|
| Reunião Realizada | `--etapa-reuniao` | 39 92% 52% | Orange |
| Proposta Enviada | `--etapa-proposta` | 217 91% 55% | Blue |
| Em Negociação | `--etapa-negociacao` | 270 70% 55% | Purple |
| Contrato Gerado | `--etapa-contrato` | 160 70% 40% | Teal |
| Venda Fechada | `--etapa-venda` | 142 76% 36% | Green |

### Typography

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| **Body** | Inter | 14px | 400 | Default text |
| **Label** | Inter | 14px | 500 | Form labels |
| **Button** | Inter | 14px | 600 | Button text |
| **Page Title** | Inter | 18px | 600 | H1 headers |
| **Card Title** | Inter | 14px | 600 | Card headings |
| **Muted Text** | Inter | 12px | 400 | Secondary text |
| **Small Text** | Inter | 12px | 400 | Captions |

**Font Stack:** `'Inter', system-ui, -apple-system, sans-serif`

### Spacing Scale

| Scale | Pixel Value |
|-------|------------|
| xs | 0.25rem (4px) |
| sm | 0.5rem (8px) |
| md | 1rem (16px) |
| lg | 1.5rem (24px) |
| xl | 2rem (32px) |

**Radius:** `0.5rem` (8px) for cards, buttons, inputs

### Shadows & Elevation

| Level | CSS | Usage |
|-------|-----|-------|
| sm | `shadow-sm` | Subtle depth |
| md | `shadow-md` | Card hover state |
| xl | `shadow-xl` | Drag overlay |

### Border Styles

| Element | Style |
|---------|-------|
| Cards | 1px solid `--border` |
| Inputs | 1px solid `--input` |
| Kanban column | 2px solid + 4px top colored border |
| Dividers | 1px solid `--border` |

### Scrollbar Styling

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
```

---

## State Management

### Data Fetching (React Query)

#### Query Keys

| Query Key | Endpoint | Refresh Rate | Cache Time |
|-----------|----------|--------------|-----------|
| `["cards"]` | `cards` + nested `leads` | On-demand | 5m default |
| `["leads"]` | `leads` | On-demand | 5m default |

#### Mutations

| Mutation | Operation | Side Effects |
|----------|-----------|--------------|
| `moveCard` | Update card etapa + insert movimentacao | Invalidate `["cards"]` |
| `createLead` | Insert lead + insert card | Invalidate `["leads"]` + `["cards"]` |

### Component State

| Hook | Purpose | Scope |
|------|---------|-------|
| `useState` | Local UI state (modals, drag active) | Component |
| `useQuery` | Server state fetching | Page-level |
| `useMutation` | Server-side mutations | Page-level |
| `useForm` (React Hook Form) | Form field state | Modal |
| `useToast` | Toast notifications | Global |

### Context

- **TooltipProvider** (Radix UI): Enables tooltips globally
- **QueryClientProvider**: Enables React Query globally
- No custom context providers for app state

---

## Navigation & Routing

### Routing Structure

```
/
├── /kanban (default redirect)
│   └── KanbanPage
├── /leads
│   └── LeadsPage
├── /relatorios
│   └── RelatoriosPage
└── * (catch-all)
    └── NotFound
```

### Navigation Components

#### Sidebar Navigation

- **Component:** `Sidebar.tsx`
- **NavLink:** Custom wrapper around React Router NavLink
- **Active State:** Highlighted with `--sidebar-accent` background
- **Items:** 3 navigation links (Kanban, Leads, Relatórios)

#### Breadcrumbs

- **Status:** NOT implemented
- **Recommendation:** Add for multi-level navigation if expanded

### Link Behavior

- **SPA Navigation:** React Router handles all navigation (no page reload)
- **Active Link State:** Applied via `activeClassName` prop
- **External Links:** None currently

---

## Performance Characteristics

### Bundle Analysis

| Metric | Estimation | Status |
|--------|------------|--------|
| **Total Size** | ~450 KB (gzipped ~130 KB) | Good |
| **Main Bundle** | ~280 KB (gzipped ~85 KB) | Acceptable |
| **React + Dependencies** | ~150 KB (gzipped ~45 KB) | Baseline |
| **Code Splitting** | NOT implemented | Needs improvement |
| **Lazy Loading** | NOT implemented | Needs improvement |

### Performance Opportunities

#### Code Splitting (Missing)
- **Issue:** All pages bundled together (KanbanPage, LeadsPage, RelatoriosPage)
- **Impact:** First load includes all page code even if user only visits one page
- **Solution:** Implement `React.lazy()` + Suspense for each page

#### Lazy Loading (Missing)
- **Issue:** All UI components from shadcn/ui are eagerly imported
- **Impact:** Unused dialogs, dropdowns, tabs are bundled
- **Solution:** Tree-shake unused components, lazy-load heavy libs (Recharts)

#### Rendering Optimization
- **Issue:** No React.memo() on KanbanCard (renders on parent re-render)
- **Impact:** Unnecessary re-renders of all cards when one changes
- **Solution:** Wrap KanbanCard in memo() + useMutation dependency tracking

#### Bundle Optimization
- **Lucide Icons:** Entire library bundled (~460 KB raw)
- **shadcn/ui:** 60+ component files included
- **Recommendation:** Audit unused imports, remove dead code

### Web Vitals (Estimated)

| Metric | Target | Status | Gap |
|--------|--------|--------|-----|
| **FCP** (First Contentful Paint) | <1.8s | ~2.5s | -0.7s |
| **LCP** (Largest Contentful Paint) | <2.5s | ~3.2s | -0.7s |
| **CLS** (Cumulative Layout Shift) | <0.1 | ~0.05 | Good |
| **TTI** (Time to Interactive) | <3.8s | ~4.5s | -0.7s |

**Recommendation:** Implement code splitting + lazy loading to improve FCP/LCP.

---

## Accessibility Status

### WCAG 2.1 Level AA Compliance Checklist

#### Perceivable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.4.3 Contrast (Min) | ⚠️ PARTIAL | Primary blue (91% brightness) on white has ~7:1 ratio ✓; sidebar text on dark needs testing |
| 1.4.4 Resize Text | ✓ PASS | CSS uses rem units, responsive |
| 1.4.5 Images of Text | N/A | No images of text |
| 1.4.10 Reflow | ⚠️ NEEDS WORK | Kanban horizontal scroll breaks at mobile widths |
| 1.4.11 Non-text Contrast | ⚠️ PARTIAL | Icons have good contrast; focus indicators need verification |
| 1.4.13 Content on Hover | ⚠️ PARTIAL | Truncated card text has no tooltip, hover doesn't reveal |

#### Operable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 2.1.1 Keyboard | ⚠️ PARTIAL | Form inputs keyboard accessible; drag-drop not keyboard operable |
| 2.1.2 No Keyboard Trap | ⚠️ NEEDS TEST | Modal focus management needs verification |
| 2.1.3 Keyboard (No Exception) | ⚠️ PARTIAL | Drag-drop not accessible via keyboard |
| 2.1.4 Character Key Shortcuts | N/A | No character shortcuts |
| 2.2.1 Timing Adjustable | ✓ PASS | No auto-advance or time limits |
| 2.3.1 Three Flashes | ✓ PASS | No flashing content |
| 2.4.1 Bypass Blocks | ⚠️ NEEDS WORK | No skip-to-main-content link |
| 2.4.2 Page Titled | ✓ PASS | React app sets document title |
| 2.4.3 Focus Order | ⚠️ NEEDS TEST | Need to verify focus order in forms |
| 2.4.4 Link Purpose | ⚠️ PARTIAL | NavLink text is clear; icon-only buttons lack aria-label |
| 2.4.7 Focus Visible | ⚠️ PARTIAL | Tailwind focus ring applied; needs manual testing |
| 2.5.1 Pointer Gestures | ⚠️ PARTIAL | Drag-drop not supported for touch/pointer |
| 2.5.2 Pointer Cancellation | ⚠️ PARTIAL | Drag overlay might cancel mid-operation |
| 2.5.4 Motion Actuation | ✓ PASS | No motion-dependent functionality |

#### Understandable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 3.1.1 Language of Page | ⚠️ NEEDS WORK | No `lang="pt-BR"` attribute on `<html>` |
| 3.1.2 Language of Parts | ✓ PASS | Content is consistently Portuguese |
| 3.2.1 On Focus | ✓ PASS | No unexpected context changes on focus |
| 3.2.2 On Input | ✓ PASS | Form submits only on button click |
| 3.3.1 Error Identification | ⚠️ PARTIAL | Form validation shows errors; server errors show toast |
| 3.3.2 Labels or Instructions | ⚠️ PARTIAL | Form fields labeled; table headers lack scope |
| 3.3.3 Error Suggestion | ✓ PASS | Form validation provides suggestions (min length, etc.) |
| 3.3.4 Error Prevention | ⚠️ PARTIAL | Form validation prevents submission; no confirmation on delete |

#### Robust

| Criterion | Status | Notes |
|-----------|--------|-------|
| 4.1.1 Parsing | ✓ PASS | React produces valid HTML |
| 4.1.2 Name, Role, Value | ⚠️ PARTIAL | Buttons have accessible names; drag handles lack ARIA roles |
| 4.1.3 Status Messages | ⚠️ PARTIAL | Toast notifications not announced to screen readers |

### Accessibility Issues (Priority)

1. **CRITICAL: Drag-and-drop not keyboard accessible**
   - Impact: Users with motor disabilities cannot move cards
   - Solution: Add keyboard shortcuts (arrow keys) or implement alternative interface

2. **HIGH: No aria-labels on icon buttons**
   - Impact: Screen reader users cannot identify buttons
   - Solution: Add `aria-label="Move card"` to draggable elements

3. **HIGH: Truncated text without tooltips**
   - Impact: Users cannot read full card/table cell content
   - Solution: Add `title` attribute or hover tooltip

4. **MEDIUM: Kanban horizontal scroll not touch-friendly**
   - Impact: Mobile users cannot easily scroll kanban board
   - Solution: Add visual scroll indicators, implement mobile navigation

5. **MEDIUM: No skip navigation link**
   - Impact: Keyboard users must tab through nav to reach main content
   - Solution: Add hidden skip-to-main link

6. **MEDIUM: Missing focus indicators**
   - Impact: Keyboard users cannot see focus state
   - Solution: Ensure all interactive elements have visible `:focus-visible` ring

7. **LOW: Modal focus management untested**
   - Impact: Screen reader users may not focus modal on open
   - Solution: Add `autoFocus` to first input, test with assistive tech

---

## Responsiveness

### Breakpoints

#### Tailwind Breakpoints (Configured)

| Breakpoint | Width | Used For |
|-----------|-------|----------|
| sm | 640px | Small phones |
| md | 768px | Tablets (primary breakpoint) |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

#### Custom Breakpoint in Code

```javascript
const MOBILE_BREAKPOINT = 768; // use-mobile.tsx
```

### Current Responsive Behavior

#### Desktop (1024px+)
- Sidebar: Fixed 240px width
- Main content: Full viewport height
- Kanban: 5 columns visible, horizontal scroll for overflow
- Relatórios: 4-column grid (StatCards), single charts
- Leads Table: 7 columns visible

#### Tablet (768px - 1023px)
- Sidebar: Still fixed 240px (takes 33% of screen at 768px) - **PROBLEM**
- Main content: ~528px available (768px - 240px)
- Kanban: 2-3 columns visible, horizontal scroll
- Relatórios: 2-column grid (StatCards breaks), charts stack
- Leads Table: Horizontal scroll needed

#### Mobile (< 768px)
- Sidebar: **BLOCKS MAIN CONTENT** (240px on 320px screen = 75% of width) - **CRITICAL**
- Main content: ~80px available (320px - 240px) - **UNUSABLE**
- Kanban: Columns overflow, no touch-friendly navigation
- Relatórios: Single column, elements stack
- Leads Table: Completely broken, no horizontal scroll indicators

### Responsive Issues (Severity)

#### Critical Issues

1. **Fixed 240px Sidebar Breaks Mobile**
   - **Problem:** `w-60` (240px) fixed width on 320px screens
   - **Impact:** Main content squeezed to 80px, completely unusable
   - **Solution:** Implement responsive sidebar (drawer on mobile)

2. **No Mobile Navigation**
   - **Problem:** No hamburger menu, drawer sheet, or alternative on mobile
   - **Impact:** Users cannot navigate between pages
   - **Solution:** Add sheet/drawer component with menu, toggle via button

#### High Priority Issues

3. **Kanban Horizontal Scroll Bad on Mobile**
   - **Problem:** 5 x 280px columns = 1400px, no scroll indicators
   - **Impact:** Users don't know they can scroll, lose context
   - **Solution:** Add scroll indicators, implement card density mode or mobile-optimized view

4. **Table Not Responsive**
   - **Problem:** 7-column table overflows on tablet/mobile, no wrapping
   - **Impact:** Users cannot see/interact with table on small screens
   - **Solution:** Implement card view on mobile, horizontal scroll with sticky first column, or row expand pattern

5. **Grid Layouts Break**
   - **Problem:** `grid-cols-2` on tablet (2x4 = 8 cells), `grid-cols-3` on stage distribution
   - **Impact:** Cards stack awkwardly, charts too narrow
   - **Solution:** Use responsive grid utilities: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

#### Medium Priority Issues

6. **Modal Overflow on Small Screens**
   - **Problem:** `max-w-lg` (512px) dialog on 320px screen = 100% width - 16px padding
   - **Impact:** Form inputs cramped, difficult to fill on mobile
   - **Solution:** Make modal full-width on mobile: `w-full sm:max-w-lg`

7. **Text Truncation Hides Content**
   - **Problem:** `line-clamp-1` on cards, no tooltip fallback
   - **Impact:** Long lead names not readable on mobile
   - **Solution:** Add hover tooltip, increase card width on mobile

### Mobile-First Recommendations

#### Layout Strategy
```
Desktop (1024px+):
  [Sidebar 240px] [Main 1184px+]

Tablet (768px - 1023px):
  [Sidebar 240px] [Main 528px] ← START BREAKING HERE

Mobile (< 768px):
  Drawer/Sheet (hidden by default)
  [Header with menu toggle] [Main full width]
```

#### Kanban Mobile Optimization
```
Desktop: 5 columns × 280px = 1400px (horizontal scroll)
Tablet: 3 columns × 250px = 750px (horizontal scroll)
Mobile: 1 column × 100% (vertical scroll, card density compressed)
  OR: Drawer selector with 1 visible + scrollable list
```

#### Table Mobile Optimization
```
Desktop: 7 columns (all visible)
Tablet: 3 main columns (horizontal scroll for others)
Mobile: Card view (name, company, type, actions stacked vertically)
  OR: Single "Details" column with row expand pattern
```

### Current CSS Media Query Usage

#### shadcn/ui Components
- Responsive button sizes (sm, md, lg)
- Dialog max-width: defaults to 512px (lg)
- Table responsive: none (relies on overflow)

#### Custom Components
- Sidebar: no responsive styles
- Kanban: `gap-4` (16px), `min-w-[280px]` fixed column width
- RelatoriosPage: `grid-cols-2 gap-4 lg:grid-cols-4` on StatCards ✓

#### Tailwind Utilities Applied
- `flex h-screen` (Sidebar fullscreen)
- `overflow-x-auto` (Kanban board horizontal scroll)
- `overflow-auto` (Main content scrollable)

---

## Summary of Key Findings

### Strengths
1. Modern tech stack (Vite + React 18 + Tailwind)
2. Consistent design system with CSS variables
3. Good use of shadcn/ui + Radix UI (accessible primitives)
4. React Query for data management (good separation of concerns)
5. Drag-and-drop implemented with @dnd-kit
6. Dark sidebar with good contrast
7. Form validation with Zod + React Hook Form

### Critical Gaps
1. **No responsive design for mobile** - Sidebar breaks layouts
2. **No mobile navigation** - No drawer/hamburger menu
3. **No drag-drop keyboard support** - Accessibility issue
4. **No code splitting** - All pages bundled together
5. **No lazy loading** - Bundle size not optimized
6. **Table not responsive** - No mobile-friendly alternative
7. **Kanban not mobile-optimized** - Horizontal scroll problematic

### Architecture Debt
- No error boundary component
- No custom hooks for common patterns (useFetch, useDebounce)
- No component composition patterns (compound components)
- No performance monitoring
- No analytics integration
- No offline support

---

## Recommendations (Phase 4)

### Immediate (Next Sprint)
1. Implement mobile-responsive sidebar (drawer on < 768px)
2. Add responsive table view (cards on mobile)
3. Add keyboard shortcuts for kanban (accessibility)
4. Implement code splitting per-page

### Short-term (2-3 Sprints)
1. Add loading/empty/error states to all pages
2. Implement aria-labels and ARIA roles
3. Add search/filter to leads table
4. Add export functionality to reports

### Medium-term (Next Quarter)
1. Performance optimization (bundle analysis, tree-shaking)
2. Dark mode support (theme switcher)
3. Advanced filters and date ranges
4. Mobile-optimized kanban view
5. Pagination or infinite scroll

---

**Document Version:** 1.0
**Created by:** @ux-design-expert (Uma)
**Date:** 2026-02-20
**Next Review:** Post-implementation of mobile responsiveness
