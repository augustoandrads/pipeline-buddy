-- Add PERDIDO stage to cards table constraint
-- Migration: Add lead_losses table for tracking lost leads with reasons

ALTER TABLE public.cards
DROP CONSTRAINT IF EXISTS cards_etapa_check,
ADD CONSTRAINT cards_etapa_check CHECK (etapa IN (
  'REUNIAO_REALIZADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO',
  'CONTRATO_GERADO', 'VENDA_FECHADA', 'PERDIDO'
));

-- Create lead_losses table to track when a lead is marked as lost with reason
CREATE TABLE IF NOT EXISTS public.lead_losses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('PRICE', 'COMPETITOR', 'NO_URGENCY', 'NO_RESPONSE', 'WRONG_PROFILE', 'OTHER')),
  other_details TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_lead_losses_lead_id ON public.lead_losses(lead_id);
CREATE INDEX idx_lead_losses_reason ON public.lead_losses(reason);
CREATE INDEX idx_lead_losses_criado_em ON public.lead_losses(criado_em DESC);

-- Enable RLS
ALTER TABLE public.lead_losses ENABLE ROW LEVEL SECURITY;

-- Add permissive policy (consistent with existing RLS)
CREATE POLICY "Allow all on lead_losses" ON public.lead_losses FOR ALL USING (true) WITH CHECK (true);
