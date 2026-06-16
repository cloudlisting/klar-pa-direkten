
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ALTER COLUMN body DROP NOT NULL;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_body_or_media_chk
  CHECK (body IS NOT NULL OR media_url IS NOT NULL);

-- Storage policies for chat-media bucket
CREATE POLICY "Thread participants can view chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (
    public.can_access_thread(((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "Thread participants can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND public.can_access_thread(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Thread participants can delete their chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND owner = auth.uid()
);
