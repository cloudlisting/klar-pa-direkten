-- Drop and recreate the view so we can add google_connected in the desired column order
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
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
  google_connected,
  created_at
FROM public.profiles;

-- Grant on the recreated view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Update the base-table column grant to include google_connected
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, name, avatar_url, bio,
  rating_avg, rating_count,
  completed_tasks, cancelled_tasks, completion_rate, response_time_minutes,
  bankid_verified, id_verified, phone_verified, email_verified,
  google_connected,
  created_at
) ON public.profiles TO anon, authenticated;