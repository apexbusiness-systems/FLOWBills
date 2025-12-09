-- Create storage bucket for invoice documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-documents', 
  'invoice-documents', 
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/xml', 'text/xml', 'image/png', 'image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own invoice documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can view their own documents
CREATE POLICY "Users can view their own invoice documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoice-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can update their own documents
CREATE POLICY "Users can update their own invoice documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own invoice documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);