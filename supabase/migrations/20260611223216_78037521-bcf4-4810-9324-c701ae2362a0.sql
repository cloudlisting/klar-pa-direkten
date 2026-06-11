
-- 1. Hide tasks.address_optional from anonymous and non-participant reads.
--    Participants/admin already get it via the existing public.get_task_address() RPC.
REVOKE SELECT (address_optional) ON public.tasks FROM anon, authenticated;
GRANT SELECT (address_optional) ON public.tasks TO service_role;

-- 2. Remove anonymous SELECT grants from auth/finance/messaging tables that should
--    never be discoverable before sign-in (defense-in-depth + closes GraphQL exposure
--    of these objects via the public anon key).
REVOKE SELECT ON public.user_roles    FROM anon;
REVOKE SELECT ON public.verifications FROM anon;
REVOKE SELECT ON public.payments      FROM anon;
REVOKE SELECT ON public.reports       FROM anon;
REVOKE SELECT ON public.chat_messages FROM anon;
REVOKE SELECT ON public.chat_threads  FROM anon;

-- 3. Lock down SECURITY DEFINER helper functions that should never be callable
--    directly via the API. They are invoked by triggers/policies, which do not
--    require EXECUTE on the calling role.
REVOKE EXECUTE ON FUNCTION public.recalc_user_rating(uuid)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_user_task_stats(uuid)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tasks_status_after_change()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reviews_after_change()         FROM PUBLIC, anon, authenticated;

-- get_task_address is an RPC for signed-in participants only.
REVOKE EXECUTE ON FUNCTION public.get_task_address(uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_task_address(uuid) TO authenticated, service_role;
