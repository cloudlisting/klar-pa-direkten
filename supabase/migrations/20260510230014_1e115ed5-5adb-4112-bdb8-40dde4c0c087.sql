
-- 1. Extend profiles with trust + verification fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_tasks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_tasks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric(5,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS response_time_minutes integer,
  ADD COLUMN IF NOT EXISTS bankid_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- 2. Reviews: hidden flag + admin moderation policy
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Reviews are immutable" ON public.reviews;
CREATE POLICY "Reviews are immutable except admin"
ON public.reviews
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3. Verifications table (BankID / ID / phone / email)
DO $$ BEGIN
  CREATE TYPE public.verification_type AS ENUM ('bankid','id','phone','email');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_state AS ENUM ('pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  verification_type public.verification_type NOT NULL,
  status public.verification_state NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, verification_type)
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verifications"
ON public.verifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users request own verifications"
ON public.verifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage verifications"
ON public.verifications FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete verifications"
ON public.verifications FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER verifications_updated_at
BEFORE UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Auto-update profiles.rating_avg / rating_count when reviews change
CREATE OR REPLACE FUNCTION public.recalc_user_rating(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET rating_avg = COALESCE((
        SELECT round(avg(rating)::numeric, 2)
        FROM public.reviews
        WHERE reviewee_user_id = p_user_id AND is_hidden = false
      ), 0),
      rating_count = COALESCE((
        SELECT count(*) FROM public.reviews
        WHERE reviewee_user_id = p_user_id AND is_hidden = false
      ), 0),
      updated_at = now()
  WHERE p.id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviews_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_user_rating(OLD.reviewee_user_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_user_rating(NEW.reviewee_user_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS reviews_after_change_trg ON public.reviews;
CREATE TRIGGER reviews_after_change_trg
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_after_change();

-- 5. Auto-update completed_tasks / completion_rate on task status changes
CREATE OR REPLACE FUNCTION public.recalc_user_task_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed int;
  v_cancelled int;
  v_total int;
BEGIN
  SELECT
    count(*) FILTER (WHERE status = 'paid'),
    count(*) FILTER (WHERE status = 'cancelled'),
    count(*) FILTER (WHERE status IN ('paid','cancelled'))
  INTO v_completed, v_cancelled, v_total
  FROM public.tasks
  WHERE customer_user_id = p_user_id OR assigned_tasker_id = p_user_id;

  UPDATE public.profiles
  SET completed_tasks = v_completed,
      cancelled_tasks = v_cancelled,
      completion_rate = CASE WHEN v_total = 0 THEN 100
                             ELSE round((v_completed::numeric / v_total) * 100, 2) END,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tasks_status_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status
     AND COALESCE(NEW.assigned_tasker_id::text,'') = COALESCE(OLD.assigned_tasker_id::text,'') THEN
    RETURN NEW;
  END IF;
  PERFORM public.recalc_user_task_stats(NEW.customer_user_id);
  IF NEW.assigned_tasker_id IS NOT NULL THEN
    PERFORM public.recalc_user_task_stats(NEW.assigned_tasker_id);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_tasker_id IS NOT NULL
     AND OLD.assigned_tasker_id IS DISTINCT FROM NEW.assigned_tasker_id THEN
    PERFORM public.recalc_user_task_stats(OLD.assigned_tasker_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_status_after_change_trg ON public.tasks;
CREATE TRIGGER tasks_status_after_change_trg
AFTER INSERT OR UPDATE OF status, assigned_tasker_id ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_status_after_change();

-- 6. Mark profiles.email_verified=true when handle_new_user runs with confirmed email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$function$;

-- 7. Backfill aggregates for existing data
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalc_user_rating(r.id);
    PERFORM public.recalc_user_task_stats(r.id);
  END LOOP;
END $$;
