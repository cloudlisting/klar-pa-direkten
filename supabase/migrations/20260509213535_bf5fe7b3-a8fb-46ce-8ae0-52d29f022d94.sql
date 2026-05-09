DROP POLICY IF EXISTS "Participants can create threads" ON public.chat_threads;

CREATE POLICY "Participants can create threads"
ON public.chat_threads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (customer_user_id = auth.uid() OR tasker_user_id = auth.uid())
);