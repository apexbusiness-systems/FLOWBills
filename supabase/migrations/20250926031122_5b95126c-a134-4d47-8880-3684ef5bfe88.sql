-- Fix security issue: Restrict leads table access to admin and operator roles only
-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Operators can view leads" ON public.leads;

-- Create secure policies for leads table
-- Allow anonymous users to insert leads (for lead capture forms)
CREATE POLICY "Anonymous users can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Restrict SELECT access to only admin and operator roles
CREATE POLICY "Only admins and operators can view leads" 
ON public.leads 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));

-- Restrict UPDATE access to only admin and operator roles
CREATE POLICY "Only admins and operators can update leads" 
ON public.leads 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));

-- Restrict DELETE access to only admin roles
CREATE POLICY "Only admins can delete leads" 
ON public.leads 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);