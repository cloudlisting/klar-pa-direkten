REVOKE SELECT (address_optional) ON public.tasks FROM anon, authenticated;

DROP POLICY IF EXISTS "Authenticated can read task photos" ON storage.objects;

CREATE POLICY "Task photo read access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.task_photos tp
      WHERE tp.url LIKE '%' || storage.objects.name
        AND public.can_view_task(tp.task_id)
    )
  )
);