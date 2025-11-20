-- Create AFEs (Authorization for Expenditure) table
CREATE TABLE public.afes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  afe_number TEXT NOT NULL,
  description TEXT,
  budget_amount NUMERIC NOT NULL,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  well_name TEXT,
  project_type TEXT,
  approval_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, afe_number)
);

-- Create UWIs (Unique Well Identifiers) table
CREATE TABLE public.uwis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uwi TEXT NOT NULL,
  well_name TEXT,
  operator TEXT,
  location TEXT,
  province TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'abandoned')),
  spud_date DATE,
  completion_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, uwi)
);

-- Create field tickets table
CREATE TABLE public.field_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_number TEXT NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  afe_id UUID REFERENCES public.afes(id) ON DELETE SET NULL,
  uwi_id UUID REFERENCES public.uwis(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  vendor_name TEXT NOT NULL,
  service_type TEXT,
  hours NUMERIC,
  rate NUMERIC,
  amount NUMERIC NOT NULL,
  equipment TEXT,
  personnel TEXT,
  location TEXT,
  gps_coordinates JSONB,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ticket_number)
);

-- Create invoice extraction results table
CREATE TABLE public.invoice_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  afe_number TEXT,
  afe_id UUID REFERENCES public.afes(id) ON DELETE SET NULL,
  uwi TEXT,
  uwi_id UUID REFERENCES public.uwis(id) ON DELETE SET NULL,
  field_ticket_refs TEXT[],
  po_number TEXT,
  service_period_start DATE,
  service_period_end DATE,
  line_items JSONB DEFAULT '[]',
  extracted_data JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  validation_results JSONB DEFAULT '{}',
  budget_status TEXT CHECK (budget_status IN ('within_budget', 'over_budget', 'afe_not_found', 'no_afe')),
  budget_remaining NUMERIC,
  validation_errors TEXT[],
  validation_warnings TEXT[],
  extracted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id)
);

-- Enable RLS
ALTER TABLE public.afes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uwis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_extractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AFEs
CREATE POLICY "Users can view own AFEs"
  ON public.afes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AFEs"
  ON public.afes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AFEs"
  ON public.afes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AFEs"
  ON public.afes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for UWIs
CREATE POLICY "Users can view own UWIs"
  ON public.uwis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own UWIs"
  ON public.uwis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own UWIs"
  ON public.uwis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own UWIs"
  ON public.uwis FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Field Tickets
CREATE POLICY "Users can view own field tickets"
  ON public.field_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own field tickets"
  ON public.field_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own field tickets"
  ON public.field_tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own field tickets"
  ON public.field_tickets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Invoice Extractions
CREATE POLICY "Users can view own invoice extractions"
  ON public.invoice_extractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoice extractions"
  ON public.invoice_extractions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoice extractions"
  ON public.invoice_extractions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoice extractions"
  ON public.invoice_extractions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_afes_user_id ON public.afes(user_id);
CREATE INDEX idx_afes_afe_number ON public.afes(afe_number);
CREATE INDEX idx_afes_status ON public.afes(status);

CREATE INDEX idx_uwis_user_id ON public.uwis(user_id);
CREATE INDEX idx_uwis_uwi ON public.uwis(uwi);

CREATE INDEX idx_field_tickets_user_id ON public.field_tickets(user_id);
CREATE INDEX idx_field_tickets_invoice_id ON public.field_tickets(invoice_id);
CREATE INDEX idx_field_tickets_afe_id ON public.field_tickets(afe_id);
CREATE INDEX idx_field_tickets_ticket_number ON public.field_tickets(ticket_number);

CREATE INDEX idx_invoice_extractions_invoice_id ON public.invoice_extractions(invoice_id);
CREATE INDEX idx_invoice_extractions_user_id ON public.invoice_extractions(user_id);
CREATE INDEX idx_invoice_extractions_afe_id ON public.invoice_extractions(afe_id);

-- Add triggers for updated_at
CREATE TRIGGER update_afes_updated_at
  BEFORE UPDATE ON public.afes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_uwis_updated_at
  BEFORE UPDATE ON public.uwis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_tickets_updated_at
  BEFORE UPDATE ON public.field_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_extractions_updated_at
  BEFORE UPDATE ON public.invoice_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();