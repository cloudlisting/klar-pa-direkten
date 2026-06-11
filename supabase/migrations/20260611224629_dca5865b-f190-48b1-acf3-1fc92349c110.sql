
-- Recreate INSERT policy on chat_threads explicitly TO authenticated so PostgREST
-- evaluates it against the signed-in role and the WITH CHECK passes.
DROP POLICY IF EXISTS "Participants can create threads" ON public.chat_threads;
CREATE POLICY "Participants can create threads"
ON public.chat_threads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (customer_user_id = auth.uid() OR tasker_user_id = auth.uid())
);

-- Make SELECT policy explicit TO authenticated as well (drops public default).
DROP POLICY IF EXISTS "Participants can access threads" ON public.chat_threads;
CREATE POLICY "Participants can access threads"
ON public.chat_threads
FOR SELECT
TO authenticated
USING (
  customer_user_id = auth.uid()
  OR tasker_user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

-- chat_messages: rebuild policies with explicit role + thread-participant check.
DROP POLICY IF EXISTS "Thread participants can send messages" ON public.chat_messages;
CREATE POLICY "Thread participants can send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_threads ct
    WHERE ct.id = chat_messages.thread_id
      AND (ct.customer_user_id = auth.uid() OR ct.tasker_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Thread participants can read messages" ON public.chat_messages;
CREATE POLICY "Thread participants can read messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_threads ct
    WHERE ct.id = chat_messages.thread_id
      AND (
        ct.customer_user_id = auth.uid()
        OR ct.tasker_user_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
  )
);

-- Ensure Data API grants exist for the signed-in role (no anon access).
GRANT SELECT, INSERT, UPDATE ON public.chat_threads  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_threads  TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
