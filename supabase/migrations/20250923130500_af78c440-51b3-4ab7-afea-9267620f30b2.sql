-- Function to automatically assign admin role to admin@flowbills.ca
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the user ID for admin@flowbills.ca
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@flowbills.ca'
    LIMIT 1;
    
    -- If user exists, assign admin role
    IF admin_user_id IS NOT NULL THEN
        -- Remove any existing roles for this user
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Assign admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;

-- Update the handle_new_user function to automatically assign admin role to admin@flowbills.ca
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign role based on email
  IF NEW.email = 'admin@flowbills.ca' THEN
    -- Assign admin role to the admin user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Assign default 'viewer' role to regular users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
  END IF;
  
  RETURN NEW;
END;
$$;