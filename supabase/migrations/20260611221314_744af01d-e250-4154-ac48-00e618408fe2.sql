
DO $$ BEGIN
  CREATE TYPE public.user_role_kind AS ENUM ('bestallare','tasker','foretag');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role_kind,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS google_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
