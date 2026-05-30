
-- Table: client_photos
CREATE TABLE public.client_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  appointment_id uuid,
  photo_date timestamptz NOT NULL DEFAULT now(),
  storage_path text NOT NULL,
  observation text,
  service_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_photos TO authenticated;
GRANT ALL ON public.client_photos TO service_role;

ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client photos"
  ON public.client_photos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client photos"
  ON public.client_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client photos"
  ON public.client_photos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client photos"
  ON public.client_photos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_client_photos_client_date
  ON public.client_photos (client_id, photo_date DESC);

CREATE INDEX idx_client_photos_user
  ON public.client_photos (user_id);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: path layout = {auth.uid()}/{client_id}/{file}
CREATE POLICY "Users can view own client photo files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own client photo files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own client photo files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own client photo files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
