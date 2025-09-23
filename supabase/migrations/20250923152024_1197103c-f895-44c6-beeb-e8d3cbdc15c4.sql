-- Update admin registration to include ceo@flowbills.ca
CREATE OR REPLACE FUNCTION public.assign_ceo_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ceo_user_id uuid;
BEGIN
    -- Get the user ID for ceo@flowbills.ca
    SELECT id INTO ceo_user_id
    FROM auth.users
    WHERE email = 'ceo@flowbills.ca'
    LIMIT 1;
    
    -- If user exists, assign admin role
    IF ceo_user_id IS NOT NULL THEN
        -- Remove any existing roles for this user
        DELETE FROM public.user_roles WHERE user_id = ceo_user_id;
        
        -- Assign admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (ceo_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Update profile role as well
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE user_id = ceo_user_id;
    END IF;
END;
$$;

-- Also update the handle_new_user function to handle ceo@flowbills.ca
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign role based on email
  IF NEW.email IN ('admin@flowbills.ca', 'ceo@flowbills.ca') THEN
    -- Assign admin role to admin users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Update profile role
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  ELSE
    -- Assign default 'viewer' role to regular users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;