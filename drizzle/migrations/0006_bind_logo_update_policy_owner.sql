ALTER POLICY "Users can update own logo files" ON storage.objects
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
  AND name = ANY (ARRAY[
    (select auth.uid()::text) || '/logo.png',
    (select auth.uid()::text) || '/logo.jpg',
    (select auth.uid()::text) || '/logo.jpeg',
    (select auth.uid()::text) || '/logo.webp'
  ])
);