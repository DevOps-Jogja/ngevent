-- Allow authenticated users to upload images to non-sensitive folders using RLS (no service role)
-- This migration assumes the 'events' bucket already exists.

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Policies specific to path-based constraints can be complex in storage.objects, but we keep
-- insert permissive (as in setup_storage_bucket.sql) and rely on delete/update restrictions.
-- Here we ensure owner-based delete/update are present and clarify comments.

-- Recreate delete/update policies with clear names (no-op if already present with same logic)
DO $$
BEGIN
  -- Delete own files only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own files'
  ) THEN
    CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'events'
      AND (SELECT auth.uid()) = owner
    );
  END IF;

  -- Update own files only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own files'
  ) THEN
    CREATE POLICY "Users can update their own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'events'
      AND (SELECT auth.uid()) = owner
    )
    WITH CHECK (
      bucket_id = 'events'
      AND (SELECT auth.uid()) = owner
    );
  END IF;
END$$;

-- Notes:
-- - Insert policy remains bucket-only; owner is automatically set by Supabase Storage for authenticated clients.
-- - Payment proof uploads should be gated by backend (our API enforces admin key for that folder).
-- - Public read remains enabled to allow serving images.
