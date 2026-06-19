
-- Re-apply column revoke for tasks.address_optional
REVOKE SELECT (address_optional) ON public.tasks FROM anon, authenticated;
GRANT SELECT (address_optional) ON public.tasks TO service_role;

-- Tighten realtime subscription policy: deny non-matching topics
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
    ELSE false
  END
);
