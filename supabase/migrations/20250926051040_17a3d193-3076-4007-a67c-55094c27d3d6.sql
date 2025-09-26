-- Fix RLS Security Issues - Add missing policies

-- RLS Policies for policies table
CREATE POLICY "Admins can manage policies" ON public.policies
  FOR ALL USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Operators can view policies" ON public.policies
  FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));

-- RLS Policies for fraud_flags table  
CREATE POLICY "Operators can manage fraud flags" ON public.fraud_flags
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));

CREATE POLICY "Authenticated users can view fraud flags" ON public.fraud_flags
  FOR SELECT USING (auth.role() = 'authenticated'::text);

-- RLS Policies for email_templates table
CREATE POLICY "Authenticated users can view templates" ON public.email_templates
  FOR SELECT USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage templates" ON public.email_templates
  FOR ALL USING (get_user_role(auth.uid()) = 'admin'::user_role);