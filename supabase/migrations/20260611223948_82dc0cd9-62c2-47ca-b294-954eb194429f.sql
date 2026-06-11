
-- 1. Data API grants on profiles (missing — caused "permission denied for table profiles")
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. New columns for first/last name
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

-- 3. Role becomes optional (we no longer force a choice at onboarding)
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 4. Trigger picks up given_name / family_name from Google metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first text;
  v_last  text;
  v_full  text;
BEGIN
  v_first := NEW.raw_user_meta_data->>'given_name';
  v_last  := NEW.raw_user_meta_data->>'family_name';
  v_full  := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'preferred_username',
    NULLIF(trim(coalesce(v_first,'') || ' ' || coalesce(v_last,'')), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, name, first_name, last_name, email, avatar_url, email_verified)
  VALUES (
    NEW.id,
    v_full,
    v_first,
    v_last,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    name          = COALESCE(public.profiles.name,       EXCLUDED.name),
    first_name    = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name     = COALESCE(public.profiles.last_name,  EXCLUDED.last_name),
    avatar_url    = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    email_verified = public.profiles.email_verified OR EXCLUDED.email_verified;
  RETURN NEW;
END;
$$;
