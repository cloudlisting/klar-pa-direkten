-- Admin Dashboard v1
-- Adds operational admin columns, an admin-only notes table, an admin_settings
-- table, and security so normal users cannot write admin fields or read notes.

-- =========================================================================
-- 1. Operational admin columns on tasks & profiles
-- =========================================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_flagged          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_by_admin  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_updated_at    timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_flagged          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manually_verified   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_updated_at    timestamptz;

-- =========================================================================
-- 2. Guard triggers: only admins may change admin-only columns.
--    Normal user updates (editing their own bio, etc.) never touch these
--    columns, so IS DISTINCT FROM is false and the update passes.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_admin_columns_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    IF NEW.is_flagged         IS DISTINCT FROM OLD.is_flagged
       OR NEW.cancelled_by_admin IS DISTINCT FROM OLD.cancelled_by_admin
       OR NEW.admin_updated_at   IS DISTINCT FROM OLD.admin_updated_at THEN
      RAISE EXCEPTION 'Not authorized to modify admin fields on tasks';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_admin_columns_tasks ON public.tasks;
CREATE TRIGGER trg_guard_admin_columns_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.guard_admin_columns_tasks();

CREATE OR REPLACE FUNCTION public.guard_admin_columns_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    IF NEW.is_flagged        IS DISTINCT FROM OLD.is_flagged
       OR NEW.manually_verified IS DISTINCT FROM OLD.manually_verified
       OR NEW.is_deactivated    IS DISTINCT FROM OLD.is_deactivated
       OR NEW.admin_updated_at  IS DISTINCT FROM OLD.admin_updated_at THEN
      RAISE EXCEPTION 'Not authorized to modify admin fields on profiles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_admin_columns_profiles ON public.profiles;
CREATE TRIGGER trg_guard_admin_columns_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_admin_columns_profiles();

-- =========================================================================
-- 3. Internal admin notes (kept in a separate table so they can never be
--    read by the row owner). Admins only.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('task','user','report','payment')),
  entity_id   uuid NOT NULL,
  note        text NOT NULL,
  author_id   uuid NOT NULL DEFAULT auth.uid(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_entity
  ON public.admin_notes (entity_type, entity_id);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_notes_admin_all ON public.admin_notes;
CREATE POLICY admin_notes_admin_all ON public.admin_notes
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT ALL ON public.admin_notes TO authenticated;
GRANT ALL ON public.admin_notes TO service_role;

-- =========================================================================
-- 4. Admin settings (key/value). Everyone may read (so the app can show a
--    maintenance message); only admins may write.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        text PRIMARY KEY,
  value      jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_settings_select ON public.admin_settings;
CREATE POLICY admin_settings_select ON public.admin_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS admin_settings_insert ON public.admin_settings;
CREATE POLICY admin_settings_insert ON public.admin_settings
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_settings_update ON public.admin_settings;
CREATE POLICY admin_settings_update ON public.admin_settings
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_settings_delete ON public.admin_settings;
CREATE POLICY admin_settings_delete ON public.admin_settings
  FOR DELETE USING (public.is_admin(auth.uid()));

GRANT ALL ON public.admin_settings TO authenticated;
GRANT SELECT ON public.admin_settings TO anon;
GRANT ALL ON public.admin_settings TO service_role;
