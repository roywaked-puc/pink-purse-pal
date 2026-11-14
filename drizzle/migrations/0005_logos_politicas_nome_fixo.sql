DROP POLICY "Users can upload own logo files" ON storage.objects;
DROP POLICY "Users can update own logo files" ON storage.objects;

CREATE POLICY "Users can upload own logo files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND name IN (
      (auth.uid())::text || '/logo.png',
      (auth.uid())::text || '/logo.jpg',
      (auth.uid())::text || '/logo.jpeg',
      (auth.uid())::text || '/logo.webp'
    )
  );

CREATE POLICY "Users can update own logo files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (
    bucket_id = 'logos'
    AND name IN (
      (auth.uid())::text || '/logo.png',
      (auth.uid())::text || '/logo.jpg',
      (auth.uid())::text || '/logo.jpeg',
      (auth.uid())::text || '/logo.webp'
    )
  );