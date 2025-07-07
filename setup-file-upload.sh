#!/bin/bash

# File Upload Setup Script for Smart Brain AI Chatbot
# This script helps configure Supabase for file upload functionality

set -e

echo "🚀 Setting up File Upload for Smart Brain AI Chatbot"
echo "=================================================="

# Check if .env file exists
if [ ! -f "client/.env" ]; then
    echo "❌ Error: client/.env file not found!"
    echo "Please create client/.env file with your Supabase credentials first."
    echo "You can copy from client/env.example"
    exit 1
fi

# Load environment variables
source client/.env

# Check required environment variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing Supabase environment variables!"
    echo "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in client/.env"
    exit 1
fi

echo "✅ Environment variables loaded successfully"

# Function to check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        echo "❌ Supabase CLI not found!"
        echo "Please install Supabase CLI first:"
        echo "npm install -g supabase"
        echo "or visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
    echo "✅ Supabase CLI found"
}

# Function to check if user is logged in to Supabase
check_supabase_auth() {
    if ! supabase status &> /dev/null; then
        echo "❌ Not logged in to Supabase!"
        echo "Please run: supabase login"
        exit 1
    fi
    echo "✅ Logged in to Supabase"
}

# Function to apply migrations
apply_migrations() {
    echo "📦 Applying database migrations..."
    
    # Apply the main migration
    supabase db push
    
    # Apply the file upload migration specifically
    if [ -f "supabase/migrations/20250616061104_file_upload_setup.sql" ]; then
        echo "📁 Setting up file upload storage and policies..."
        supabase db push --include-all
    else
        echo "⚠️  File upload migration not found. Creating it..."
        # Create the migration file if it doesn't exist
        cat > supabase/migrations/20250616061104_file_upload_setup.sql << 'EOF'
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
EOF
        supabase db push --include-all
    fi
}

# Function to verify setup
verify_setup() {
    echo "🔍 Verifying setup..."
    
    # Check if storage bucket exists
    echo "Checking storage bucket..."
    if supabase db diff --schema storage | grep -q "user-files"; then
        echo "✅ Storage bucket 'user-files' configured"
    else
        echo "⚠️  Storage bucket may not be properly configured"
    fi
    
    # Check if RLS policies are in place
    echo "Checking RLS policies..."
    if supabase db diff --schema public | grep -q "file_uploads"; then
        echo "✅ RLS policies for file_uploads configured"
    else
        echo "⚠️  RLS policies may not be properly configured"
    fi
    
    echo "✅ Setup verification completed"
}

# Function to provide manual setup instructions
manual_setup_instructions() {
    echo ""
    echo "📋 Manual Setup Instructions (if automatic setup fails):"
    echo "======================================================"
    echo ""
    echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
    echo "2. Select your project"
    echo ""
    echo "3. Create Storage Bucket:"
    echo "   - Go to Storage → Buckets"
    echo "   - Click 'Create a new bucket'"
    echo "   - Name: 'user-files'"
    echo "   - Public bucket: NO (unchecked)"
    echo "   - File size limit: 50MB"
    echo "   - Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    echo ""
    echo "4. Set up Storage Policies:"
    echo "   - Go to Storage → Policies"
    echo "   - For the 'user-files' bucket, create these policies:"
    echo ""
    echo "   Policy 1 (INSERT):"
    echo "   - Name: 'Users can upload to their own folder'"
    echo "   - Target roles: authenticated"
    echo "   - Policy definition:"
    echo "     bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]"
    echo ""
    echo "   Policy 2 (SELECT):"
    echo "   - Name: 'Users can view their own files'"
    echo "   - Target roles: authenticated"
    echo "   - Policy definition:"
    echo "     bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]"
    echo ""
    echo "   Policy 3 (UPDATE):"
    echo "   - Name: 'Users can update their own files'"
    echo "   - Target roles: authenticated"
    echo "   - Policy definition:"
    echo "     bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]"
    echo ""
    echo "   Policy 4 (DELETE):"
    echo "   - Name: 'Users can delete their own files'"
    echo "   - Target roles: authenticated"
    echo "   - Policy definition:"
    echo "     bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]"
    echo ""
    echo "5. Set up Database RLS:"
    echo "   - Go to Database → Tables → file_uploads"
    echo "   - Enable RLS (Row Level Security)"
    echo "   - Create policies for SELECT, INSERT, UPDATE, DELETE"
    echo "   - All policies should use: auth.uid() = user_id"
    echo ""
    echo "6. Test the setup:"
    echo "   - Start the development server: npm run dev"
    echo "   - Log in to the application"
    echo "   - Try uploading a file"
    echo ""
}

# Main execution
main() {
    echo "🔧 Checking prerequisites..."
    check_supabase_cli
    check_supabase_auth
    
    echo ""
    echo "📦 Setting up file upload functionality..."
    apply_migrations
    
    echo ""
    verify_setup
    
    echo ""
    echo "✅ File upload setup completed!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Start the development server: npm run dev"
    echo "2. Log in to the application"
    echo "3. Go to the 'Upload Files' tab"
    echo "4. Try uploading a file to test the functionality"
    echo ""
    echo "📚 For more information, see the manual setup instructions below:"
    manual_setup_instructions
}

# Run main function
main "$@" 