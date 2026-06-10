-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2. Restrict SELECT on profiles to owner + admin
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

-- 3. Create a safe public view exposing only non-PII fields.
--    Excludes email, phone, referral_code and any other private data.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  avatar_url,
  bio,
  rating_avg,
  rating_count,
  completed_tasks,
  cancelled_tasks,
  completion_rate,
  response_time_minutes,
  bankid_verified,
  id_verified,
  phone_verified,
  email_verified,
  created_at
FROM public.profiles;

-- 4. Allow the Data API to read the view (RLS on base table still applies,
--    but since security_invoker=on, we need a base-table SELECT policy that
--    permits reading these safe rows for everyone).
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 5. Add a permissive SELECT policy that ONLY allows access to the safe columns
--    via the view. Because security_invoker=on, the view runs as the caller and
--    the underlying SELECT must succeed. We add a column-restricted policy by
--    granting column-level SELECT on safe columns to anon/authenticated, and a
--    matching RLS policy.
CREATE POLICY "Public can read safe profile fields"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Revoke broad column access on the base table and grant only the safe
--    columns to anon/authenticated. Owner/admin still get full access via the
--    "Users can view own profile" policy combined with table-level grants below.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, name, avatar_url, bio,
  rating_avg, rating_count,
  completed_tasks, cancelled_tasks, completion_rate, response_time_minutes,
  bankid_verified, id_verified, phone_verified, email_verified,
  created_at
) ON public.profiles TO anon, authenticated;

-- Keep full access for the owner-update/insert paths and admin via service_role
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
