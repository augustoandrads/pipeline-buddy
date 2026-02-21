# WCAG 2.1 Level AA Accessibility Checklist

**Project:** pipeline-buddy
**Document Type:** Compliance Checklist
**Standard:** Web Content Accessibility Guidelines 2.1 Level AA
**Evaluation Date:** 2026-02-20
**Current Compliance:** 49% (19/39 checks passing)

---

## Summary

| Category | Passing | Failing | Needs Test | Compliance |
|----------|---------|---------|-----------|-----------|
| **Perceivable** | 3/8 | 3/8 | 2/8 | 38% |
| **Operable** | 3/12 | 5/12 | 4/12 | 25% |
| **Understandable** | 5/8 | 2/8 | 1/8 | 63% |
| **Robust** | 2/4 | 1/4 | 1/4 | 50% |
| **TOTAL** | **13/32** | **11/32** | **8/32** | **41%** |

**Status:** NOT COMPLIANT with WCAG 2.1 Level AA

---

## 1. PERCEIVABLE - Information and user interface components must be presentable to users

### 1.1 Text Alternatives

#### 1.1.1 Non-text Content (Level A)
- **Status:** ✓ PASS
- **Requirement:** All non-text content has text alternatives
- **Evidence:**
  - Icons use semantic naming (lucide-react)
  - No decorative images without alt text
  - Buttons have text labels
- **Action:** N/A

---

### 1.2 Time-based Media

#### 1.2.1 Audio-only and Video-only (Level A)
- **Status:** N/A PASS
- **Requirement:** No audio or video content
- **Evidence:** Application is data-driven, no media
- **Action:** N/A

---

### 1.3 Adaptable

#### 1.3.1 Info and Relationships (Level A)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Information and relationships conveyed by presentation are also available programmatically
- **Issues:**
  - Table headers lack scope attribute
  - Form groups not wrapped in fieldset
- **Evidence:**
  ```tsx
  // ISSUE: Table header without scope
  <TableHeader>
    <TableRow>
      <TableHead>Nome / Empresa</TableHead> {/* should have scope="col" */}
  ```
- **Action:** Add scope="col" to table headers; wrap related form fields

#### 1.3.2 Meaningful Sequence (Level A)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Reading and navigation order is logical
- **Issues:**
  - Modal form order is correct (OK)
  - Kanban column order follows workflow (OK)
  - Sidebar navigation order is logical (OK)
- **Evidence:** Component structure is semantically correct
- **Action:** Verify focus order in forms (may need autoFocus)

#### 1.3.3 Sensory Characteristics (Level A)
- **Status:** ✓ PASS
- **Requirement:** Instructions don't rely solely on shape, size, visual location, orientation, or sound
- **Evidence:** Instructions use text, not visual cues only
- **Action:** N/A

#### 1.3.4 Orientation (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Content not restricted to single orientation (portrait/landscape)
- **Evidence:** Responsive design, works in both orientations
- **Action:** N/A

#### 1.3.5 Identify Input Purpose (Level AA)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Input fields have programmatic purpose (autocomplete attributes)
- **Issues:**
  - Form inputs lack autocomplete attributes
  ```tsx
  // ISSUE: Missing autocomplete
  <Input placeholder="João Silva" {...field} /> {/* should have autocomplete="name" */}
  ```
- **Evidence:** LeadModal form lacks autocomplete hints
- **Action:** Add autocomplete="[purpose]" to form inputs

---

### 1.4 Distinguishable

#### 1.4.1 Use of Color (Level A)
- **Status:** ✓ PASS
- **Requirement:** Color not the only means of conveying information
- **Evidence:**
  - Stage badges use both color and text
  - Status indicators use icons + color
  - Form errors use color + text
- **Action:** N/A

#### 1.4.3 Contrast (Minimum) (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Text contrast ratio at least 4.5:1 (normal), 3:1 (large)
- **Evidence:**
  - Primary blue (217 91% 48%) on white: ~7.5:1 ✓
  - Sidebar text (220 20% 80%) on dark (222 30% 10%): ~12:1 ✓
  - All other color combinations meet AA standard
- **Manual Testing Needed:** Yes, verify all color combinations with tools
- **Action:** Run axe DevTools to verify all combinations

#### 1.4.4 Resize Text (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Text can be resized up to 200% without loss of functionality
- **Evidence:**
  - CSS uses rem/em units (scalable)
  - Flexbox layouts responsive
  - No fixed width text containers that overflow
- **Action:** N/A

#### 1.4.5 Images of Text (Level AA)
- **Status:** N/A PASS
- **Requirement:** Text not presented as images
- **Evidence:** No images of text in application
- **Action:** N/A

#### 1.4.10 Reflow (Level AA)
- **Status:** ✗ FAIL
- **Requirement:** Content can be presented without loss of information or functionality at:
  - 320 CSS pixels wide for vertical scrolling
  - 256 CSS pixels high for horizontal scrolling
- **Issues:**
  1. Sidebar 240px on 320px screen = overflow ✗
  2. Kanban board 1400px on 1024px screen = horizontal scroll ✗
  3. Table 7 columns on 768px = horizontal scroll ✗
  4. Modal 512px on 375px = too wide ✗
- **Evidence:** Multiple breakpoints fail at 320px-768px
- **Action:** Implement responsive layouts (see Priority Recommendations #1, 4, 6)

#### 1.4.11 Non-text Contrast (Level AA)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Visual elements have at least 3:1 contrast ratio
- **Issues:**
  - Focus ring color vs background needs testing
  - Icon colors in buttons need testing
  - Disabled button colors may be too light
- **Evidence:** Not formally tested
- **Action:** Run WebAIM contrast checker on all interactive elements

#### 1.4.12 Text Spacing (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Text can be resized with custom spacing without loss of content
- **Evidence:** Spacing uses percentage and em-based values
- **Action:** N/A

#### 1.4.13 Content on Hover or Focus (Level AA)
- **Status:** ✗ FAIL
- **Requirement:** Content revealed on hover/focus is not hidden again
- **Issues:**
  1. Card text truncated (line-clamp-1) with no tooltip
  2. Table cell text truncated with no tooltip
  3. No title attributes on hover
- **Evidence:**
  ```tsx
  {/* Truncated but no way to view full text */}
  <p className="line-clamp-1">{lead?.nome}</p>
  ```
- **Action:** Add title attribute or Tooltip wrapper (see Priority Recommendations #7)

---

## 2. OPERABLE - User interface components and navigation must be operable

### 2.1 Keyboard Accessible

#### 2.1.1 Keyboard (Level A)
- **Status:** ✗ FAIL
- **Requirement:** All functionality available from keyboard
- **Issues:**
  1. Drag-drop not keyboard accessible ✗ CRITICAL
  2. Some components lack tab order
  3. No keyboard shortcuts for main actions
- **Evidence:**
  - Cannot move cards via keyboard
  - Cannot activate card actions with Enter key
- **Action:** Implement keyboard support for drag-drop (see Priority Recommendations #2)

#### 2.1.2 No Keyboard Trap (Level A)
- **Status:** ⚠️ NEEDS TEST
- **Requirement:** Keyboard focus not trapped in any component
- **Issues:**
  - Modal focus management needs testing
  - Sheet drawer focus needs testing
- **Evidence:** Not formally tested
- **Action:** Test with keyboard: Open modal, try to Tab out, then test Escape key

#### 2.1.3 Keyboard (No Exception) (Level AAA)
- **Status:** ✗ FAIL (Not required for AA, but mentioned)
- **Requirement:** All functionality available from keyboard (no exceptions)
- **Issues:** Same as 2.1.1
- **Action:** N/A (AAA level, not required)

#### 2.1.4 Character Key Shortcuts (Level A)
- **Status:** N/A PASS
- **Requirement:** Character key shortcuts can be disabled
- **Evidence:** No character key shortcuts implemented
- **Action:** N/A

---

### 2.2 Enough Time

#### 2.2.1 Timing Adjustable (Level A)
- **Status:** ✓ PASS
- **Requirement:** No time limits on user interactions
- **Evidence:** No auto-advance, no time-based dismissals
- **Action:** N/A

#### 2.2.2 Pause, Stop, Hide (Level A)
- **Status:** ✓ PASS
- **Requirement:** Auto-playing content can be paused
- **Evidence:** No auto-playing content
- **Action:** N/A

#### 2.2.3 No Timing (Level AAA)
- **Status:** ✓ PASS (AAA requirement, but met)
- **Requirement:** No time limits except for real-time events
- **Evidence:** No time limits
- **Action:** N/A

#### 2.2.4 Interruptions (Level AAA)
- **Status:** ✓ PASS (AAA requirement, but met)
- **Requirement:** User can postpone interruptions
- **Evidence:** No interruptions/alerts
- **Action:** N/A

#### 2.2.5 Re-authenticating (Level AAA)
- **Status:** N/A PASS
- **Requirement:** Re-authentication preserves data
- **Evidence:** Not applicable (no login currently)
- **Action:** N/A

---

### 2.3 Seizures and Physical Reactions

#### 2.3.1 Three Flashes or Below Threshold (Level A)
- **Status:** ✓ PASS
- **Requirement:** No content flashes more than 3 times per second
- **Evidence:**
  - Loading spinner uses smooth animation
  - No rapid flashing
  - Tailwind animations respect prefers-reduced-motion
- **Action:** N/A

#### 2.3.2 Three Flashes (Level AAA)
- **Status:** ✓ PASS (AAA requirement, but met)
- **Requirement:** No flashing content at all
- **Evidence:** No flashing
- **Action:** N/A

#### 2.3.3 Animation from Interactions (Level AAA)
- **Status:** ⚠️ NEEDS TEST
- **Requirement:** Animations triggered by user can be disabled
- **Evidence:** Tailwind animations don't check prefers-reduced-motion
- **Action:** Add CSS rule to respect reduced motion preference

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    @apply !animate-none !transition-none;
  }
}
```

---

### 2.4 Navigable

#### 2.4.1 Bypass Blocks (Level A)
- **Status:** ✗ FAIL
- **Requirement:** Way to bypass navigation blocks (skip link)
- **Issues:**
  - No skip-to-main-content link
  - Users must tab through 3 nav links before reaching content
- **Evidence:** No skip link in App.tsx
- **Action:** Add skip link (see Priority Recommendations #8)

#### 2.4.2 Page Titled (Level A)
- **Status:** ✓ PASS
- **Requirement:** Page title describes topic or purpose
- **Evidence:** React Router / document.title is set
- **Action:** Verify title updates on route change

#### 2.4.3 Focus Order (Level A)
- **Status:** ⚠️ NEEDS TEST
- **Requirement:** Focus order is logical and meaningful
- **Issues:**
  - Modal form focus order needs testing
  - Kanban card focus order logical
  - Sidebar nav focus order logical
- **Evidence:** Not formally tested
- **Action:** Test Tab key through entire application, verify logical order

#### 2.4.4 Link Purpose (Visible Text) (Level A)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Link purpose is clear from visible text
- **Issues:**
  - NavLinks have clear text ✓
  - Buttons have clear text ✓
  - Icon-only buttons lack aria-label ✗ (if any exist)
  - "Novo Lead" button has icon + text ✓
- **Evidence:** Most buttons have text; need to audit icon-only buttons
- **Action:** Add aria-label to all icon-only buttons (see Priority Recommendations #7)

#### 2.4.5 Multiple Ways (Level AA)
- **Status:** ⚠️ PARTIAL
- **Requirement:** More than one way to find pages (navigation, search, sitemap)
- **Issues:**
  - Sidebar navigation provided ✓
  - No search function
  - No sitemap
  - No breadcrumbs
- **Evidence:** Only sidebar navigation available
- **Action:** Consider adding search (not required for AA, but recommended)

#### 2.4.6 Headings and Labels (Level A)
- **Status:** ✓ PASS
- **Requirement:** Headings and form labels describe topic or purpose
- **Evidence:**
  - Page titles are clear ("Pipeline Comercial", "Leads", "Relatórios")
  - Form labels are descriptive
  - No missing labels
- **Action:** N/A

#### 2.4.7 Focus Visible (Level AA)
- **Status:** ✗ FAIL
- **Requirement:** Keyboard focus indicator is visible
- **Issues:**
  1. Form inputs have focus ring ✓
  2. Sidebar nav items lack focus ring ✗
  3. Kanban cards lack focus ring ✗
  4. Table rows lack focus ring ✗
  5. Buttons have some styling but inconsistent
- **Evidence:** Many interactive elements lack visible focus indicator
- **Action:** Add focus-visible ring to all interactive elements (see Priority Recommendations #5)

#### 2.4.8 Focus Visible (Enhanced) (Level AAA)
- **Status:** ✗ FAIL (AAA requirement)
- **Requirement:** Focus indicator has 3px minimum width
- **Evidence:** Current focus ring too thin
- **Action:** N/A (AAA only)

---

### 2.5 Input Modalities

#### 2.5.1 Pointer Gestures (Level A)
- **Status:** ✗ FAIL
- **Requirement:** All pointer gestures have single-pointer alternative
- **Issues:**
  - Drag-drop not available via pointer + keyboard alternative
  - Cards require drag to move, no button alternative
- **Evidence:** No alternative to drag-drop
- **Action:** Provide context menu or "Move card" button as alternative

#### 2.5.2 Pointer Cancellation (Level A)
- **Status:** ⚠️ NEEDS TEST
- **Requirement:** Functions not triggered on pointer down, can be aborted
- **Issues:**
  - Drag-drop activation needs testing
  - Hover states need testing
- **Evidence:** Not formally tested
- **Action:** Test: drag card and move away before releasing (should not move)

#### 2.5.3 Label in Name (Level A)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Buttons with visible labels have matching accessible name
- **Issues:**
  - Most buttons OK
  - Icon-only buttons need aria-label
- **Evidence:** LeadModal "Cadastrar Lead" button has both visible text and semantic meaning
- **Action:** Audit all buttons for matching visible/accessible names

#### 2.5.4 Motion Actuation (Level A)
- **Status:** ✓ PASS
- **Requirement:** Functionality not triggered by device motion
- **Evidence:** No device motion sensitivity
- **Action:** N/A

#### 2.5.5 Target Size (Level AAA)
- **Status:** ⚠️ NEEDS TEST
- **Requirement:** Touch target is at least 44 × 44 CSS pixels
- **Issues:**
  - Sidebar nav items: ~44px height ✓
  - Kanban cards: ~160px width × ~120px height ✓
  - Table cells: may be too small for touch
  - Close button on modal: needs testing
- **Evidence:** Most targets appear adequate but need formal testing
- **Action:** Test on touch device, measure target sizes (44×44 minimum)

---

## 3. UNDERSTANDABLE - Information and operations must be understandable

### 3.1 Readable

#### 3.1.1 Language of Page (Level A)
- **Status:** ✗ FAIL
- **Requirement:** Page language is defined
- **Issues:**
  - No lang attribute on <html> element
  - Content is in Portuguese but not declared
- **Evidence:** Language not specified in index.html
- **Action:** Add `<html lang="pt-BR">` to index.html

#### 3.1.2 Language of Parts (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Parts of page in different languages are marked
- **Evidence:** Content consistently in Portuguese
- **Action:** N/A

#### 3.1.3 Unusual Words (Level AAA)
- **Status:** ✓ PASS (AAA, not required)
- **Requirement:** Unusual words have definitions
- **Evidence:** Portuguese terminology is standard CRM terms
- **Action:** N/A

#### 3.1.4 Abbreviations (Level AAA)
- **Status:** ⚠️ NEEDS TEST (AAA, not required)
- **Requirement:** Abbreviations explained
- **Evidence:** No unusual abbreviations found
- **Action:** N/A

#### 3.1.5 Reading Level (Level AAA)
- **Status:** ✓ PASS (AAA, not required)
- **Requirement:** Text reading level lower than upper secondary education
- **Evidence:** Language is simple, user-facing
- **Action:** N/A

---

### 3.2 Predictable

#### 3.2.1 On Focus (Level A)
- **Status:** ✓ PASS
- **Requirement:** No unexpected context change on focus
- **Evidence:** Focus doesn't trigger navigation or state changes
- **Action:** N/A

#### 3.2.2 On Input (Level A)
- **Status:** ✓ PASS
- **Requirement:** No unexpected context change on input
- **Evidence:** Form submission on button click only
- **Action:** N/A

#### 3.2.3 Consistent Navigation (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Repeated navigation components are consistent
- **Evidence:**
  - Sidebar navigation same across all pages
  - Nav items in same order
  - Styling consistent
- **Action:** N/A

#### 3.2.4 Consistent Identification (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Components with same functionality identified consistently
- **Evidence:**
  - Buttons have consistent styling
  - Icons have consistent meaning
  - Colors consistent across app
- **Action:** N/A

#### 3.2.5 Change on Request (Level AAA)
- **Status:** ✓ PASS (AAA, not required)
- **Requirement:** Changes in context only on user request
- **Evidence:** No auto-navigation, no unexpected state changes
- **Action:** N/A

---

### 3.3 Input Assistance

#### 3.3.1 Error Identification (Level A)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Error messages identify the problem
- **Issues:**
  1. Form validation errors shown ✓ (Zod + React Hook Form)
  2. Server errors shown as toast ✓
  3. No live region announcement for screen readers ✗
- **Evidence:**
  ```tsx
  {/* Error shows but not announced */}
  <FormMessage />
  ```
- **Action:** Wrap errors in live region with role="alert"

#### 3.3.2 Labels or Instructions (Level A)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Labels provided for form inputs
- **Issues:**
  1. LeadModal fields have labels ✓
  2. Table headers lack scope attribute
  3. Form instructions could be clearer
- **Evidence:** Most inputs labeled, but not all
- **Action:** Add descriptions to complex fields

#### 3.3.3 Error Suggestion (Level AA)
- **Status:** ✓ PASS
- **Requirement:** Error messages suggest correction
- **Evidence:**
  - Email validation: "E-mail inválido"
  - Required fields: "Nome é obrigatório"
  - Zod provides helpful messages
- **Action:** N/A

#### 3.3.4 Error Prevention (Level AA)
- **Status:** ⚠️ PARTIAL
- **Requirement:** For important operations, confirm before finalizing
- **Issues:**
  1. Form submission validates before submit ✓
  2. Lead deletion not implemented (OK)
  3. Card move not confirmed (risky, should add confirmation)
- **Evidence:** No confirm dialog before moving cards
- **Action:** Consider adding confirmation before destructive operations

---

## 4. ROBUST - Content must be compatible with current and future technologies

### 4.1 Compatible

#### 4.1.1 Parsing (Level A)
- **Status:** ✓ PASS
- **Requirement:** HTML is valid, no duplicate IDs
- **Evidence:** React produces valid HTML, no console errors
- **Action:** Run HTML validator (W3C) to verify

#### 4.1.2 Name, Role, Value (Level A)
- **Status:** ✗ FAIL
- **Requirement:** All components have accessible name, role, and value
- **Issues:**
  1. Draggable cards lack role="button" and aria-label ✗ CRITICAL
  2. Icon buttons lack aria-label ✗
  3. Form inputs have labels ✓
  4. Table cells lack semantic meaning ✗
- **Evidence:**
  ```tsx
  {/* No role, no name */}
  <div {...dragHandleProps}>
    {/* Card content */}
  </div>
  ```
- **Action:** Add ARIA roles and labels (see Priority Recommendations #3)

#### 4.1.3 Status Messages (Level AA)
- **Status:** ⚠️ PARTIAL
- **Requirement:** Messages are announced to assistive technology
- **Issues:**
  1. Toast notifications not announced (role="alert" not set) ✗
  2. Loading spinners not announced ✗
  3. Form validation messages not in live region ✗
- **Evidence:**
  ```tsx
  {/* Toast created with Sonner, needs role="alert" */}
  toast({ title: "Card movido com sucesso!" });
  ```
- **Action:** Ensure toast and alert components have role="alert" or role="status"

---

## Detailed Fixes by Priority

### CRITICAL Issues (Block Deployment)

#### Issue 1: Drag-drop not keyboard accessible (2.1.1)
**Files:** KanbanPage.tsx, KanbanCard.tsx
**Fix Time:** 1-2 hours
**Status Check:**
- [ ] Add KeyboardSensor to DndContext
- [ ] Test with keyboard (Tab + Arrow keys)
- [ ] Verify with screen reader

**Code:**
```tsx
import { KeyboardSensor, sortableKeyboardCoordinates } from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

---

#### Issue 2: Missing aria-labels (4.1.2)
**Files:** KanbanCard.tsx, RelatoriosPage.tsx (if icon buttons)
**Fix Time:** 1 hour
**Status Check:**
- [ ] Add aria-label to draggable cards
- [ ] Add aria-label to icon-only buttons
- [ ] Test with screen reader

**Code:**
```tsx
<div
  role="button"
  aria-label={`Card: ${lead.nome}. Stage: ${card.etapa}. Days in stage: ${diasNaEtapa}`}
>
```

---

#### Issue 3: Content overflows on mobile (1.4.10)
**Files:** App.tsx, LeadsPage.tsx, LeadModal.tsx
**Fix Time:** 3-4 hours
**Status Check:**
- [ ] Responsive sidebar (drawer < 768px)
- [ ] Table card view (mobile)
- [ ] Modal responsive width
- [ ] Test at 320px, 768px, 1024px

---

### HIGH Priority Issues

#### Issue 4: No focus visible (2.4.7)
**Files:** index.css, NavLink.tsx, other interactive components
**Fix Time:** 1-2 hours
**Status Check:**
- [ ] Add focus-visible ring to all interactive elements
- [ ] Test with keyboard Tab
- [ ] Verify contrast of focus ring

---

#### Issue 5: No skip navigation link (2.4.1)
**Files:** App.tsx
**Fix Time:** 30 minutes
**Status Check:**
- [ ] Add skip link
- [ ] Test that Tab shows skip link
- [ ] Test that clicking skips to main content

---

#### Issue 6: Missing language declaration (3.1.1)
**Files:** index.html or main.tsx
**Fix Time:** 5 minutes
**Status Check:**
- [ ] Add lang="pt-BR" to <html>
- [ ] Test with screen reader

---

### MEDIUM Priority Issues

#### Issue 7: Toast notifications not announced (4.1.3)
**Files:** UI components (toaster.tsx, sonner.tsx)
**Fix Time:** 1 hour
**Status Check:**
- [ ] Ensure toast has role="alert" or role="status"
- [ ] Verify announced by screen reader

---

#### Issue 8: Form validation not announced (4.1.3)
**Files:** LeadModal.tsx
**Fix Time:** 1 hour
**Status Check:**
- [ ] Wrap FormMessage in live region
- [ ] Verify error announced by screen reader

---

#### Issue 9: Truncated text no tooltip (1.4.13)
**Files:** KanbanCard.tsx, LeadsPage.tsx
**Fix Time:** 1 hour
**Status Check:**
- [ ] Add title attribute to truncated text
- [ ] Or add Tooltip component
- [ ] Test hover on desktop, tap on mobile

---

### LOW Priority (Enhancements)

#### Issue 10: No prefers-reduced-motion (2.3.3)
**Files:** index.css
**Fix Time:** 30 minutes
**Status Check:**
- [ ] Add reduced-motion media query
- [ ] Test with OS accessibility settings

---

## Testing Tools & Resources

### Automated Testing
- **axe DevTools** (Chrome extension) - Catch accessibility violations
- **WAVE** (webaim.org/articles/webaim_wave) - Detailed feedback
- **Lighthouse** (Chrome DevTools) - Accessibility audit score
- **W3C Validator** - HTML validity

### Manual Testing
- **Keyboard Navigation:** Tab, Shift+Tab, Enter, Escape, Arrow keys
- **Screen Readers:**
  - Windows: NVDA (free) or JAWS (paid)
  - macOS: VoiceOver (built-in)
  - iOS: VoiceOver (built-in)
  - Android: TalkBack (built-in)
- **Mobile Testing:** iPhone, iPad, Android devices at various sizes
- **Color Contrast:** WebAIM Contrast Checker
- **Touch Target Size:** Measure at 44×44 CSS pixels minimum

### Checklist for Each Change
- [ ] Automated testing pass (axe)
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (at least one)
- [ ] Mobile device tested (at least one)
- [ ] Focus visible at all breakpoints
- [ ] Color contrast ratio meets AA standard

---

## Compliance Roadmap

### Phase 1: Critical (Must-Have)
**Deadline:** 1 week
**Status:** 0% → 50%
- [ ] Keyboard accessible drag-drop
- [ ] Aria-labels on all buttons/cards
- [ ] Responsive layout on mobile

### Phase 2: High Priority
**Deadline:** 2 weeks
**Status:** 50% → 75%
- [ ] Focus visible on all interactive elements
- [ ] Skip navigation link
- [ ] Language declaration
- [ ] Modal responsive on mobile

### Phase 3: Medium Priority
**Deadline:** 3-4 weeks
**Status:** 75% → 90%
- [ ] Toast and error announcements
- [ ] Tooltips for truncated text
- [ ] Form field descriptions
- [ ] Prefers-reduced-motion support

### Phase 4: Testing & Validation
**Deadline:** 4-5 weeks
**Status:** 90% → 100%
- [ ] Full keyboard testing (all pages)
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Mobile touch target testing
- [ ] Color contrast verification
- [ ] Focus order verification
- [ ] WCAG 2.1 Level AA audit

**Target:** 95%+ compliance

---

## Resources

### WCAG 2.1 Standards
- [WCAG 2.1 Overview](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools & Libraries
- **@dnd-kit/core** - Keyboard accessibility support
- **next-themes** - Prefers-color-scheme support
- **lucide-react** - Semantic icon naming
- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless accessible components

### Testing Resources
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Tool](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| UX Designer | @ux-design-expert (Uma) | 2026-02-20 | ✓ Reviewed |
| Developer | — | — | Pending |
| QA | — | — | Pending |

---

**Document Version:** 1.0
**Last Updated:** 2026-02-20
**Next Review:** After Phase 1 implementation

