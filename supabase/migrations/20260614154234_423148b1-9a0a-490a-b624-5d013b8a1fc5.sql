CREATE POLICY "Authenticated can upload task photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated can read task photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'task-photos');

CREATE POLICY "Owners can delete their task photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-photos' AND (storage.foldername(name))[1] = auth.uid()::text);