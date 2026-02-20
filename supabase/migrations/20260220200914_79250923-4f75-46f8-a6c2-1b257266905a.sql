
-- Create leads table
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

-- Create cards table
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL DEFAULT 'REUNIAO_REALIZADA' CHECK (etapa IN ('REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO', 'CONTRATO_GERADO', 'VENDA_FECHADA')),
  data_entrada_etapa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movimentacoes table
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  etapa_anterior TEXT NOT NULL,
  etapa_nova TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (single-user system, we'll use permissive policies for now)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

-- Open policies (single-user internal tool)
CREATE POLICY "Allow all on leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on movimentacoes" ON public.movimentacoes FOR ALL USING (true) WITH CHECK (true);
