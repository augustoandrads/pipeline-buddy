# Supabase Storage Setup for Lead Attachments

## Manual Setup Required

The Supabase Storage bucket cannot be created through migrations (they are for tables only).
Please complete these steps manually via Supabase Dashboard:

### Step 1: Create Storage Bucket

1. Go to https://supabase.com/dashboard/project/wnarqsqdsydrjmevioku/storage/buckets
2. Click "Create a new bucket"
3. Enter bucket name: `lead-attachments`
4. **Privacy**: Select **Private** (not public)
5. Click "Create bucket"

### Step 2: Configure RLS Policies (Optional)

If you want granular control over access, you can add policies. However, the permissive default should work:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lead-attachments');

-- Allow authenticated users to download
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lead-attachments');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lead-attachments');
```

Run these in the SQL Editor if you want explicit policies.

## Verify Setup

After creating the bucket, you should see it in the Storage section of the dashboard:
- Bucket name: `lead-attachments`
- Privacy: Private
- Created: [current date]

## Testing

The app will now:
1. Upload files to `lead-attachments/{leadId}/{uuid}-{filename}`
2. Store metadata in the `lead_attachments` PostgreSQL table
3. Generate signed URLs for downloads (1 hour expiry)
4. Support deletion of both files and metadata

You're all set! 🎉
