-- Migration: Add lead attachments table for document storage (PDFs, images, Word, Excel)
-- Purpose: Store file metadata for proposals and related documents attached to leads
-- Storage: Files stored in Supabase Storage bucket "lead-attachments"

CREATE TABLE IF NOT EXISTS public.lead_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  )),
  storage_path TEXT NOT NULL UNIQUE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_lead_attachments_lead_id ON public.lead_attachments(lead_id);
CREATE INDEX idx_lead_attachments_created_at ON public.lead_attachments(criado_em DESC);

-- Enforce max 5 files per lead constraint
CREATE OR REPLACE FUNCTION check_max_attachments_per_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.lead_attachments WHERE lead_id = NEW.lead_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 attachments allowed per lead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_attachments
  BEFORE INSERT ON public.lead_attachments
  FOR EACH ROW
  EXECUTE FUNCTION check_max_attachments_per_lead();

-- Enable RLS and set permissive policy (consistent with existing tables)
ALTER TABLE public.lead_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on lead_attachments" ON public.lead_attachments
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.lead_attachments IS 'Stores metadata for files attached to leads. Actual files stored in Supabase Storage bucket: lead-attachments';
