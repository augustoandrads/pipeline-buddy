# QA TEST STRATEGY & IMPLEMENTATION ROADMAP

**Prepared by:** Quinn (@qa)
**Date:** 2026-02-22
**Target Coverage:** 60-70% for MVP

---

## TEST IMPLEMENTATION ROADMAP

### Phase 1: Critical Path Tests (Week 1) — 6 hours
Target: 40-50% coverage of main functionality

#### 1.1 Hook Tests: useLeads (2 hours)
**File:** `src/hooks/__tests__/useLeads.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from '../useLeads';
import * as supabaseClient from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all leads and return them', async () => {
    const mockLeads = [
      {
        id: '1',
        nome: 'João Silva',
        email: 'joao@test.com',
        empresa: 'Imob XYZ',
        tipo_cliente: 'IMOBILIARIA',
        criado_em: '2026-02-22T00:00:00Z',
      },
    ];

    vi.mocked(supabaseClient.supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockLeads, error: null }),
    } as any);

    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper(),
    });

    // Loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.leads).toEqual(mockLeads);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(supabaseClient.supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any);

    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });
  });

  it('should create a lead with initial card', async () => {
    const newLead = {
      nome: 'Ana Silva',
      email: 'ana@test.com',
      empresa: 'Construtora ABC',
      tipo_cliente: 'CONSTRUTORA' as const,
    };

    vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
      data: [{ id: 'new-id', ...newLead, criado_em: '2026-02-22' }],
      error: null,
    });

    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.createLead(newLead as any);
    });

    expect(supabaseClient.supabase.rpc).toHaveBeenCalledWith(
      'create_lead_with_card',
      expect.objectContaining({
        p_name: newLead.nome,
        p_email: newLead.email,
      })
    );
  });
});
```

---

#### 1.2 Hook Tests: useCards (2 hours)
**File:** `src/hooks/__tests__/useCards.test.ts`

**Key test cases:**
- Fetch cards with lead details
- Move card to new stage
- Record movement history
- Handle errors

**Test template:**
```typescript
describe('useCards', () => {
  it('should fetch cards with lead relationship', async () => {
    // Similar to useLeads
  });

  it('should move card and record movement', async () => {
    // Mock both .update() and .insert() calls
  });

  it('should handle stage update errors', async () => {
    // Test error handling
  });
});
```

---

#### 1.3 Hook Tests: useFunnelData (1 hour)
**File:** `src/hooks/__tests__/useFunnelData.test.ts`

**Test cases:**
- Calculate conversion rates correctly
- Build funnel data structure
- Handle empty data
- Calculate percentages correctly

---

### Phase 2: Component & Form Tests (Week 2) — 4 hours
Target: +20% coverage (60% total)

#### 2.1 Form Validation Tests (2 hours)
**File:** `src/components/__tests__/LeadModal.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadModal } from '../LeadModal';

describe('LeadModal', () => {
  it('should validate required fields', async () => {
    const mockOnSubmit = vi.fn();
    render(
      <LeadModal
        open={true}
        onClose={vi.fn()}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await userEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should validate email format', async () => {
    render(
      <LeadModal
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText(/joao@empresa.com/);
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab(); // Blur to trigger validation

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockOnSubmit = vi.fn();
    render(
      <LeadModal
        open={true}
        onClose={vi.fn()}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Fill form
    await userEvent.type(
      screen.getByPlaceholderText('João Silva'),
      'João da Silva'
    );
    await userEvent.type(
      screen.getByPlaceholderText('Imobiliária XYZ'),
      'Imob Test'
    );
    // ... fill other fields

    // Submit
    const submitButton = screen.getByRole('button', { name: /cadastrar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'João da Silva',
          empresa: 'Imob Test',
        })
      );
    });
  });
});
```

---

#### 2.2 Component Rendering Tests (1 hour)
**File:** `src/components/__tests__/KanbanCard.test.tsx`

```typescript
describe('KanbanCard', () => {
  it('should render card with lead information', () => {
    const mockCard = {
      id: '1',
      lead_id: 'lead-1',
      etapa: 'REUNIAO_REALIZADA' as const,
      data_entrada_etapa: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      leads: {
        id: 'lead-1',
        nome: 'João Silva',
        empresa: 'Imob XYZ',
        email: 'joao@test.com',
        tipo_cliente: 'IMOBILIARIA' as const,
        criado_em: new Date().toISOString(),
      },
    };

    render(<KanbanCard card={mockCard} />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Imob XYZ')).toBeInTheDocument();
  });

  it('should display days in stage', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockCard = {
      id: '1',
      lead_id: 'lead-1',
      etapa: 'REUNIAO_REALIZADA' as const,
      data_entrada_etapa: thirtyDaysAgo.toISOString(),
      criado_em: new Date().toISOString(),
      leads: { /* ... */ },
    };

    render(<KanbanCard card={mockCard} />);

    expect(screen.getByText('30d')).toBeInTheDocument();
  });
});
```

---

#### 2.3 Integration Tests (1 hour)
**File:** `src/pages/__tests__/LeadsPage.test.tsx`

Test the full page:
- Renders leads table
- Can open modal
- Can submit form
- Shows loading state
- Shows empty state

---

### Phase 3: Edge Cases & Error Handling (Week 3) — 3-4 hours
Target: 70% coverage

#### 3.1 Error Handling Tests

```typescript
describe('Error Scenarios', () => {
  it('should handle network timeout gracefully', async () => {
    // Mock timeout scenario
  });

  it('should retry failed requests', async () => {
    // Test React Query retry logic
  });

  it('should display user-friendly error messages', async () => {
    // Verify error UI
  });
});
```

#### 3.2 Performance Tests

```typescript
describe('Performance', () => {
  it('should not re-render unnecessarily', () => {
    // Use renderSpy to track re-renders
  });

  it('should memoize heavy computations', () => {
    // Verify useMemo usage
  });
});
```

---

## TEST SETUP CONFIGURATION

### Update `src/test/setup.ts`

```typescript
import "@testing-library/jest-dom";
import { QueryClient } from "@tanstack/react-query";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock Supabase globally
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Create reusable Query Client for tests
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
```

---

## TEST COVERAGE TARGETS BY MODULE

| Module | Current | Target | Gap | Effort |
|--------|---------|--------|-----|--------|
| `useLeads` | 0% | 85% | 85% | 2h |
| `useCards` | 0% | 85% | 85% | 2h |
| `useFunnelData` | 0% | 80% | 80% | 1.5h |
| `LeadModal` | 0% | 90% | 90% | 2h |
| `KanbanCard` | 0% | 75% | 75% | 1.5h |
| `LeadsPage` | 0% | 70% | 70% | 1.5h |
| `KanbanPage` | 0% | 60% | 60% | 1.5h |
| **TOTAL** | **0%** | **70%** | **70%** | **~13h** |

---

## CRITICAL TEST CHECKLIST

Before marking as "PASS", verify:

- [ ] All useLeads tests pass
- [ ] All useCards tests pass
- [ ] LeadModal form validation tests pass
- [ ] KanbanCard rendering tests pass
- [ ] LeadsPage displays leads correctly
- [ ] Error handling tests pass
- [ ] No `any` types in test files
- [ ] All mocks properly cleaned up
- [ ] Coverage report shows >= 60%

---

## RUNNING TESTS

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/hooks/__tests__/useLeads.test.ts

# Update snapshots (if using)
npm test -- -u
```

---

## QA LOOP INTEGRATION

When tests reveal issues:

1. **Dev fixes issue** → Commits code
2. **CI runs tests** → Green light
3. **QA validates** → Marks story as testing-complete

**Max iterations:** 5 (escalate if exceeded)

---

## ACCESSIBILITY TESTING

**Note:** Beyond unit tests, accessibility requires manual and automated testing.

### Browser Testing Checklist
- [ ] Tab through page (keyboard only)
- [ ] Screen reader (NVDA/JAWS) walkthrough
- [ ] Color contrast validation
- [ ] ARIA labels present

### Automated Tools
```bash
# Add axe accessibility testing
npm install --save-dev @axe-core/react
```

Example:
```typescript
import { axe } from 'jest-axe';

it('should not have accessibility violations', async () => {
  const { container } = render(<LeadModal {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## PERFORMANCE TESTING

```typescript
it('should load and render within acceptable time', async () => {
  const startTime = performance.now();
  render(<KanbanPage />);
  await waitFor(() => {
    expect(screen.getByText(/Pipeline/)).toBeInTheDocument();
  });
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(2500); // 2.5 seconds
});
```

---

**Next Steps:**
1. Create `src/hooks/__tests__/` directory
2. Implement useLeads tests (copy template above)
3. Run: `npm test`
4. Fix any setup issues
5. Proceed to Phase 2

**Prepared by Quinn (@qa) - Quality First**
