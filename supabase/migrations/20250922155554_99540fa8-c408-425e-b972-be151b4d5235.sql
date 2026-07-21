-- This is a one-time script to assign admin role to the first user
-- Run this after creating your first account through the auth page

-- Function to make the first registered user an admin (run manually)
DO $$ 
DECLARE 
    first_user_id UUID;
BEGIN
    -- Get the first user from auth.users (you need to replace this with actual user ID)
    -- This is just a template - admin will need to run this with their actual user ID
    
    -- Example: INSERT INTO public.user_roles (user_id, role) VALUES ('your-user-id-here', 'admin');
    -- You can get your user ID from the Supabase Auth dashboard
    
    RAISE NOTICE 'Please manually insert your user ID into user_roles table to become admin';
    RAISE NOTICE 'Example: INSERT INTO public.user_roles (user_id, role) VALUES (''your-user-id'', ''admin'');';
END $$;