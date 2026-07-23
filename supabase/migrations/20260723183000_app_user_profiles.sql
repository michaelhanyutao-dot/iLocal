CREATE TABLE IF NOT EXISTS public.app_user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  notes TEXT,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  status_updated_at TIMESTAMP WITH TIME ZONE,
  status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_user_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_user_profiles TO service_role;

CREATE INDEX IF NOT EXISTS app_user_profiles_email_idx
ON public.app_user_profiles (email);

CREATE INDEX IF NOT EXISTS app_user_profiles_status_idx
ON public.app_user_profiles (status, created_at DESC);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.app_user_profiles;
CREATE POLICY "Users can view their own profile"
ON public.app_user_profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view user profiles" ON public.app_user_profiles;
CREATE POLICY "Admins can view user profiles"
ON public.app_user_profiles
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.app_user_profiles;
CREATE POLICY "Admins can insert user profiles"
ON public.app_user_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can update user profiles" ON public.app_user_profiles;
CREATE POLICY "Admins can update user profiles"
ON public.app_user_profiles
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'))
WITH CHECK (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.app_user_profiles;
CREATE POLICY "Admins can delete user profiles"
ON public.app_user_profiles
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

DROP TRIGGER IF EXISTS update_app_user_profiles_updated_at ON public.app_user_profiles;
CREATE TRIGGER update_app_user_profiles_updated_at
BEFORE UPDATE ON public.app_user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_app_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.app_user_profiles (
    user_id,
    email,
    display_name,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.last_sign_in_at,
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.app_user_profiles.display_name),
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_app_user_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_app_user_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_app_user_profile() FROM authenticated;

DROP TRIGGER IF EXISTS sync_app_user_profile_on_auth_user ON auth.users;
CREATE TRIGGER sync_app_user_profile_on_auth_user
AFTER INSERT OR UPDATE OF email, raw_user_meta_data, last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_app_user_profile();

INSERT INTO public.app_user_profiles (
  user_id,
  email,
  display_name,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
  last_sign_in_at,
  COALESCE(created_at, now()),
  now()
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = COALESCE(EXCLUDED.display_name, public.app_user_profiles.display_name),
  last_sign_in_at = EXCLUDED.last_sign_in_at,
  updated_at = now();
