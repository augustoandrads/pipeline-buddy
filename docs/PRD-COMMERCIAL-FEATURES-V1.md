# PRD: Recursos Comerciais Avançados v1.0
**Pipeline Buddy CRM**

---

## 📋 Sumário Executivo

Este PRD define 3 features de alto impacto para Pipeline Buddy que endereçam gaps críticos em equipes comerciais:

1. **Pipeline Forecasting & Probabilidade de Fechamento** — Previsão de receita com acurácia
2. **Atribuição de Leads + Distribuição Automática** — Escalabilidade operacional
3. **Histórico de Negociação + Sistema de Notas** — Contexto compartilhado

**Estimativa de Impacto:**
- Revenue: +15-20% (via better prioritization)
- Time to Close: -30% (via better context)
- Team Scaling: 5x (distribuição automática)

**Timeline:** 10-12 semanas (3 devs) | 15-18 semanas (1 dev)
**MVP Scope:** Features 1 + 2 (8 semanas, 1 dev)

---

## 🎯 Objetivos de Negócio

| Objetivo | KPI | Target | Baseline |
|----------|-----|--------|----------|
| Previsibilidade de Revenue | MAPE% (Mean Absolute Percentage Error) | < 15% | N/A |
| Escalabilidade de Vendas | Leads/Vendedor | +100% com auto-distribuição | Manual 1-2h |
| Retenção de Contexto | % Handoff de sucesso | 90% | ~40% |
| Automação Operacional | Admin time % | -40% | 20% do tempo |

---

## 👥 Personas & Use Cases

### Persona 1: **Vendedor** (Dex)
- Objetivo: Saber quais leads priorizar e manter contexto
- Pain: "Que leads são quentes? Qual foi a última conversa?"
- Use Case:
  - Abrir Pipeline → Ver leads com HIGH PROBABILITY primeiro
  - Clicar em lead → Ver histórico completo + probabilidade
  - Receber notificação: "Novo lead atribuído a você"

### Persona 2: **Manager de Vendas** (Morgan)
- Objetivo: Distribuir leads, prever revenue, acompanhar negociações
- Pain: "Aloquei manual leads para 5 vendedores em 45min. Receita real foi -25% de previsão"
- Use Case:
  - Fazer upload CSV de leads + distribuir automático
  - Ver dashboard: "Receita Provável R$ 500k, Real R$ 380k (forecasting vs actual)"
  - Ver todas as notas privadas + estratégia por lead

### Persona 3: **Diretor Comercial** (Aria)
- Objetivo: Entender saúde do pipeline, prever mês
- Pain: "Tenho reunião com diretoria em 2h, qual é a receita do mês?"
- Use Case:
  - Abrir Dashboard em 2 segundos
  - Ver: Receita Provável + distribuição por vendedor + trend 3 meses

---

## 📦 Feature 1: Pipeline Forecasting & Probabilidade de Fechamento

### 1.1 Descrição

Cada lead no pipeline recebe um **score de probabilidade** (0-100%) que indica a chance de fechar. Score é calculado por:
- **Etapa atual** (base): REUNIAO=20%, PROPOSTA=40%, NEGOCIACAO=65%, CONTRATO=85%, VENDA_FECHADA=100%
- **Tempo na etapa** (ajuste): -2% por cada 10 dias na etapa (máx -30%)
- **Histórico de movimento** (ajuste): Leads que se movem rápido +10%
- **Origem** (ajuste): Referência +20%, Web -5%
- **Tamanho do deal**: >R$ 100k +5%, <R$ 20k -5%

**Fórmula:**
```
probabilidade = base_etapa + ajuste_tempo + ajuste_historico + ajuste_origem + ajuste_tamanho
probabilidade = CLAMP(probabilidade, 0, 100)
```

### 1.2 Dashboard Executivo (Nova Página)

**URL:** `/forecasting`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Pipeline Forecasting Dashboard                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 KPIs (4 cards):                                          │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │Rec Real  │Rec Prov  │ Accuracy │ Prob Avg │             │
│  │R$ 380k   │R$ 500k   │ 87%      │ 62%      │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                              │
│  📈 Gráfico: Real vs Provável (últimos 6 meses)             │
│     (Line chart: receita_real vs receita_provavel)         │
│                                                              │
│  🔔 Alertas:                                                 │
│    • 5 leads em PROPOSTA há 30+ dias (enviar follow-up)    │
│    • Funil 20% mais lento que mês passado                   │
│    • TOP 3 leads com HIGH probability este mês              │
│                                                              │
│  📋 Tabela: Leads por Probabilidade                          │
│    [Filtro: HIGH(60-100), MED(40-60), LOW(0-40)]           │
│    Colunas: Lead | Etapa | Dias na Etapa | Prob | Valor    │
│                                                              │
│  📊 Gráfico: Distribuição por Probabilidade (histogram)      │
│                                                              │
│  📊 Gráfico: Receita Prevista por Mês (forecast 3 meses)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Mudanças no Kanban

**Card agora mostra:**
```
┌──────────────────────┐
│ Lead Name            │
│ Company              │
│ R$ 150k              │
│ 📊 72% probability   │ ← NOVO: cor verde/amarelo/vermelho
│ ⏱️ 15 dias na etapa  │ ← NOVO
└──────────────────────┘
```

**Cores por probabilidade:**
- 🟢 GREEN: 70-100% (alta confiança)
- 🟡 YELLOW: 40-69% (médio)
- 🔴 RED: 0-39% (risco)

### 1.4 Banco de Dados

**Nova Tabela: `forecasting_history`**
```sql
CREATE TABLE forecasting_history (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL FKEY cards(id) CASCADE,
  data_snapshot DATE NOT NULL,
  probabilidade NUMERIC(5,2),
  valor_provavel NUMERIC(12,2),
  receita_real NUMERIC(12,2), -- preenchido quando etapa=VENDA_FECHADA
  criado_em TIMESTAMP WITH TZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_forecasting_snapshot ON forecasting_history(card_id, data_snapshot);
```

**Nova Coluna: `cards` table**
```sql
ALTER TABLE cards ADD COLUMN probabilidade NUMERIC(5,2) DEFAULT 0;
ALTER TABLE cards ADD COLUMN probabilidade_updated_at TIMESTAMP WITH TZ;
```

**Stored Procedure: `calculate_probability(card_id)`**
```sql
-- Implementar lógica de probabilidade
-- Inputs: card_id
-- Outputs: probabilidade (0-100)
-- Trigger: Executar toda vez que card.etapa muda ou data_entrada_etapa > 10 dias
```

### 1.5 Cálculos & Triggers

**Trigger 1: Após mover lead (card)**
```
AFTER UPDATE cards SET etapa
EXECUTE calculate_probability(card_id)
EXECUTE upsert INTO forecasting_history(card_id, data_snapshot, probabilidade, valor_provavel)
```

**Trigger 2: Nightly Job (02:00 UTC)**
```
Para cada card em ['REUNIAO', 'PROPOSTA', 'NEGOCIACAO', 'CONTRATO']:
  IF dias_na_etapa > 10 E (último cálculo > 24h atrás):
    calculate_probability(card_id)
    upsert forecasting_history
```

**Trigger 3: Ao fechar venda**
```
AFTER UPDATE cards SET etapa='VENDA_FECHADA'
UPDATE forecasting_history SET receita_real=leads.valor_estimado_contrato
  WHERE card_id=cards.id AND data_snapshot=(última entrada)
-- Isso permite calcular MAPE e accuracy
```

### 1.6 Relatórios

**Relatório: Forecasting Accuracy (Novo)**
- Tabela: Todas as vendas fechadas nos últimos 6 meses
- Colunas: Lead | Data | Prob Final | Valor Real | Acurado?
- Métrica: MAPE = AVG(ABS(prob_final - 1.0)) [para leads fechados]
- Target: < 15% MAPE

**Relatório: Pipeline Velocity**
- Tabela: Leads por etapa + dias na etapa
- Gráfico: Tempo médio por etapa (histograma)
- Alerta: Se etapa X mais lento que -20% historical

### 1.7 Aceitação de Critérios

1. ✅ Cada lead mostra probabilidade em tempo real
2. ✅ Probabilidade recalcula quando lead muda de etapa
3. ✅ Dashboard de forecasting carrega em < 2s
4. ✅ Receita Provável (SUM de valor × probabilidade) diverge < 15% de Receita Real em 30 dias
5. ✅ Alertas disparam quando lead fica 30+ dias na etapa
6. ✅ Histórico permite auditoria (qual foi prob em data X?)
7. ✅ Mobile responsivo (gráficos redimensionam)

---

## 📦 Feature 2: Atribuição de Leads + Distribuição Automática

### 2.1 Descrição

Sistema para atribuir leads a vendedores com distribuição automática inteligente.

**Componentes:**
- Novo campo em `leads`: `vendedor_id` (FK para users)
- Nova página: "Atribuição de Leads" (admin/manager only)
- Modo manual: Selecionar leads + arrastar para vendedor
- Modo automático: Round-robin ou Smart (baseado em workload)
- Notificações: "Novo lead atribuído a você" (SMS/email/toast)
- Relatórios: Performance por vendedor (conversão, tempo médio, valor médio)

### 2.2 Página de Atribuição (Nova)

**URL:** `/leads/assignment`

**Permissões:** Manager+ (role_id >= MANAGER)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Atribuição de Leads                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🔄 Auto-Distribuir] [Modo: Round-Robin ▼] [Import CSV]   │
│                                                              │
│  VENDEDORES (Coluna esquerda):                              │
│  ┌─────────────────────────────────┐                        │
│  │ 1. João Silva                   │ 8 leads               │
│  │    Performance: 45% conversão   │                        │
│  │    Pipeline: R$ 320k            │                        │
│  │                                 │                        │
│  │ 2. Maria Santos                 │ 12 leads              │
│  │    Performance: 52% conversão   │                        │
│  │    Pipeline: R$ 480k            │                        │
│  │                                 │                        │
│  │ 3. Pedro Costa (NOVO)           │ 0 leads               │
│  │    Performance: N/A             │                        │
│  │    Pipeline: R$ 0k              │                        │
│  └─────────────────────────────────┘                        │
│                                                              │
│  LEADS NÃO ATRIBUÍDOS (Coluna direita):                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [ ] Acme Corp (50k)          [→ João ▼]               │ │
│  │ [ ] TechStart (150k)         [→ Maria ▼]              │ │
│  │ [ ] NewBuild Co (75k)        [→ Pedro ▼]              │ │
│  │ [ ] RealEstate Plus (200k)   [→ ? ▼]                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Cancelar] [Atribuir Selecionados] (2 selecionados)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Modos de Distribuição

#### Modo 1: Manual Drag-and-Drop
```
Usuário seleciona lead → Arrasta para coluna do vendedor
Sistema:
  UPDATE leads SET vendedor_id={vendedor_id}, atribuido_em=now()
  NOTIFY vendedor: "Novo lead: {lead_name} ({valor})"
```

#### Modo 2: Round-Robin Automático
```
Usuário clica [🔄 Auto-Distribuir]
Modal:
  "Distribuir X leads selecionados"
  [Modo: Round-Robin ▼]
  Descrição: "Distribui sequencialmente: Vendedor 1, 2, 3, 1, 2, ..."
  [Começar]

Sistema:
  For cada lead em leads_selecionados:
    vendedor_id = next_in_rotation(vendedores_ativos)
    UPDATE leads SET vendedor_id={...}, atribuido_em=now()
    NOTIFY vendedor

  Total: X leads distribuídos em {time}
  [Concluído ✓]
```

#### Modo 3: Smart Distribution
```
Algoritmo:
  For cada lead em leads_selecionados:
    score_vendedor = calc_score_para_atribuir()

    calc_score_para_atribuir():
      leads_count = COUNT leads WHERE vendedor_id=v
      conversion_rate = leads_fechados(v) / leads_totais(v)
      pipeline_value = SUM valor WHERE vendedor_id=v

      score = (100 - leads_count) * 0.5  // Menos leads = melhor
              + conversion_rate * 100 * 0.3  // Melhor closer = prioridade
              - (pipeline_value / 1000000) * 0.2  // Workload alto = penalizado

      RETURN score

    best_vendedor = MAX(score_vendedor para todos vendedores)
    atribuir lead para best_vendedor
```

### 2.4 Filtro "Meus Leads" no Kanban

**Novo filtro em LeadFilter.tsx:**
```
[👤 Meus Leads] [checkbox]

Quando ativado:
  cards = filter(cards, card => leads[card.lead_id].vendedor_id == current_user.id)
```

**Benefício:** Vendedor vê apenas seus leads no Kanban

### 2.5 Banco de Dados

**Novas Colunas: `leads` table**
```sql
ALTER TABLE leads ADD COLUMN vendedor_id UUID FKEY auth.users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN atribuido_em TIMESTAMP WITH TZ;

CREATE INDEX idx_leads_vendedor ON leads(vendedor_id, deleted_at);
CREATE INDEX idx_leads_atribuido ON leads(atribuido_em DESC);
```

**Nova Tabela: `assignment_history`** (auditoria)
```sql
CREATE TABLE assignment_history (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL FKEY leads(id) CASCADE,
  vendedor_anterior_id UUID FKEY auth.users(id),
  vendedor_novo_id UUID NOT NULL FKEY auth.users(id),
  motivo TEXT, -- 'auto_distribution', 'manual_reassign', 'manual_first_assign'
  atribuido_por UUID NOT NULL FKEY auth.users(id),
  criado_em TIMESTAMP WITH TZ DEFAULT now()
);

CREATE INDEX idx_assignment_history_lead ON assignment_history(lead_id);
CREATE INDEX idx_assignment_history_vendor ON assignment_history(vendedor_novo_id, criado_em DESC);
```

### 2.6 Notificações

**Sistema de Notificação:**
```
TRIGGER: AFTER INSERT/UPDATE leads SET vendedor_id
  CREATE notification (
    user_id = leads.vendedor_id,
    title = "Novo lead atribuído",
    message = "Leads.nome - R$ {valor}",
    lead_id = leads.id,
    type = 'NEW_LEAD_ASSIGNED'
  )

  SEND_ASYNC:
    - Toast no app (em tempo real se online)
    - Email (templated)
    - SMS (opcional, via Twilio)
```

**Nova Tabela: `notifications`**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL FKEY auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT, -- 'NEW_LEAD_ASSIGNED', 'LEAD_MOVED', etc
  lead_id UUID FKEY leads(id),
  lido BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, lido, criado_em DESC);
```

### 2.7 Relatórios por Vendedor

**Nova Página: `/relatorios/vendedores`**

**Cards por Vendedor:**
```
┌────────────────────────────────────┐
│ João Silva (8 leads)               │
│ ─────────────────────────────────  │
│ Taxa Conversão: 45%                │
│ Valor Médio: R$ 40k                │
│ Tempo Médio no Pipeline: 32 dias   │
│ Pipeline Total: R$ 320k            │
│ Vendas Fechadas (mês): R$ 72k      │
└────────────────────────────────────┘

[Gráfico: Leads por Etapa (para este vendedor)]
[Gráfico: Performance vs Média da Equipe]
```

### 2.8 Aceitação de Critérios

1. ✅ Leads podem ser atribuídos a vendedores (vendedor_id em leads)
2. ✅ Distribuição round-robin funciona sem erros
3. ✅ Distribuição smart aloca líderes de alta conversão melhor
4. ✅ Notificação enviada em < 5 segundos após atribuição
5. ✅ Filtro "Meus Leads" mostra apenas leads do vendedor logado
6. ✅ Histórico de atribuição é auditável
7. ✅ Relatórios por vendedor carregam em < 2s
8. ✅ Manager consegue reatribuir leads manualmente

---

## 📦 Feature 3: Histórico de Negociação + Sistema de Notas

### 3.1 Descrição

Sistema para registrar todas as interações com leads (notas, emails, calls, reuniões) em um histórico unificado acessível a toda equipe.

**Componentes:**
- Sidebar com timeline de eventos
- 3 tipos de notas: Pública, Privada, Interna
- Rich editor com markdown + @mentions
- Notificações quando mencionado
- Busca no histórico
- Exportação de histórico (PDF)

### 3.2 UI: Sidebar de Histórico (Lado Direito do Kanban)

**Existing:** LeadDetailsSidebar.tsx mostra dados do lead

**Nova Seção: Timeline de Eventos**

```
┌──────────────────────────────────────────────┐
│ 📋 HISTÓRICO DE {LEAD_NAME}                  │
├──────────────────────────────────────────────┤
│                                              │
│ 15/02 14:30 - João Silva                    │
│ 📝 Nota Pública:                             │
│ "Cliente quer mudar o escopo. Aguardando    │
│ documento atualizado"                        │
│                                              │
│ ── RESPOSTA: Maria Santos 15/02 16:45 ──    │
│ "Enviei o novo documento. Cliente pode     │
│ revisar até amanhã"                         │
│ [🔒 Privado] [3 curtidas]                   │
│                                              │
│ 14/02 10:00 - Sistema                       │
│ 🔄 Moved to: EM_NEGOCIACAO (from PROPOSTA)  │
│                                              │
│ 13/02 15:30 - João Silva                    │
│ 📞 Chamada Realizada (12 min)                │
│ 📝 Nota Privada:                             │
│ "Cliente preocupado com preço. Pedi para   │
│ falar com gerente antes de finalizar"      │
│ [Para: Morgan, @devops]                     │
│                                              │
│ 12/02 09:00 - Sistema                       │
│ 📤 Proposta Enviada                          │
│ Documento: proposal_acme_v2.pdf             │
│                                              │
│ 11/02 14:00 - João Silva                    │
│ 📝 Nota Pública:                             │
│ "Reunião realizada. Cliente interessa...    │
│ [mais] [📎 anexo.pdf]                       │
│                                              │
│ ───────────────────────────────────────     │
│ [+ Adicionar Nota] [+ Adicionar Evento]     │
│                                              │
└──────────────────────────────────────────────┘
```

### 3.3 Modal de Adicionar Nota

**Triggers:**
- Clique em "+ Adicionar Nota" na sidebar
- Clique em "+📝" depois de mover lead (auto-popup)
- Comando: `@anotação {texto}` no kanban

**Modal:**
```
┌─────────────────────────────────────────────┐
│ Nova Anotação para: Acme Corp               │
├─────────────────────────────────────────────┤
│                                              │
│ Tipo: [Pública ▼]                           │
│   Opções:                                    │
│   • Pública (todos na equipe veem)           │
│   • Privada (só eu + manager)                │
│   • Interna (só manager)                     │
│                                              │
│ ┌───────────────────────────────────────┐   │
│ │ Escreva sua anotação (Markdown OK)    │   │
│ │                                       │   │
│ │ **Cliente pediu** desconto de 15%     │   │
│ │                                       │   │
│ │ Próximas ações:                       │   │
│ │ - [ ] Falar com gerente               │   │
│ │ - [ ] Enviar proposta revisada        │   │
│ │                                       │   │
│ │ Cc: @maria.santos @morgan             │   │
│ │                                       │   │
│ │ [📎 Anexar arquivo]                   │   │
│ │ [🔗 Anexar link]                      │   │
│ │ [🏷️ Tags] (ex: #desconto, #follow-up) │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ [Cancelar] [Salvar Anotação]                 │
│                                              │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Rich editor (markdown preview)
- @mentions com autocomplete (usuários)
- Tags (hashtags) para categorizar
- Anexos (files + URLs)
- Preview em tempo real

### 3.4 Banco de Dados

**Nova Tabela: `anotacoes`**
```sql
CREATE TABLE anotacoes (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL FKEY leads(id) CASCADE,
  autor_id UUID NOT NULL FKEY auth.users(id),
  tipo TEXT NOT NULL CHECK IN ('publica', 'privada', 'interna'),
  conteudo TEXT NOT NULL, -- Markdown
  conteudo_html TEXT, -- Renderizado para search
  criado_em TIMESTAMP WITH TZ DEFAULT now(),
  atualizado_em TIMESTAMP WITH TZ,
  deleted_at TIMESTAMP WITH TZ -- Soft delete
);

CREATE INDEX idx_anotacoes_lead ON anotacoes(lead_id, criado_em DESC);
CREATE INDEX idx_anotacoes_autor ON anotacoes(autor_id, criado_em DESC);
CREATE INDEX idx_anotacoes_tipo ON anotacoes(tipo);
```

**Nova Tabela: `anotacao_mentions`** (para @mentions)
```sql
CREATE TABLE anotacao_mentions (
  id UUID PRIMARY KEY,
  anotacao_id UUID NOT NULL FKEY anotacoes(id) CASCADE,
  usuario_mencionado_id UUID NOT NULL FKEY auth.users(id),
  criado_em TIMESTAMP WITH TZ DEFAULT now()
);

CREATE INDEX idx_mentions_usuario ON anotacao_mentions(usuario_mencionado_id, criado_em DESC);
```

**Nova Tabela: `anotacao_anexos`** (para attachments)
```sql
CREATE TABLE anotacao_anexos (
  id UUID PRIMARY KEY,
  anotacao_id UUID NOT NULL FKEY anotacoes(id) CASCADE,
  tipo TEXT CHECK IN ('file', 'link'), -- arquivo ou URL
  url TEXT NOT NULL, -- S3 URL ou link externo
  nome_arquivo TEXT,
  tamanho_bytes INTEGER, -- Se arquivo
  criado_em TIMESTAMP WITH TZ DEFAULT now()
);
```

**Nova Tabela: `anotacao_tags`** (para hashtags)
```sql
CREATE TABLE anotacao_tags (
  id UUID PRIMARY KEY,
  anotacao_id UUID NOT NULL FKEY anotacoes(id) CASCADE,
  tag TEXT NOT NULL, -- 'desconto', 'follow-up', etc
  criado_em TIMESTAMP WITH TZ DEFAULT now()
);

CREATE INDEX idx_tags_tag ON anotacao_tags(tag);
```

### 3.5 RLS Policies

**Para `anotacoes`:**
```sql
-- Pública: todos na equipe veem
-- Privada: só autor + manager (role_id >= MANAGER)
-- Interna: só manager (role_id >= MANAGER)

CREATE POLICY anotacoes_select_policy ON anotacoes
  FOR SELECT
  USING (
    (tipo = 'publica') OR
    (tipo = 'privada' AND (auth.uid() = autor_id OR get_user_role(auth.uid()) >= 'manager')) OR
    (tipo = 'interna' AND get_user_role(auth.uid()) >= 'manager')
  );

CREATE POLICY anotacoes_insert_policy ON anotacoes
  FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY anotacoes_delete_policy ON anotacoes
  FOR DELETE
  USING (auth.uid() = autor_id OR get_user_role(auth.uid()) >= 'manager');
```

### 3.6 Funcionalidades de Busca

**Busca no Histórico:**
```
[🔍 Buscar histórico] [Input: "cliente pediu desconto"]
  ↓
  SELECT FROM anotacoes
  WHERE lead_id = current_lead_id
    AND conteudo_html ILIKE '%cliente%' OR '%desconto%'
    AND tipo IN (user_accessible_tipos)
  ORDER BY criado_em DESC
  LIMIT 20

  Resultados:
  ✓ [13/02] "Cliente pediu mudar o escopo..."
  ✓ [11/02] "Cliente interessado..."
```

**Tags para Filtrar:**
```
[#desconto] [#follow-up] [#urgente] [#bloqueado]
  ↓
  Filter anotacoes by selected tags
```

### 3.7 Notificações de Mentions

**Quando alguém menciona você (@seu_nome):**
```
TRIGGER: AFTER INSERT anotacoes WITH @mention
  FOR EACH mencionado_usuario_id:
    CREATE notification (
      user_id = usuario_mencionado_id,
      title = "{autor} mencionou você",
      message = "{lead_name}: {anotacao_preview}",
      anotacao_id = anotacoes.id
    )
    SEND notification (toast + email)
```

### 3.8 Exportação de Histórico

**Botão: "📥 Exportar Histórico"**

**Gera PDF com:**
- Cabeçalho: Lead name, empresa, período (últimos 30/60/90 dias)
- Timeline: Todas as anotações públicas + movimentações
- Excludo: Notas privadas/internas
- Footer: "Exportado em {data} por {usuario}"

**Formato PDF:**
```
PIPELINE BUDDY - HISTÓRICO DO LEAD
=====================================

Lead: Acme Corp
Empresa: Acme Industries
Período: 01/02 - 15/02/2025
Exportado por: João Silva

TIMELINE:
─────────────────────────────────

15/02 - 14:30 | NOTA PÚBLICA | João Silva
"Cliente quer mudar o escopo. Aguardando documento atualizado"

14/02 - 10:00 | MOVIMENTAÇÃO | Sistema
Lead movido de PROPOSTA para EM_NEGOCIACAO

13/02 - 15:30 | CHAMADA | João Silva
Duração: 12 minutos

12/02 - 09:00 | PROPOSTA | Sistema
Documento enviado: proposal_acme_v2.pdf

11/02 - 14:00 | NOTA PÚBLICA | João Silva
"Reunião realizada. Cliente muito interessado. Próximas ações..."

FIM DO RELATÓRIO
```

### 3.9 Aceitação de Critérios

1. ✅ Notas podem ser criadas e aparecem em timeline em tempo real
2. ✅ Tipos de notas (pública/privada/interna) com RLS correto
3. ✅ @mentions notificam usuários mencionados
4. ✅ Tags podem ser adicionadas e usadas para filtrar
5. ✅ Histórico completo é auditável (who/when/what)
6. ✅ Busca funciona em conteúdo de notas
7. ✅ Exportação PDF gera arquivo válido
8. ✅ Timestamps em timezone do usuário
9. ✅ Mobile: timeline scrollable, modal responsivo
10. ✅ Performance: timeline carrega em < 2s mesmo com 500+ notas

---

## 🏗️ Arquitetura Técnica

### 3.10 Componentes Novos (React)

**Frontend Components:**
```
components/
├── forecasting/
│   ├── ForecastingDashboard.tsx (nova página)
│   ├── ProbabilityCard.tsx
│   ├── ForecastingChart.tsx
│   ├── AlertsBanner.tsx
│   └── AccuracyReport.tsx
├── assignment/
│   ├── AssignmentPage.tsx (nova página)
│   ├── VendorColumn.tsx
│   ├── UnassignedLeadsPanel.tsx
│   ├── AutoDistributeModal.tsx
│   └── VendorPerformanceCard.tsx
├── notes/
│   ├── NotesSidebar.tsx
│   ├── NoteItem.tsx
│   ├── AddNoteModal.tsx
│   ├── NoteEditor.tsx (com markdown)
│   ├── MentionAutocomplete.tsx
│   └── NoteTimeline.tsx
```

**Hooks Novos:**
```
hooks/
├── useForecasting.ts (query + calculations)
├── useAssignment.ts (CRUD assignment)
├── useNotes.ts (CRUD notes)
└── useNotifications.ts (subscriptions)
```

### 3.11 Backend/Supabase

**Stored Procedures:**
```
sql/
├── calculate_probability.sql
├── auto_distribute_leads.sql
├── sync_forecasting_history.sql
└── search_anotacoes.sql
```

**Realtime Subscriptions:**
```
- cards (quando etapa muda → recalcular probabilidade)
- anotacoes (quando nova nota → atualizar timeline)
- notifications (quando mencionado → toast)
- assignment_history (audit log)
```

---

## 📊 Estimativas de Esforço

| Feature | Dev | Design | QA | Total |
|---------|-----|--------|-----|-------|
| **Feature 1: Forecasting** | 40h | 12h | 8h | 60h |
| **Feature 2: Assignment** | 36h | 10h | 8h | 54h |
| **Feature 3: Notes** | 32h | 8h | 6h | 46h |
| **Setup + Infrastructure** | 20h | — | — | 20h |
| **Testing + Launch** | — | — | 20h | 20h |
| **TOTAL** | **128h** | **30h** | **42h** | **200h** |

**Timeline:**
- **1 Dev:** 10-12 semanas
- **2 Devs:** 6-8 semanas (parallelizar Features 1 e 2)
- **3 Devs:** 4-5 semanas (parallelizar tudo)

---

## 🎯 Success Criteria (Go/No-Go)

### Pre-Launch Gates

| Gate | Criteria | Owner | Severity |
|------|----------|-------|----------|
| **Functionality** | Todas as AC atendidas | @qa | CRITICAL |
| **Performance** | Dashboards < 2s, queries < 500ms | @architect | HIGH |
| **Security** | RLS policies testadas, no SQL injection | @architect | CRITICAL |
| **Mobile** | 95% responsivo, 48px touch targets | @qa | HIGH |
| **Accessibility** | WCAG 2.1 AA (mínimo 85%) | @qa | HIGH |
| **Documentation** | API docs, user guide, troubleshooting | @pm | MEDIUM |

### Post-Launch KPIs (30 dias)

| KPI | Target | Measurement |
|-----|--------|-------------|
| Forecast Accuracy (MAPE) | < 15% | Histórico de vendas |
| Time to Close (avg) | -25% | Dias entre REUNIAO → VENDA_FECHADA |
| Lead Assignment Time | < 2min | Timer em assignment page |
| Notes per Lead (avg) | >= 3 | Query COUNT anotacoes |
| User Adoption | >= 80% | DAU / Total users |

---

## 🚀 Roadmap de Implementação

### Wave 1: Foundation (Semanas 1-2)
- [ ] Database schema + migrations
- [ ] Stored procedures base (calculate_probability)
- [ ] Auth + RLS policies

### Wave 2: Feature 1 + 2 (Semanas 3-6)
- [ ] Forecasting dashboard + Kanban integration
- [ ] Assignment page + auto-distribute
- [ ] Notifications infrastructure

### Wave 3: Feature 3 (Semanas 7-8)
- [ ] Notes system + RLS policies
- [ ] Timeline UI + exports
- [ ] Search + mentions

### Wave 4: Polish + Launch (Semanas 9-10)
- [ ] Mobile optimization
- [ ] Accessibility audit + fixes
- [ ] Performance optimization
- [ ] User testing + feedback loop

---

## 📋 Dependências & Riscos

### Dependências
1. ✅ Supabase PostgreSQL (já tem)
2. ✅ React + TypeScript (já tem)
3. ✅ RLS policies (requer setup)
4. ❓ Notification service (precisa build ou integração com SendGrid/Twilio)
5. ❓ Rich text editor (prosemirror ou slate)

### Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|--------|-----------|
| Probabilidade calc impreciso | MEDIUM | HIGH | Validate com dados históricos, ajustar factors |
| Performance em 10k+ leads | MEDIUM | HIGH | Index estratégio + incremental loading |
| Race conditions (múltiplos users) | LOW | HIGH | Use Supabase locks, transactions |
| RLS policy bugs | MEDIUM | CRITICAL | Comprehensive test coverage |

---

## 👥 Stakeholders & Sign-Off

- **Product Owner:** @po (Pax) — Valida feature scope
- **Architect:** @architect (Aria) — Aprova tech design
- **Dev Lead:** @dev (Dex) — Owner implementação
- **QA Lead:** @qa (Quinn) — Gate quality
- **DevOps:** @devops (Gage) — Deployment + monitoring

---

## 📝 Notas & Open Questions

- [ ] Integração com WhatsApp/SMS notificações (future feature 7)?
- [ ] Previsão por vendedor (não só agregada)?
- [ ] Export para Salesforce/integração CRM externo?
- [ ] Dashboard Diretor (C-suite view)?
- [ ] Mobile app nativo vs web?

---

**Document Version:** 1.0
**Date:** 2025-02-22
**Status:** DRAFT → Ready for @po validation
**Next:** Create epics → Assign to @sm for story creation
