-- FlowBills.ca Phase 0 Database Schema
-- Production-ready invoice processing with RLS policies

-- Create enums for consistent data types
CREATE TYPE public.invoice_status AS ENUM ('pending', 'approved', 'rejected', 'processing', 'duplicate');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.exception_type AS ENUM ('duplicate', 'amount_variance', 'vendor_mismatch', 'missing_po', 'compliance_issue');
CREATE TYPE public.consent_type AS ENUM ('email', 'sms', 'data_processing', 'marketing');
CREATE TYPE public.user_role AS ENUM ('admin', 'operator', 'viewer');

-- Vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  vendor_code TEXT UNIQUE,
  tax_id TEXT,
  address JSONB,
  contact_info JSONB,
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  po_number TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  invoice_date DATE NOT NULL,
  due_date DATE,
  description TEXT,
  line_items JSONB,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  status invoice_status DEFAULT 'pending',
  confidence_score INTEGER DEFAULT 0,
  duplicate_hash TEXT,
  file_url TEXT,
  extracted_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Approvals table
CREATE TABLE public.approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  status approval_status DEFAULT 'pending',
  amount_approved DECIMAL(12,2),
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  approval_level INTEGER DEFAULT 1,
  auto_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Review queue for Human-in-Loop
CREATE TABLE public.review_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 3,
  reason TEXT NOT NULL,
  confidence_score INTEGER,
  flagged_fields JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exceptions tracking
CREATE TABLE public.exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id),
  exception_type exception_type NOT NULL,
  severity risk_level DEFAULT 'medium',
  description TEXT NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance records
CREATE TABLE public.compliance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'invoice', 'vendor', 'user'
  entity_id UUID NOT NULL,
  regulation TEXT NOT NULL, -- 'PIPEDA', 'CASL', 'SOX', etc.
  status TEXT DEFAULT 'compliant',
  risk_level risk_level DEFAULT 'low',
  last_audit_date TIMESTAMP WITH TIME ZONE,
  next_audit_date TIMESTAMP WITH TIME ZONE,
  audit_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs for all system events
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consent logs for CASL/PIPEDA compliance
CREATE TABLE public.consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  phone TEXT,
  consent_type consent_type NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_text TEXT,
  ip_address INET,
  user_agent TEXT,
  withdrawal_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Leads table for marketing
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  message TEXT,
  interest_type TEXT DEFAULT 'demo',
  lead_source TEXT DEFAULT 'website',
  lead_status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- RLS Policies for vendors
CREATE POLICY "Authenticated users can view vendors" ON public.vendors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operators can manage vendors" ON public.vendors
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) IN ('admin', 'operator'));

CREATE POLICY "Users can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Operators can update invoices" ON public.invoices
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

-- RLS Policies for approvals
CREATE POLICY "Authenticated users can view approvals" ON public.approvals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operators can manage approvals" ON public.approvals
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

-- RLS Policies for review queue
CREATE POLICY "Operators can view review queue" ON public.review_queue
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

CREATE POLICY "Assigned users can view their items" ON public.review_queue
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Operators can manage review queue" ON public.review_queue
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

-- RLS Policies for exceptions
CREATE POLICY "Authenticated users can view exceptions" ON public.exceptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operators can manage exceptions" ON public.exceptions
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

-- RLS Policies for compliance records
CREATE POLICY "Admins can view compliance records" ON public.compliance_records
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage compliance records" ON public.compliance_records
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for consent logs
CREATE POLICY "Users can view their own consent" ON public.consent_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert consent logs" ON public.consent_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all consent logs" ON public.consent_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for user roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for leads (public facing)
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Operators can view leads" ON public.leads
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'operator'));

-- Create indexes for performance
CREATE INDEX idx_invoices_vendor_id ON public.invoices(vendor_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_duplicate_hash ON public.invoices(duplicate_hash);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_approvals_invoice_id ON public.approvals(invoice_id);
CREATE INDEX idx_review_queue_assigned_to ON public.review_queue(assigned_to);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_consent_logs_user_id ON public.consent_logs(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_queue_updated_at BEFORE UPDATE ON public.review_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exceptions_updated_at BEFORE UPDATE ON public.exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON public.compliance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();