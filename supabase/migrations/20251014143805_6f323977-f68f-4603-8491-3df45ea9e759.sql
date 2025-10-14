-- P2: Billing Tables for Stripe Integration
-- Stores Stripe customer relationships
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stores Stripe subscription data
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.billing_customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  plan_id TEXT NOT NULL, -- 'starter' or 'growth'
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stores all Stripe webhook events for idempotency
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stores monthly usage for metering (idempotent by unique constraint)
CREATE TABLE IF NOT EXISTS public.billing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.billing_customers(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- 'invoices_processed'
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  quantity INTEGER NOT NULL,
  reported_to_stripe_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, metric, period_start, period_end)
);

-- P4: Idempotency keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL, -- 'processing', 'completed', 'failed'
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_customers
CREATE POLICY "Users can view their own billing customer"
  ON public.billing_customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage billing customers"
  ON public.billing_customers FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for billing_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (customer_id IN (SELECT id FROM public.billing_customers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage subscriptions"
  ON public.billing_subscriptions FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for billing_events (system-only)
CREATE POLICY "System can insert billing events"
  ON public.billing_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view billing events"
  ON public.billing_events FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for billing_usage
CREATE POLICY "Users can view their own usage"
  ON public.billing_usage FOR SELECT
  USING (customer_id IN (SELECT id FROM public.billing_customers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage usage"
  ON public.billing_usage FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for idempotency_keys (system-only)
CREATE POLICY "System can manage idempotency keys"
  ON public.idempotency_keys FOR ALL
  USING (true);

-- P5: Indexes for keyset pagination and performance
CREATE INDEX IF NOT EXISTS idx_invoices_created_id ON public.invoices(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_created_id ON public.invoices(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe ON public.billing_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer ON public.billing_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_usage_customer_period ON public.billing_usage(customer_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON public.idempotency_keys(expires_at);

-- Triggers for updated_at
CREATE TRIGGER update_billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_usage_updated_at
  BEFORE UPDATE ON public.billing_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- P13: Add retention policy cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  idempotency_deleted INTEGER := 0;
  old_events_deleted INTEGER := 0;
BEGIN
  -- Clean up expired idempotency keys (24h retention)
  DELETE FROM public.idempotency_keys
  WHERE expires_at < now();
  GET DIAGNOSTICS idempotency_deleted = ROW_COUNT;
  
  -- Clean up old billing events (90 days retention)
  DELETE FROM public.billing_events
  WHERE created_at < (now() - interval '90 days');
  GET DIAGNOSTICS old_events_deleted = ROW_COUNT;
  
  deleted_count := idempotency_deleted + old_events_deleted;
  
  -- Log cleanup activity
  IF deleted_count > 0 THEN
    INSERT INTO public.security_events (
      event_type,
      severity,
      details
    ) VALUES (
      'data_retention_cleanup',
      'info',
      jsonb_build_object(
        'idempotency_keys_deleted', idempotency_deleted,
        'billing_events_deleted', old_events_deleted,
        'total_deleted', deleted_count,
        'cleanup_time', now()
      )
    );
  END IF;
  
  RETURN deleted_count;
END;
$$;