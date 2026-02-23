# SPRINT 1 — Implementation Plan

**Sprint:** Sprint 1 (Semana 1-2)
**Total de Pontos:** 13 pontos
**User Stories:** 5
**Duração:** 2 semanas

---

## Sequência de Implementação Recomendada

A ordem abaixo otimiza:
1. **Dependências:** Stories sem bloqueadores primeiro
2. **Valor:** Features de maior impacto no início
3. **Aprendizado:** Funcionalidades relacionadas juntas

### **Fase 1: Fundação (Dias 1-3)**

#### 1️⃣ **US-01: Campo de Valor Estimado no Card do Lead** (3 pts)
**Por quê primeiro:** Bloqueador para todas as outras stories de valor
- **Tarefas:**
  - [ ] Schema: adicionar `estimatedValue: number | null` ao modelo Lead
  - [ ] Auditoria: criar `AuditLog` para histórico de alterações
  - [ ] Backend: endpoints `PATCH /leads/:id` com validação BRL
  - [ ] Frontend: campo input com validação (numéricos positivos apenas)
  - [ ] UI: exibir valor no card Kanban
  - [ ] Testes: unitários para validação, integração end-to-end

**Depends on:** Nenhum
**Unblocks:** US-02, US-03, US-04, US-05 (todas as outras)

---

### **Fase 2: Valor Agregado (Dias 4-6)**

#### 2️⃣ **US-02: Totalizador de Valor por Coluna** (2 pts)
**Por quê agora:** Depende de US-01 estar pronto
- **Tarefas:**
  - [ ] Frontend: componente `ColumnTotal` reutilizável
  - [ ] Lógica: agregação de valores por coluna no store
  - [ ] Evento: atualizar total ao mover card
  - [ ] Formatação: aplicar `Intl.NumberFormat` para BRL
  - [ ] UI: posicionar totais abaixo de títulos das colunas
  - [ ] Testes: validar cálculos com múltiplos leads

**Depends on:** US-01
**Unblocks:** US-03

---

#### 3️⃣ **US-03: Visão de Receita Potencial Total do Funil** (3 pts)
**Por quê agora:** Agrupa dados de US-01 e US-02
- **Tarefas:**
  - [ ] Backend: endpoint `GET /api/leads/revenue` com filtros de período
  - [ ] Frontend: componente `RevenueIndicator` (KPI)
  - [ ] Dashboard: adicionar indicador ao header do pipeline
  - [ ] Filtros: período (7, 30, 90 dias, customizado)
  - [ ] Segmentação: valor total vs. etapas avançadas
  - [ ] Exportação: CSV/JSON com dados de receita
  - [ ] Testes: validar agregações por período

**Depends on:** US-01, US-02
**Unblocks:** Nenhum (pode rodar em paralelo)

---

### **Fase 3: Proteção de Oportunidades (Dias 7-10)**

#### 4️⃣ **US-04: Indicador Visual de Inatividade** (3 pts)
**Por quê agora:** Depende da auditoria em US-01, complementa valor
- **Tarefas:**
  - [ ] Schema: adicionar `lastActivityAt: Date` ao Lead
  - [ ] Evento: atualizar `lastActivityAt` em cada ação
  - [ ] Config: criar admin panel para thresholds por etapa
  - [ ] Lógica: cálculo de dias sem movimentação
  - [ ] UI: indicador visual (borda/ícone) com tooltip
  - [ ] Frontend: sistema de cores (amarelo/vermelho)
  - [ ] Testes: validar cálculos de inatividade

**Depends on:** Auditoria (US-01)
**Unblocks:** US-05

---

#### 5️⃣ **US-05: Painel de Leads em Risco** (2 pts)
**Por quê último:** Depende de US-04 estar pronto
- **Tarefas:**
  - [ ] Rota: criar página `/dashboard/at-risk-leads`
  - [ ] Query: filtrar leads com inatividade > threshold
  - [ ] UI: tabela com leads em risco
  - [ ] Ordenação: por tempo parado, valor, etapa
  - [ ] Ações rápidas: follow-up, reassign, move stage
  - [ ] Contador: menu lateral com número de leads em risco
  - [ ] Testes: validar filtros e ações

**Depends on:** US-04
**Unblocks:** Nenhum

---

## Timeline Visual

```
Dia 1   Day 2   Day 3 | Dia 4   Day 5   Day 6 | Dia 7   Day 8  Day 9  Day10
[  US-01 (3 pts)  ] | [ US-02 (2 pts)] [ US-03 (3 pts) ] | [ US-04 (3 pts) ] [ US-05 (2 pts) ]
Fundação          |  Valor Agregado                    |    Proteção
```

---

## Paralelização Possível

**Podem rodar em paralelo (2 devs):**
- Dev 1: US-01 + US-02 + US-03 (value track)
- Dev 2: US-04 + US-05 (risk management track)
- ⚠️ Sincronizar em US-01 antes de Dev 2 começar

---

## Definition of Ready (Por Story)

Antes de `@dev` começar, certificar:

- [ ] Story está em `Ready` (validada por @po)
- [ ] AC (Acceptance Criteria) são claras e testáveis
- [ ] Schema/DB changes identificadas
- [ ] Dependências mapeadas
- [ ] Mockups/wireframes disponíveis (se UI)
- [ ] Thresholds/configs definidas

---

## Critérios de Sucesso Sprint 1

Sprint 1 é considerada **COMPLETA** quando:

✅ Todas 5 stories passam por QA Gate (PASS ou CONCERNS apenas)
✅ 100% dos leads mostram valor estimado (se criados durante sprint)
✅ Kanban exibe totais de valor por coluna
✅ Indicadores de inatividade funcionam
✅ Painel de leads em risco operacional
✅ Zero bugs críticos em produção

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|--------|-----------|
| Complexidade de auditoria (US-01) | Alta | Alto | Começar logo, usar library existente se houver |
| Performance com 100+ leads | Média | Alto | Otimizar queries, lazy load no kanban |
| Testes inadequados | Média | Médio | Cobertura mínima 80%, validar edge cases |

---

## Daily Standup Template

```
- O que fiz: [AC completadas]
- O que vou fazer: [próximas AC]
- Bloqueadores: [sim/não e qual]
```

---

## Entrega & Ambiente

- **Branch:** `feat/crm-sprint1-value-pipeline`
- **Ambiente:** Staging antes de prod
- **Deploy:** Ao final de Sprint 1, após QA Gate PASS
- **Release notes:** Preparar com todos os 5 features

---

## Próximos Passos

1. ✅ Stories criadas e documentadas
2. ⏭️ @po validar todas 5 stories (10-point checklist)
3. ⏭️ @dev começar por US-01 (Fundação)
4. ⏭️ @qa estar pronto para reviews diários
5. ⏭️ Sprint 2 planning para Épicos 3 e 4

**Status:** Pronto para desenvolvimento
**Approval:** Aguardando @po validação
