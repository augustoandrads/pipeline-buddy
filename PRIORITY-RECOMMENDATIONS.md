# Priority Recommendations - pipeline-buddy

**Status:** Post-Brownfield Discovery (Phase 3 - UX Audit)
**Date:** 2026-02-20
**Evaluator:** @ux-design-expert (Uma)
**Severity Levels:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW | 🔵 ENHANCEMENT

---

## Top 10 Recommended Changes

### 1. 🔴 CRITICAL: Implement Responsive Sidebar (Mobile Navigation)

**Issue:** Fixed 240px sidebar breaks layout on phones, making app unusable

**Impact:**
- 60% of web traffic is mobile
- 320px phone screens: only 80px left for content (unusable)
- No way to navigate on mobile

**Current Code:**
```tsx
// src/App.tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar /> {/* w-60 fixed always visible */}
  <main className="flex-1 overflow-auto">
```

**Recommended Solution:**

```tsx
// src/App.tsx - NEW
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const App = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {isMobile ? (
            // Mobile: Sidebar as drawer
            <div className="flex h-screen flex-col">
              <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-60 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
                <h1 className="font-semibold">Pipeline Buddy</h1>
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Routes>{/* routes */}</Routes>
              </main>
            </div>
          ) : (
            // Desktop: Fixed sidebar
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-background">
                <Routes>{/* routes */}</Routes>
              </main>
            </div>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
```

**Additional Changes:**
- Update Sidebar to remove `h-screen` when inside Sheet
- Add mobile header with menu button
- Add touch-friendly button sizes on mobile

**Effort:** 2-3 hours
**Files:** App.tsx, components/Sidebar.tsx
**Testing:** Test on 320px, 375px, 768px, 1024px widths

---

### 2. 🔴 CRITICAL: Implement Keyboard Support for Drag-and-Drop

**Issue:** Users cannot move Kanban cards with keyboard (accessibility failure)

**WCAG:** 2.1.1 Keyboard (Level A - fails completely)

**Current Code:**
```tsx
// src/pages/KanbanPage.tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  // No keyboard sensor!
);
```

**Recommended Solution:**

```tsx
// src/pages/KanbanPage.tsx - UPDATED
import {
  DndContext,
  PointerSensor,
  KeyboardSensor, // ADD THIS
  useSensors,
  sortableKeyboardCoordinates, // ADD THIS
} from "@dnd-kit/core";

export default function KanbanPage() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { // ADD THIS
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    // ... existing code

    <DndContext sensors={sensors} /* ... */>
      {/* Add help text below header */}
      <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
        <p className="text-sm text-blue-700">
          Keyboard users: Use arrow keys to select cards, Enter to activate drag mode.
        </p>
      </div>
      {/* rest of component */}
    </DndContext>
  );
}
```

**Alternative: Keyboard Shortcuts**

If @dnd-kit keyboard doesn't work well, add custom shortcuts:

```tsx
// In KanbanCard or custom hook
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter") {
    setDragMode(true);
    e.preventDefault();
  }
  if (e.key === "ArrowUp" && dragMode) {
    moveCard(card.id, ETAPAS[currentEtapaIndex - 1].key);
  }
  if (e.key === "ArrowDown" && dragMode) {
    moveCard(card.id, ETAPAS[currentEtapaIndex + 1].key);
  }
  if (e.key === "Escape" && dragMode) {
    setDragMode(false);
  }
};
```

**Effort:** 1-2 hours
**Files:** KanbanPage.tsx, KanbanCard.tsx
**Testing:** Test Tab key to focus cards, then arrow keys to move

---

### 3. 🔴 CRITICAL: Add aria-labels to Draggable Cards

**Issue:** Screen readers cannot identify draggable elements

**WCAG:** 4.1.2 Name, Role, Value (Level A - fails completely)

**Current Code:**
```tsx
// src/components/KanbanCard.tsx
<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
  {/* No role, no aria-label, screen readers hear nothing */}
```

**Recommended Solution:**

```tsx
// src/components/KanbanCard.tsx - UPDATED
export function KanbanCard({ card, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const lead = card.leads;
  const diasNaEtapa = differenceInDays(new Date(), parseISO(card.data_entrada_etapa));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={`Lead: ${lead?.nome || "Sem nome"}. Empresa: ${lead?.empresa || "Sem empresa"}. Etapa: ${card.etapa}. ${diasNaEtapa} dias nessa etapa. Pressione Enter para ativar modo arrastar, ou use as setas direcionais.`}
      aria-describedby={`card-${card.id}-value`}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all select-none",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", // ADD FOCUS
        "hover:shadow-md hover:border-primary/30",
        isDragging && "cursor-grabbing opacity-80 shadow-xl rotate-1 scale-105"
      )}
    >
      {/* Existing content */}
      <p className="text-sm font-semibold leading-tight line-clamp-1">{lead?.nome ?? "—"}</p>
      {/* ... rest */}
    </div>
  );
}
```

**Effort:** 1 hour
**Files:** KanbanCard.tsx, KanbanColumn.tsx
**Testing:** Test with screen reader (NVDA, JAWS, or macOS VoiceOver)

---

### 4. 🟠 HIGH: Implement Table Card View for Mobile

**Issue:** 7-column table not responsive on phones/tablets

**Current Code:**
```tsx
// src/pages/LeadsPage.tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome / Empresa</TableHead>
      <TableHead>Tipo</TableHead>
      {/* 5 more columns */}
    </TableRow>
  </TableHeader>
  <TableBody>{/* rows */}</TableBody>
</Table>
```

**Recommended Solution:**

```tsx
// src/pages/LeadsPage.tsx - UPDATED
import { useIsMobile } from "@/hooks/use-mobile";

export default function LeadsPage() {
  const isMobile = useIsMobile();
  // ... rest of component

  return (
    <div className="flex flex-col h-full">
      {/* Header ... */}

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum lead cadastrado ainda.</p>
            <Button variant="outline" onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar primeiro lead
            </Button>
          </div>
        ) : isMobile ? (
          // MOBILE: Card view
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground">{lead.empresa}</p>
                  </div>
                  <Badge className={TIPO_COLORS[lead.tipo_cliente]}>
                    {TIPO_CLIENTE_LABELS[lead.tipo_cliente]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {lead.email && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.telefone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{lead.telefone}</span>
                    </div>
                  )}
                  {lead.valor_estimado_contrato && (
                    <div className="font-semibold text-primary">
                      R$ {lead.valor_estimado_contrato.toLocaleString("pt-BR")}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {format(new Date(lead.criado_em), "dd/MM", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // DESKTOP: Table view (existing code)
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              {/* existing table code */}
            </Table>
          </div>
        )}
      </div>

      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={createLead.mutate}
        isLoading={createLead.isPending}
      />
    </div>
  );
}
```

**Effort:** 2-3 hours
**Files:** LeadsPage.tsx
**Testing:** Test on 320px (card view), 768px (table), 1024px (table)

---

### 5. 🟠 HIGH: Add Visible Focus Indicators

**Issue:** Keyboard users cannot see which element has focus

**WCAG:** 2.4.7 Focus Visible (Level AA)

**Current Code:**
```tsx
// Most components have no focus-visible ring
<NavLink to={to} className={/* no focus ring */} />
```

**Recommended Solution:**

Add to `src/index.css`:

```css
/* Add focus-visible to all interactive elements */
@layer base {
  button,
  a,
  [role="button"],
  input,
  select,
  textarea {
    @apply focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2;
  }
}
```

Or update components individually:

```tsx
// src/components/NavLink.tsx
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", // ADD THIS
            className,
            isActive && activeClassName,
            isPending && pendingClassName
          )
        }
        {...props}
      />
    );
  }
);
```

**Effort:** 1-2 hours
**Files:** index.css, NavLink.tsx, Button components
**Testing:** Tab through page, verify ring visible on all interactive elements

---

### 6. 🟠 HIGH: Fix Modal Width on Mobile

**Issue:** 512px dialog too wide for phones, form cramped

**Current Code:**
```tsx
// src/components/LeadModal.tsx
<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
```

**Recommended Solution:**

```tsx
// src/components/LeadModal.tsx - UPDATED
import { useIsMobile } from "@/hooks/use-mobile";

export function LeadModal({ open, onClose, onSubmit, isLoading }: LeadModalProps) {
  const isMobile = useIsMobile();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { /* ... */ },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto",
          isMobile ? "w-[95vw] max-w-none mx-auto" : "max-w-lg" // CHANGE THIS
        )}
      >
        {/* rest of modal */}
      </DialogContent>
    </Dialog>
  );
}
```

**Effort:** 30 minutes
**Files:** LeadModal.tsx
**Testing:** Test on 320px, 375px, 640px

---

### 7. 🟡 MEDIUM: Add aria-label to Icon Buttons

**Issue:** Icon-only buttons lack accessible names

**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Example in RelatoriosPage:**
```tsx
// If any buttons use icon-only without text:
<Button onClick={...} className="gap-2">
  <Download className="h-4 w-4" /> {/* No text, no aria-label */}
</Button>
```

**Recommended Solution:**

```tsx
// Add aria-label for icon-only buttons
<Button
  onClick={...}
  aria-label="Download relatório em PDF"
  className="gap-2"
>
  <Download className="h-4 w-4" />
</Button>

// Or add text
<Button onClick={...} className="gap-2">
  <Download className="h-4 w-4" />
  Download PDF
</Button>
```

**Effort:** 1 hour
**Files:** RelatoriosPage.tsx, any other pages with icon-only buttons
**Testing:** Test with screen reader

---

### 8. 🟡 MEDIUM: Add Skip Navigation Link

**Issue:** Keyboard users must tab through 3 nav links before reaching content

**WCAG:** 2.4.1 Bypass Blocks (Level A)

**Recommended Solution:**

```tsx
// src/App.tsx - Add at top of return
<a
  href="#main-content"
  className="fixed left-0 top-0 z-50 -translate-y-full rounded-b-lg bg-primary px-4 py-2 text-primary-foreground focus:translate-y-0"
>
  Skip to main content
</a>

// Then add id to main element
<main id="main-content" className="flex-1 overflow-auto bg-background">
```

**Effort:** 30 minutes
**Files:** App.tsx
**Testing:** Press Tab immediately after page load, skip link should appear

---

### 9. 🟡 MEDIUM: Implement Kanban Mobile View (Optional)

**Issue:** 5-column Kanban board requires horizontal scroll on tablets/mobile

**Recommended Solution (Optional - Complex):**

```tsx
// src/pages/KanbanPage.tsx - Add toggle
const [compactView, setCompactView] = useState(false);

// Desktop: Normal view
// Mobile: Single column at a time, with dropdown to select stage

{compactView && isMobile ? (
  <>
    <Select value={selectedStage} onValueChange={setSelectedStage}>
      <SelectTrigger className="w-full mx-6 mb-4">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ETAPAS.map((etapa) => (
          <SelectItem key={etapa.key} value={etapa.key}>
            {etapa.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <div className="flex flex-1 gap-4 overflow-x-auto p-6">
      <KanbanColumn
        etapa={ETAPAS.find((e) => e.key === selectedStage)!}
        cards={getCardsForEtapa(selectedStage)}
      />
    </div>
  </>
) : (
  // Normal view
  <div className="flex flex-1 gap-4 overflow-x-auto p-6">
    {ETAPAS.map((etapa) => (
      <KanbanColumn {...} />
    ))}
  </div>
)}
```

**Effort:** 2-3 hours (optional, can defer)
**Files:** KanbanPage.tsx
**Testing:** Test on mobile with dropdown selector

---

### 10. 🔵 ENHANCEMENT: Implement Dark Mode

**Issue:** No dark mode despite `next-themes` being installed

**Current Code:**
```tsx
// Installed but not implemented:
import { ThemeProvider } from "next-themes";
```

**Recommended Solution:**

```tsx
// src/App.tsx
import { ThemeProvider } from "next-themes";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {/* existing app */}
  </ThemeProvider>
);

// src/index.css - Add dark mode colors
@media (prefers-color-scheme: dark) {
  :root {
    --background: 220 20% 12%;
    --foreground: 220 20% 97%;
    --card: 222 30% 16%;
    --sidebar-background: 220 20% 8%;
    /* ... update all colors for dark theme */
  }

  html.dark {
    /* same as above */
  }
}

// src/components/Sidebar.tsx - Add theme toggle
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
>
  {theme === "dark" ? (
    <Sun className="h-4 w-4" />
  ) : (
    <Moon className="h-4 w-4" />
  )}
  {theme === "dark" ? "Light" : "Dark"} Mode
</button>
```

**Effort:** 2-3 hours
**Files:** App.tsx, index.css, Sidebar.tsx
**Testing:** Toggle theme, verify all colors update

---

## Summary Table

| # | Recommendation | Severity | Effort | WCAG | Priority |
|---|---|---|---|---|---|
| 1 | Responsive sidebar | 🔴 CRITICAL | 2-3h | 2.4.1 | **1** |
| 2 | Keyboard drag-drop | 🔴 CRITICAL | 1-2h | 2.1.1 | **2** |
| 3 | Aria-labels (cards) | 🔴 CRITICAL | 1h | 4.1.2 | **3** |
| 4 | Table card view | 🟠 HIGH | 2-3h | 1.4.10 | **4** |
| 5 | Focus indicators | 🟠 HIGH | 1-2h | 2.4.7 | **5** |
| 6 | Modal width (mobile) | 🟠 HIGH | 30m | 1.4.10 | **6** |
| 7 | Aria-labels (buttons) | 🟡 MEDIUM | 1h | 4.1.2 | **7** |
| 8 | Skip nav link | 🟡 MEDIUM | 30m | 2.4.1 | **8** |
| 9 | Kanban mobile view | 🟡 MEDIUM | 2-3h | 1.4.10 | **9** (optional) |
| 10 | Dark mode | 🔵 ENHANCEMENT | 2-3h | — | **10** (optional) |

---

## Implementation Timeline

### Week 1: Critical Fixes (20-24 hours)
- [ ] Recommendations 1, 2, 3
- **Result:** Mobile usable, keyboard accessible, screen reader compatible
- **Tests:** Mobile layout, keyboard navigation, screen reader

### Week 2: High-Priority UX (8-10 hours)
- [ ] Recommendations 4, 5, 6
- **Result:** Better tablet/mobile UX, visible focus, better modal
- **Tests:** Tablet layout, focus visible, modal on mobile

### Week 3: Accessibility & Polish (2-4 hours)
- [ ] Recommendations 7, 8
- **Result:** Full WCAG AA compliance
- **Tests:** Screen reader, keyboard navigation

### Week 4: Enhancements (Optional)
- [ ] Recommendations 9, 10
- **Result:** Mobile-optimized kanban, dark mode

---

## Testing Checklist

### Mobile Testing (Devices)
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] Pixel 5 (393px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)

### Keyboard Testing
- [ ] Tab through all pages
- [ ] Enter to activate buttons
- [ ] Arrow keys for kanban (if implemented)
- [ ] Escape to close modals

### Screen Reader Testing
- [ ] NVDA (Windows) or JAWS
- [ ] VoiceOver (macOS/iOS)
- [ ] TalkBack (Android)
- Test: Navigation, form labels, drag-drop descriptions, error messages

### Browser Testing
- [ ] Chrome/Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop + iOS)
- [ ] Chrome (Android)

---

**Document Version:** 1.0
**Created by:** @ux-design-expert (Uma)
**Date:** 2026-02-20
**Status:** Ready for Implementation

