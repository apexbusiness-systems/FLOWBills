-- Create budget alert rules table
CREATE TABLE IF NOT EXISTS public.budget_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold', 'percentage')),
  threshold_value NUMERIC NOT NULL,
  notification_channels JSONB NOT NULL DEFAULT '["email"]'::jsonb,
  email_recipients TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  afe_filter JSONB DEFAULT NULL,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_alert_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alert rules"
  ON public.budget_alert_rules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alert rules"
  ON public.budget_alert_rules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert rules"
  ON public.budget_alert_rules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert rules"
  ON public.budget_alert_rules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create budget alert logs table
CREATE TABLE IF NOT EXISTS public.budget_alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  afe_id UUID NOT NULL REFERENCES public.afes(id) ON DELETE CASCADE,
  alert_rule_id UUID NOT NULL REFERENCES public.budget_alert_rules(id) ON DELETE CASCADE,
  alert_message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  budget_utilization NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_alert_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alert logs"
  ON public.budget_alert_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alert logs"
  ON public.budget_alert_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_budget_alert_rules_user_id ON public.budget_alert_rules(user_id);
CREATE INDEX idx_budget_alert_rules_is_active ON public.budget_alert_rules(is_active);
CREATE INDEX idx_budget_alert_logs_user_id ON public.budget_alert_logs(user_id);
CREATE INDEX idx_budget_alert_logs_afe_id ON public.budget_alert_logs(afe_id);
CREATE INDEX idx_budget_alert_logs_created_at ON public.budget_alert_logs(created_at DESC);

-- Update trigger
CREATE TRIGGER update_budget_alert_rules_updated_at
  BEFORE UPDATE ON public.budget_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();