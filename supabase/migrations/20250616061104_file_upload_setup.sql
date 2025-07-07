-- File Upload Setup Migration
-- This migration sets up Supabase Storage and RLS policies for file uploads

-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  false, -- private bucket
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on file_uploads table
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_uploads table
-- Users can only see their own files
CREATE POLICY "Users can view their own files"
  ON file_uploads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own files
CREATE POLICY "Users can insert their own files"
  ON file_uploads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own files
CREATE POLICY "Users can update their own files"
  ON file_uploads
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own files
CREATE POLICY "Users can delete their own files"
  ON file_uploads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage policies for user-files bucket
-- Users can only upload to their own folder
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only view their own files
CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to get user's file count
CREATE OR REPLACE FUNCTION get_user_file_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM file_uploads
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's total file size
CREATE OR REPLACE FUNCTION get_user_total_file_size(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(file_size), 0)
    FROM file_uploads
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id_created_at 
  ON file_uploads(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_uploads_processing_status 
  ON file_uploads(processing_status);

-- Add trigger to update file count in user profile (if profiles table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Create function to update user's file count in profile
    CREATE OR REPLACE FUNCTION update_user_file_stats()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        UPDATE profiles 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object(
            'file_count', get_user_file_count(NEW.user_id),
            'total_file_size', get_user_total_file_size(NEW.user_id),
            'last_file_upload', NEW.created_at
          )
        WHERE id = NEW.user_id;
        RETURN NEW;
      ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object(
            'file_count', get_user_file_count(OLD.user_id),
            'total_file_size', get_user_total_file_size(OLD.user_id)
          )
        WHERE id = OLD.user_id;
        RETURN OLD;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_update_user_file_stats ON file_uploads;
    CREATE TRIGGER trigger_update_user_file_stats
      AFTER INSERT OR DELETE ON file_uploads
      FOR EACH ROW
      EXECUTE FUNCTION update_user_file_stats();
  END IF;
END $$; 