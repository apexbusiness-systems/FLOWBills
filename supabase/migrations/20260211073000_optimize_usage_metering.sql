-- Create optimized invoice counting RPC for batch processing
CREATE OR REPLACE FUNCTION public.get_usage_metrics_batch(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_customer_ids UUID[]
)
RETURNS TABLE (
  customer_id UUID,
  user_id UUID,
  invoice_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id AS customer_id,
    bc.user_id,
    COALESCE(COUNT(i.id), 0) AS invoice_count
  FROM
    unnest(p_customer_ids) AS cust(id)
    INNER JOIN public.billing_customers bc ON bc.id = cust.id
    LEFT JOIN public.invoices i ON i.user_id = bc.user_id
      AND i.created_at >= p_period_start
      AND i.created_at < p_period_end
  GROUP BY bc.id, bc.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Index optimizations for the RPC
-- These significantly improve the performance of the JOINs and aggregation
CREATE INDEX IF NOT EXISTS idx_invoices_user_created
  ON public.invoices(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_billing_customers_user
  ON public.billing_customers(user_id);
