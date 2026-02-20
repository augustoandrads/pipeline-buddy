# Pipeline-Buddy Database Schema Documentation

**Database:** Supabase PostgreSQL
**Schema:** public
**Last Updated:** 2026-02-20
**Current Version:** 1.0

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Detailed Table Definitions](#detailed-table-definitions)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Data Integrity Constraints](#data-integrity-constraints)
7. [Normalization Analysis](#normalization-analysis)
8. [Known Limitations](#known-limitations)

---

## Schema Overview

### Data Model Diagram

```
leads (Parent)
  ├─ id (UUID, PK)
  ├─ nome, email, telefone, empresa
  ├─ tipo_cliente (ENUM: IMOBILIARIA, CONSTRUTORA, CORRETOR)
  ├─ quantidade_imoveis, valor_estimado_contrato
  ├─ origem, observacoes
  └─ criado_em (TIMESTAMP WITH TZ)
       │
       └─→ cards (1:N - one lead has many cards)
             ├─ id (UUID, PK)
             ├─ lead_id (FK → leads.id, CASCADE DELETE)
             ├─ etapa (ENUM: REUNIAO_REALIZADA, PROPOSTA_ENVIADA, EM_NEGOCIACAO, CONTRATO_GERADO, VENDA_FECHADA)
             ├─ data_entrada_etapa (TIMESTAMP WITH TZ)
             ├─ criado_em (TIMESTAMP WITH TZ)
             │
             └─→ movimentacoes (1:N - one card has many movements)
                   ├─ id (UUID, PK)
                   ├─ card_id (FK → cards.id, CASCADE Delete)
                   ├─ etapa_anterior (TEXT)
                   ├─ etapa_nova (TEXT)
                   └─ criado_em (TIMESTAMP WITH TZ)
```

### Tables Summary

| Table | Rows (Est.) | Purpose | Complexity |
|-------|-------------|---------|-----------|
| `leads` | Growth: O(n) | CRM lead master data | Medium |
| `cards` | Growth: O(n) | Pipeline stage tracking (1 card per lead initially) | High |
| `movimentacoes` | Growth: O(n*m) | Audit log of stage transitions | Medium |

---

## Detailed Table Definitions

### 1. Table: `public.leads`

**Purpose:** Master table for lead/prospect information in the sales pipeline.

**DDL:**
```sql
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT NOT NULL,
  tipo_cliente TEXT NOT NULL CHECK (tipo_cliente IN ('IMOBILIARIA', 'CONSTRUTORA', 'CORRETOR')),
  quantidade_imoveis INTEGER,
  valor_estimado_contrato NUMERIC(12,2),
  origem TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Column Definitions:**

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier, auto-generated |
| `nome` | TEXT | NO | — | NOT NULL | Lead contact name, required |
| `email` | TEXT | YES | NULL | — | Contact email, no uniqueness constraint |
| `telefone` | TEXT | YES | NULL | — | Contact phone, no format validation |
| `empresa` | TEXT | NO | — | NOT NULL | Company name, required |
| `tipo_cliente` | TEXT | NO | — | CHECK IN ('IMOBILIARIA', 'CONSTRUTORA', 'CORRETOR') | Client type enumeration, no ENUM type used |
| `quantidade_imoveis` | INTEGER | YES | NULL | — | Count of properties, no range validation |
| `valor_estimado_contrato` | NUMERIC(12,2) | YES | NULL | — | Contract value in BRL, 12 digits, 2 decimal places |
| `origem` | TEXT | YES | NULL | — | Lead source/origin, free text |
| `observacoes` | TEXT | YES | NULL | — | Free-form observations, max 2GB |
| `criado_em` | TIMESTAMP WITH TIME ZONE | NO | now() | NOT NULL | Creation timestamp, UTC |

**Key Observations:**
- No unique constraint on `email` (allows duplicates)
- No unique constraint on (`nome`, `empresa`) pair
- `tipo_cliente` uses TEXT with CHECK, not native PostgreSQL ENUM type
- No validation on email format or phone number
- `valor_estimado_contrato` scale allows reasonable BRL values (up to 99,999,999.99)
- Timestamps use UTC, good for multi-region systems

---

### 2. Table: `public.cards`

**Purpose:** Represents leads in the sales pipeline, tracking their progression through stages.

**DDL:**
```sql
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL DEFAULT 'REUNIAO_REALIZADA' CHECK (etapa IN ('REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO', 'CONTRATO_GERADO', 'VENDA_FECHADA')),
  data_entrada_etapa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Column Definitions:**

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique card identifier |
| `lead_id` | UUID | NO | — | FK → leads(id) ON DELETE CASCADE | Foreign key, cascade delete when lead deleted |
| `etapa` | TEXT | NO | 'REUNIAO_REALIZADA' | CHECK IN (5 valid values) | Current pipeline stage, uses TEXT not ENUM |
| `data_entrada_etapa` | TIMESTAMP WITH TIME ZONE | NO | now() | NOT NULL | Timestamp of last stage transition |
| `criado_em` | TIMESTAMP WITH TIME ZONE | NO | now() | NOT NULL | Card creation timestamp |

**Key Observations:**
- No composite unique constraint `UNIQUE(lead_id)` to enforce 1:1 relationship
- Application allows multiple cards per lead (design issue)
- `etapa` default = 'REUNIAO_REALIZADA' (always true for new cards)
- No check constraint to ensure `data_entrada_etapa` <= `criado_em` (logically impossible scenario is possible)
- Timestamps default to `now()`, good for audit trail

---

### 3. Table: `public.movimentacoes`

**Purpose:** Audit log of pipeline stage transitions, recording movement history.

**DDL:**
```sql
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  etapa_anterior TEXT NOT NULL,
  etapa_nova TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Column Definitions:**

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | UUID | NO | gen_random_uuid() | PRIMARY KEY | Unique movement identifier |
| `card_id` | UUID | NO | — | FK → cards(id) ON DELETE CASCADE | Reference to card, cascade delete |
| `etapa_anterior` | TEXT | NO | — | NOT NULL | Previous stage, free text (no validation) |
| `etapa_nova` | TEXT | NO | — | NOT NULL | New stage, free text (no validation) |
| `criado_em` | TIMESTAMP WITH TIME ZONE | NO | now() | NOT NULL | Movement timestamp |

**Key Observations:**
- No CHECK constraint on `etapa_anterior` or `etapa_nova` (allows invalid values)
- No validation that values are from the 5 valid etapas
- No constraint to ensure `etapa_anterior != etapa_nova`
- No constraint to prevent duplicate transitions (same card to same stage twice)
- Orphaned movements possible if card deleted but movimentacoes created concurrently
- Good for audit trail, but lacks integrity constraints

---

## Relationships

### Foreign Key Relationships

```
leads (1)
  ├─ ✓ cards (N) — ON DELETE CASCADE
  │       └─ ✓ movimentacoes (N) — ON DELETE CASCADE
```

**Analysis:**
- **Referential Integrity:** CASCADE delete ensures no orphaned records when parent deleted
- **Direction:** Cascade goes downward (leads → cards → movimentacoes)
- **Data Loss:** Deleting a lead will delete ALL associated cards and movements (design consideration)
- **Recovery:** No soft delete mechanism; deletions are permanent

### Lead-Card Relationship (1:N)

**Expected:** One lead = one card (master-detail)
**Current Schema:** Allows N:N (multiple cards per lead)
**Application Logic:** Creates initial card on lead creation, but schema doesn't enforce 1:1

---

## Indexes

### Current Indexes

```sql
-- Implicit indexes (from constraints)
idx_leads_pkey          → leads.id (PRIMARY KEY)
idx_cards_pkey          → cards.id (PRIMARY KEY)
idx_movimentacoes_pkey  → movimentacoes.id (PRIMARY KEY)
idx_cards_lead_id_fkey  → cards.lead_id (FOREIGN KEY, auto-indexed)
idx_movimentacoes_card_id_fkey → movimentacoes.card_id (FOREIGN KEY, auto-indexed)
```

**Missing Indexes (Performance Concerns):**

| Table | Column(s) | Query Pattern | Impact | Recommendation |
|-------|-----------|---------------|--------|-----------------|
| `cards` | `etapa` | Filter by stage (pivot on kanban board) | Medium | **CREATE INDEX** — Used in WHERE clause to group cards by column |
| `cards` | `data_entrada_etapa` | Order by entry date (sorting board) | Medium | **CREATE INDEX** — Frequently used in ORDER BY |
| `movimentacoes` | `criado_em` | Audit log timeline queries | Low | **CREATE INDEX** — Historical analysis queries |
| `leads` | `tipo_cliente` | Filter by client type | Low | **CREATE INDEX** — Reporting queries |
| `leads` | `criado_em` | Time-based queries (reports) | Low | **CREATE INDEX** — Reports, analytics |

### Recommended Index DDL

```sql
-- Kanban board performance
CREATE INDEX idx_cards_etapa ON public.cards(etapa);
CREATE INDEX idx_cards_data_entrada_etapa ON public.cards(data_entrada_etapa DESC);

-- Composite index for common query pattern
CREATE INDEX idx_cards_lead_etapa ON public.cards(lead_id, etapa);

-- Audit log queries
CREATE INDEX idx_movimentacoes_criado_em ON public.movimentacoes(criado_em DESC);
CREATE INDEX idx_movimentacoes_card_etapa ON public.movimentacoes(card_id, etapa_nova);

-- Reporting queries
CREATE INDEX idx_leads_tipo_cliente ON public.leads(tipo_cliente);
CREATE INDEX idx_leads_criado_em ON public.leads(criado_em DESC);
```

---

## Row Level Security (RLS)

### Current RLS Configuration

```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on movimentacoes" ON public.movimentacoes FOR ALL USING (true) WITH CHECK (true);
```

### Security Assessment

| Policy | Severity | Issue | Implication |
|--------|----------|-------|------------|
| `Allow all on *` | **CRITICAL** | `USING (true)` — Allows ALL users to SELECT all rows | No data isolation; any authenticated user sees all leads |
| `Allow all on *` | **CRITICAL** | `WITH CHECK (true)` — Allows ALL users to INSERT/UPDATE/DELETE | No write protection; any user can modify any data |
| RLS Enabled | MEDIUM | Requires authenticated session via supabase-js | Unauthenticated users blocked by Supabase core, but internal users unrestricted |

### Intended Design

According to migration comment: "single-user system, we'll use permissive policies for now"

**Interpretation:** System currently assumes single authenticated user (internal tool), with plans to implement proper RLS later.

### RLS Risks

1. **Internal Tool Only:** If exposed publicly or multi-user → **DATA BREACH**
2. **No Audit Trail:** RLS policies don't log who changed what (use triggers instead)
3. **No Temporal Security:** Cannot restrict access by time (e.g., future-dated actions)

### Recommended RLS Strategy (Future)

```sql
-- Example: Multi-user system with role-based access
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'viewer');

-- Add user tracking columns
ALTER TABLE public.leads
  ADD COLUMN assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Restrictive policy: Users see only assigned leads
CREATE POLICY "Users can view assigned leads" ON public.leads
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- Restrictive policy: Users can only modify their own leads
CREATE POLICY "Users can update assigned leads" ON public.leads
  FOR UPDATE
  USING (assigned_to = auth.uid() OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin')
  WITH CHECK (assigned_to = auth.uid() OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');
```

---

## Data Integrity Constraints

### Primary Keys
✓ All tables have UUID primary keys
✓ Good for distributed systems, prevents collisions

### Foreign Keys
✓ `cards.lead_id` → `leads.id` (CASCADE DELETE)
✓ `movimentacoes.card_id` → `cards.id` (CASCADE DELETE)

### Check Constraints

| Table | Column | Constraint | Coverage |
|-------|--------|-----------|----------|
| `leads` | `tipo_cliente` | IN ('IMOBILIARIA', 'CONSTRUTORA', 'CORRETOR') | ✓ Valid values enforced |
| `cards` | `etapa` | IN (5 valid stages) | ✓ Valid values enforced |
| `movimentacoes` | (none) | — | ✗ No validation on etapa_anterior/etapa_nova |

### Uniqueness Constraints
✗ No UNIQUE constraint on `leads.email` (allows duplicates)
✗ No UNIQUE constraint on (`leads.nome`, `leads.empresa`)
✗ No UNIQUE constraint on `cards.lead_id` (allows multiple cards per lead)
✗ No UNIQUE constraint on (`movimentacoes.card_id`, `movimentacoes.etapa_nova`, `movimentacoes.criado_em`)

### Missing Validations

| Field | Issue | Risk | Recommendation |
|-------|-------|------|-----------------|
| `leads.email` | No format validation | Invalid emails in DB | Add CHECK: `email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z\|a-z]{2,}$'` or validate in app |
| `leads.telefone` | No format validation | Inconsistent formatting | Document expected format or use CHECK pattern |
| `leads.quantidade_imoveis` | No range check | Negative values allowed | Add CHECK: `quantidade_imoveis > 0` |
| `leads.valor_estimado_contrato` | No range check | Negative values allowed | Add CHECK: `valor_estimado_contrato > 0` |
| `cards.data_entrada_etapa` | No temporal check | Can be in future or before created | Add CHECK: `data_entrada_etapa <= now()` |
| `movimentacoes.etapa_anterior` | No validation | Invalid stage names | Add CHECK: same as cards.etapa |
| `movimentacoes.etapa_nova` | No validation | Invalid stage names | Add CHECK: same as cards.etapa |

---

## Normalization Analysis

### Current Normalization Level: **3NF** ✓

**First Normal Form (1NF):**
- All values are atomic (no arrays, JSON, or repeating groups in base tables)
- All columns contain only single values per cell
- ✓ SATISFIED

**Second Normal Form (2NF):**
- All non-key columns depend on the entire primary key (all tables have single-column PKs)
- No partial dependencies
- ✓ SATISFIED

**Third Normal Form (3NF):**
- No non-key columns depend on other non-key columns
- No transitive dependencies observed
- ✓ SATISFIED

**BCNF (Boyce-Codd Normal Form):**
- Every determinant is a candidate key
- Not explicitly applicable here
- ✓ SATISFIED (no composite foreign keys)

### Data Redundancy Issues

**Issue 1: Stage Denormalization in `movimentacoes`**

Current:
```sql
INSERT INTO movimentacoes (card_id, etapa_anterior, etapa_nova, criado_em)
VALUES ('card-123', 'REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', now());
```

Problem: `etapa_anterior` is **denormalized** — it should be derived from prior `movimentacoes` record
Risk: **Data inconsistency** if `etapa_anterior` doesn't match card's previous state

Recommendation:
```sql
-- Denormalize for audit only if:
-- 1. Add CHECK constraint to validate etapa_anterior matches previous record
-- 2. Add trigger to auto-populate from application to ensure consistency
-- 3. Or: Store only etapa_nova + derive etapa_anterior from history
```

**Issue 2: Card-Lead Relationship Clarity**

Current: Multiple cards per lead allowed (violates 1:N intent)
Best Practice: Add UNIQUE constraint:
```sql
ALTER TABLE public.cards
  ADD CONSTRAINT unique_lead_per_card UNIQUE (lead_id);
```

---

## Known Limitations

### 1. **No Type Safety for Enumerations**

**Problem:** `tipo_cliente` and `etapa` stored as TEXT, not PostgreSQL ENUM type

**Consequences:**
- No compile-time checking
- Easier to insert invalid values (requires CHECK constraint)
- Migration complexity if values change
- Client app must maintain string constants

**Solution:**
```sql
CREATE TYPE tipo_cliente_enum AS ENUM ('IMOBILIARIA', 'CONSTRUTORA', 'CORRETOR');
CREATE TYPE etapa_enum AS ENUM ('REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO', 'CONTRATO_GERADO', 'VENDA_FECHADA');

-- Then update column types (careful with existing data)
ALTER TABLE public.leads ALTER COLUMN tipo_cliente TYPE tipo_cliente_enum USING tipo_cliente::tipo_cliente_enum;
ALTER TABLE public.cards ALTER COLUMN etapa TYPE etapa_enum USING etapa::etapa_enum;
```

### 2. **No User/Attribution Tracking**

**Problem:** No columns tracking who created/modified records

**Missing Columns:**
```sql
ALTER TABLE public.leads
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger to auto-update updated_at
```

### 3. **No Soft Deletes**

**Problem:** Deleted records are permanently lost, cannot recover history

**Impact:** Reports using historical data will not include deleted records

**Solution:**
```sql
ALTER TABLE public.leads ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS to exclude soft-deleted records by default
```

### 4. **Race Condition in Lead + Card Creation**

**Current Flow:**
```javascript
// LeadsPage.tsx lines 45-58
1. Insert lead
2. If error, throw
3. Insert card referencing lead.id
4. If error, throw
```

**Risk:** If card insert fails, lead created but orphaned (no card)
**Solution:** Wrap in database transaction or use trigger:

```sql
CREATE FUNCTION create_lead_with_card(
  p_nome TEXT, p_email TEXT, ..., p_tipo_cliente TEXT
) RETURNS TABLE AS $$
BEGIN
  INSERT INTO leads (...) VALUES (...) RETURNING *;
  INSERT INTO cards (lead_id, etapa) VALUES (?, 'REUNIAO_REALIZADA');
  COMMIT;
END;
$$ LANGUAGE plpgsql;
```

### 5. **No Cascade Audit Log on Delete**

**Problem:** Deleting a lead cascades to cards → movimentacoes, losing audit history

**Impact:** Cannot answer: "When did we delete this lead and why?"

**Solution:** Add soft delete + archive table:
```sql
CREATE TABLE leads_archive AS TABLE leads WITH NO DATA;

CREATE TRIGGER soft_delete_lead
BEFORE DELETE ON leads
FOR EACH ROW
BEGIN
  INSERT INTO leads_archive SELECT OLD.*;
  UPDATE leads SET deleted_at = now() WHERE id = OLD.id;
  DELETE FROM cards WHERE lead_id = OLD.id; -- or soft delete cards too
END;
```

### 6. **No Partition Strategy for Growth**

**Problem:** As `movimentacoes` table grows, queries will slow down

**Growth Pattern:** O(n*m) where n = leads, m = avg transitions per lead
**Concern:** Historical queries on 10+ year dataset with millions of rows

**Solution (Future):**
```sql
-- Partition by year
CREATE TABLE movimentacoes_2026 PARTITION OF movimentacoes
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Enables INCLUDE indexes on recent data
```

---

## Recommendations Summary

### Immediate (Before Production Use)

1. **Add RLS restrictions** if multi-user system
2. **Add NOT NULL constraints** where needed (email, telefone should be conditional)
3. **Add CHECK constraints** for numeric fields (quantidade_imoveis > 0, valor > 0)
4. **Add UNIQUE constraint** on cards.lead_id (enforce 1:1)
5. **Add indexes** on commonly filtered columns (etapa, tipo_cliente, criado_em)

### Short-term (Sprint 1-2)

6. **Convert to PostgreSQL ENUM types** for tipo_cliente and etapa
7. **Add audit columns** (created_by, updated_by, updated_at)
8. **Implement soft deletes** with deleted_at column
9. **Add transaction wrapper** for lead + card creation
10. **Document data retention policy** (how long to keep movimentacoes records)

### Long-term (Future)

11. **Implement proper RLS** with role-based access
12. **Add partition strategy** for movimentacoes table growth
13. **Create materialized views** for reporting queries
14. **Implement archival strategy** for cold data

---

## Migration Checklist

- [x] Schema created and deployed to Supabase
- [x] Foreign keys established (CASCADE DELETE)
- [x] RLS enabled (permissive for now)
- [ ] Production indexes added
- [ ] Check constraints validated
- [ ] Audit columns added
- [ ] RLS policies refined for multi-user
- [ ] Partition strategy evaluated
