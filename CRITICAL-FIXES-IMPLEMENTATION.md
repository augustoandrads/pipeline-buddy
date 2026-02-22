# CRITICAL FIXES IMPLEMENTATION GUIDE

**Prepared by:** Quinn (@qa)
**Duration:** 14 hours to PASS gate
**Target:** MVP release readiness

---

## OVERVIEW

This document provides step-by-step implementation for the 4 critical items blocking QA PASS verdict.

| # | Fix | File | Time | Impact |
|---|-----|------|------|--------|
| 1 | Input sanitization | LeadModal | 2h | Security |
| 2 | Hook tests (useLeads, useCards) | New tests | 6h | Regression prevention |
| 3 | Keyboard navigation (Kanban) | KanbanPage | 3h | Accessibility |
| 4 | ARIA labels | Components | 4h | Accessibility (WCAG) |

---

## FIX 1: INPUT SANITIZATION (2 hours)

### Step 1.1: Install DOMPurify

```bash
cd /Users/augustoandrads/AIOS/pipeline-buddy
npm install dompurify
npm install --save-dev @types/dompurify
```

### Step 1.2: Update LeadModal.tsx

**File:** `src/components/LeadModal.tsx`

Current code (line 69-81):
```typescript
const handleSubmit = (values: FormValues) => {
  onSubmit({
    nome: values.nome,
    empresa: values.empresa,
    tipo_cliente: values.tipo_cliente,
    email: values.email || undefined,
    telefone: values.telefone || undefined,
    // ...
  });
};
```

**Replace with:**
```typescript
import DOMPurify from 'dompurify';

// Add sanitization helper
const sanitizeInput = (value: string | undefined): string | undefined => {
  if (!value) return value;
  return DOMPurify.sanitize(value).trim();
};

const handleSubmit = (values: FormValues) => {
  onSubmit({
    nome: sanitizeInput(values.nome),
    empresa: sanitizeInput(values.empresa),
    tipo_cliente: values.tipo_cliente,
    email: sanitizeInput(values.email) || undefined,
    telefone: sanitizeInput(values.telefone) || undefined,
    quantidade_imoveis: values.quantidade_imoveis,
    valor_estimado_contrato: values.valor_estimado_contrato,
    origem: values.origem || undefined,
    observacoes: sanitizeInput(values.observacoes),
  });
};
```

### Step 1.3: Verify

```bash
# Test that form still submits
npm run dev
# Navigate to Leads → New Lead
# Submit form with special characters: <script>alert('xss')</script>
# Verify form accepts it but sanitizes on backend
```

---

## FIX 2: HOOK TESTS (6 hours)

### Step 2.1: Create test directory structure

```bash
mkdir -p src/hooks/__tests__
mkdir -p src/components/__tests__
mkdir -p src/pages/__tests__
```

### Step 2.2: Create useLeads.test.ts

**File:** `src/hooks/__tests__/useLeads.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from '../useLeads';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array initially', () => {
    const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });
    expect(result.current.leads).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch leads successfully', async () => {
    const mockLeads = [
      {
        id: '1',
        nome: 'Test Lead',
        email: 'test@example.com',
        empresa: 'Test Co',
        tipo_cliente: 'IMOBILIARIA' as const,
        criado_em: '2026-02-22T00:00:00Z',
      },
    ];

    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockLeads, error: null }),
      }),
    } as any);

    const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.leads).toEqual(mockLeads);
  });

  it('should create a lead', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockResponse = [{ id: 'new-id' }];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.createLead({
        nome: 'New Lead',
        email: 'new@example.com',
        empresa: 'New Co',
        tipo_cliente: 'IMOBILIARIA',
      } as any);
    });

    expect(supabase.rpc).toHaveBeenCalledWith('create_lead_with_card', expect.any(Object));
  });
});
```

### Step 2.3: Create useCards.test.ts

**File:** `src/hooks/__tests__/useCards.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCards } from '../useCards';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch cards with leads', async () => {
    const mockCards = [
      {
        id: 'card-1',
        lead_id: 'lead-1',
        etapa: 'REUNIAO_REALIZADA' as const,
        data_entrada_etapa: '2026-02-22T00:00:00Z',
        criado_em: '2026-02-22T00:00:00Z',
        leads: {
          id: 'lead-1',
          nome: 'Test',
          empresa: 'Test Co',
          email: 'test@example.com',
        },
      },
    ];

    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockCards, error: null }),
      }),
    } as any);

    const { result } = renderHook(() => useCards(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cards).toEqual(mockCards);
  });

  it('should update card stage', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const mockCard = {
      id: 'card-1',
      etapa: 'REUNIAO_REALIZADA',
    };

    // Mock .select().eq().single()
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCard, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    const { result } = renderHook(() => useCards(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.updateCardStage({
        cardId: 'card-1',
        newStage: 'PROPOSTA_ENVIADA',
      });
    });

    expect(supabase.from).toHaveBeenCalledWith('cards');
  });
});
```

### Step 2.4: Run tests

```bash
npm test

# Expected output:
# ✓ src/hooks/__tests__/useLeads.test.ts (3)
# ✓ src/hooks/__tests__/useCards.test.ts (2)
# ✓ src/test/example.test.ts (1)
#
# Test Files  3 passed (3)
#      Tests  6 passed (6)
```

---

## FIX 3: KEYBOARD NAVIGATION (3 hours)

### Step 3.1: Add keyboard sensor to DndContext

**File:** `src/pages/KanbanPage.tsx`

Current sensors (lines 26-29):
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor)
);
```

✅ Good! KeyboardSensor already enabled.

### Step 3.2: Make Kanban cards focusable

**File:** `src/components/KanbanCard.tsx`

Current code (lines 24-38):
```tsx
return (
  <div
    ref={setNodeRef}
    style={style}
    {...listeners}
    {...attributes}
    role="button"
    tabIndex={0}
    aria-label={`Card: ${lead?.nome ?? "Sem nome"} em ${lead?.empresa ?? "empresa desconhecida"}`}
    className={cn(
      "cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all select-none",
      "hover:shadow-md hover:border-primary/30",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      isDragging && "cursor-grabbing opacity-80 shadow-xl rotate-1 scale-105"
    )}
  >
```

✅ Already has `tabIndex={0}` and `aria-label`!

### Step 3.3: Add keyboard instructions to KanbanPage

Add help text under header (line 106):

```tsx
// Add after the header
<div className="px-6 pt-2 pb-2 text-xs text-muted-foreground">
  💡 <strong>Keyboard:</strong> Tab to focus card → Arrow keys to move between columns → Space/Enter to drop
</div>
```

**File:** `src/pages/KanbanPage.tsx` (after line 108)

---

### Step 3.4: Verify keyboard navigation

```bash
npm run dev
# Navigate to Kanban page
# Press Tab repeatedly to focus cards
# Use Arrow Left/Right to move between columns
# Space/Enter should drop the card
```

✅ DnD-Kit's KeyboardSensor handles this automatically!

---

## FIX 4: ARIA LABELS (4 hours)

### Step 4.1: Update KanbanColumn

**File:** `src/components/KanbanColumn.tsx`

Current code (line 28):
```tsx
const { setNodeRef, isOver } = useDroppable({ id: etapa.key });
```

Should be:
```tsx
const { setNodeRef, isOver } = useDroppable({
  id: etapa.key,
  // Add accessibility hint
  data: { etapa: etapa.label },
});
```

Add ARIA attributes to column (line 32-39):
```tsx
<div
  ref={setNodeRef}
  aria-label={`Pipeline stage: ${etapa.label}. Drag cards here.`}
  role="region"
  className={cn(
    "flex min-w-[280px] max-w-[280px] flex-col rounded-xl border-2 border-t-4 bg-muted/40 transition-colors",
    ETAPA_COLORS[etapa.key],
    isOver ? "border-primary/40 bg-accent/30" : "border-border"
  )}
>
```

### Step 4.2: Update KanbanCard ARIA

**File:** `src/components/KanbanCard.tsx`

Current (line 31):
```tsx
aria-label={`Card: ${lead?.nome ?? "Sem nome"} em ${lead?.empresa ?? "empresa desconhecida"}`}
```

Update to be more descriptive:
```tsx
aria-label={`Lead: ${lead?.nome ?? "Sem nome"} from ${lead?.empresa ?? "unknown company"}. Company type: ${lead?.tipo_cliente ?? "unknown"}. In stage for ${diasNaEtapa} days.`}
```

### Step 4.3: Add labels to buttons

**File:** `src/pages/LeadsPage.tsx` (line 88-90)

Current:
```tsx
<Button onClick={() => setModalOpen(true)} className="gap-2">
  <Plus className="h-4 w-4" />
  Novo Lead
</Button>
```

Already has text! ✅

But update empty state button:
```tsx
<Button variant="outline" onClick={() => setModalOpen(true)} className="gap-2" aria-label="Create first lead">
  <Plus className="h-4 w-4" />
  Cadastrar primeiro lead
</Button>
```

### Step 4.4: Add heading hierarchy

**File:** `src/pages/RelatoriosPage.tsx` (line 91-94)

Current:
```tsx
<h1 className="text-lg font-semibold">Relatórios</h1>
<p className="text-sm text-muted-foreground">Visão geral do pipeline comercial</p>
```

✅ Already uses `<h1>`!

### Step 4.5: Add section labels

**File:** `src/pages/RelatoriosPage.tsx` (line 98)

Add aria-label to stat grid:
```tsx
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key metrics">
  {/* Stats */}
</div>
```

And section headers (lines 122, 153, 160):
```tsx
<h2 className="text-sm font-semibold mb-4" id="etapa-distribution">
  Distribuição por Etapa
</h2>
<div className="space-y-3" aria-labelledby="etapa-distribution">
```

### Step 4.6: Verify accessibility

```bash
npm run dev
# Use browser DevTools: Lighthouse > Accessibility
# Should show 80%+ accessibility score
```

---

## VERIFICATION CHECKLIST

After implementing all 4 fixes:

### Security (Fix 1)
- [ ] DOMPurify installed
- [ ] LeadModal sanitizes inputs
- [ ] Form still works
- [ ] No lint errors

### Testing (Fix 2)
- [ ] Test files created
- [ ] `npm test` passes all tests
- [ ] Coverage >= 50%

### Keyboard Navigation (Fix 3)
- [ ] Tab through cards works
- [ ] Arrow keys move between columns
- [ ] Space/Enter drops cards
- [ ] Help text visible

### Accessibility (Fix 4)
- [ ] All interactive elements have aria-labels
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Form labels associated
- [ ] Lighthouse a11y score >= 80

---

## FINAL VALIDATION

```bash
# Run all checks
npm run lint      # Should pass (7 non-blocking warnings OK)
npm run typecheck # Should pass
npm test          # All tests pass
npm run build     # Should succeed
```

Expected output:
```
✓ Lint: 7 warnings (non-blocking)
✓ TypeScript: No errors
✓ Tests: 6 passed
✓ Build: Success (737KB bundle)
```

---

## COMMIT STRATEGY

After each fix, commit:

```bash
# Fix 1
git add src/components/LeadModal.tsx
git commit -m "feat: add input sanitization with DOMPurify [QA]"

# Fix 2
git add src/hooks/__tests__/
git commit -m "test: add critical path tests for hooks [QA]"

# Fix 3
git add src/components/KanbanCard.tsx src/pages/KanbanPage.tsx
git commit -m "feat: add keyboard navigation to Kanban [Accessibility]"

# Fix 4
git add src/components/KanbanColumn.tsx src/pages/RelatoriosPage.tsx
git commit -m "feat: add ARIA labels for accessibility [WCAG]"
```

---

## NEXT STEPS

Once all 4 fixes verified:

1. **Mark QA gate as PASS** in story
2. **Record implementation notes** (what was done, how long)
3. **Plan Sprint 1.5** for HIGH priority items (code splitting, error logging, etc.)

---

**Prepared by Quinn (@qa)**
**Target Completion:** 14 hours
**Delivery Date:** Sprint 1.0 end (EOW Feb 28)

Quality First. Always. 🎯
