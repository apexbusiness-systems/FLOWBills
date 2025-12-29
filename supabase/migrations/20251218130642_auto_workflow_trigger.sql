-- Auto-start workflow trigger for invoices
-- This trigger automatically creates a workflow instance when an invoice is created
-- if there's an active workflow of type 'invoice_processing' for the user

-- Function to auto-start invoice workflow
CREATE OR REPLACE FUNCTION public.auto_start_invoice_workflow()
RETURNS TRIGGER AS $$
DECLARE
  v_default_workflow_id UUID;
BEGIN
  -- Find active default invoice workflow for this user
  SELECT id INTO v_default_workflow_id
  FROM public.workflows
  WHERE user_id = NEW.user_id
    AND workflow_type = 'invoice_processing'
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If default workflow exists, create instance
  IF v_default_workflow_id IS NOT NULL THEN
    INSERT INTO public.workflow_instances (
      user_id,
      workflow_id,
      entity_type,
      entity_id,
      status,
      current_step,
      step_data
    ) VALUES (
      NEW.user_id,
      v_default_workflow_id,
      'invoice',
      NEW.id,
      'pending',
      0,
      '{}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_start_invoice_workflow ON public.invoices;
CREATE TRIGGER trigger_auto_start_invoice_workflow
  AFTER INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_start_invoice_workflow();

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_start_invoice_workflow() IS 'Automatically creates workflow instance when invoice is created';
COMMENT ON TRIGGER trigger_auto_start_invoice_workflow ON public.invoices IS 'Auto-starts invoice processing workflow on invoice creation';

