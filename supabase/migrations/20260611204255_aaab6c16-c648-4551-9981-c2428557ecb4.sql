
-- 1. PROFILES: drop overly-permissive public read policy. Only owner/admin keep SELECT.
DROP POLICY IF EXISTS "Public can read safe profile fields" ON public.profiles;
-- Revoke broad column SELECT given previously; only authenticated/owner via policy.
REVOKE SELECT ON public.profiles FROM anon;

-- 2. TASKS: hide address_optional column from anon/authenticated.
REVOKE SELECT (address_optional) ON public.tasks FROM anon, authenticated;

-- Guarded function to fetch address only for owner / assigned tasker / admin.
CREATE OR REPLACE FUNCTION public.get_task_address(p_task_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.address_optional
  FROM public.tasks t
  WHERE t.id = p_task_id
    AND (
      t.customer_user_id = auth.uid()
      OR t.assigned_tasker_id = auth.uid()
      OR public.is_admin(auth.uid())
    );
$$;
REVOKE EXECUTE ON FUNCTION public.get_task_address(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_task_address(uuid) TO authenticated;

-- 3. REVIEWS: hide is_hidden reviews from public.
DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;
CREATE POLICY "Reviews are public unless hidden"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (
  is_hidden = false
  OR reviewer_user_id = auth.uid()
  OR reviewee_user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

-- 4. REALTIME: restrict subscriptions on chat channels (topic format: messages-<thread_id>).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat participants can subscribe to thread channels" ON realtime.messages;
CREATE POLICY "Chat participants can subscribe to thread channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'messages-%' THEN
      EXISTS (
        SELECT 1 FROM public.chat_threads ct
        WHERE ct.id::text = substring(realtime.topic() from 10)
          AND (ct.customer_user_id = auth.uid() OR ct.tasker_user_id = auth.uid())
      )
    ELSE true
  END
);

-- 5. SECURITY DEFINER helper functions: revoke from PUBLIC, grant only where needed.
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_tasker(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_offer(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_payment(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_thread(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_task(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tasker_can_instant_accept(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_user_task_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_user_rating(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tasker(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_task(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tasker_can_instant_accept(uuid, uuid) TO authenticated;

-- 6. GraphQL exposure: revoke usage on graphql_public from anon/authenticated.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'graphql_public') THEN
    EXECUTE 'REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql_public FROM anon, authenticated';
  END IF;
END$$;
