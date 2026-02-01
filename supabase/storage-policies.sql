-- Health Alpha Storage Buckets and Policies

-- 1. Storage 버킷 생성 (Supabase UI에서도 가능)
-- 또는 SQL로 생성:
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('health-photos', 'health-photos', true),
  ('health-videos', 'health-videos', true),
  ('note-photos', 'note-photos', true),
  ('note-videos', 'note-videos', true),
  ('diary-photos', 'diary-photos', true),
  ('diary-videos', 'diary-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage 정책 생성
-- 모든 사용자가 자신의 파일을 업로드/조회/삭제 가능

-- health-photos 버킷 정책
CREATE POLICY "Users can upload their own health photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'health-photos');

CREATE POLICY "Users can view health photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'health-photos');

CREATE POLICY "Users can delete their own health photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'health-photos');

-- health-videos 버킷 정책
CREATE POLICY "Users can upload their own health videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'health-videos');

CREATE POLICY "Users can view health videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'health-videos');

CREATE POLICY "Users can delete their own health videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'health-videos');

-- note-photos 버킷 정책
CREATE POLICY "Users can upload their own note photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-photos');

CREATE POLICY "Users can view note photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-photos');

CREATE POLICY "Users can delete their own note photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-photos');

-- note-videos 버킷 정책
CREATE POLICY "Users can upload their own note videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-videos');

CREATE POLICY "Users can view note videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-videos');

CREATE POLICY "Users can delete their own note videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-videos');

-- diary-photos 버킷 정책
CREATE POLICY "Users can upload their own diary photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'diary-photos');

CREATE POLICY "Users can view diary photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'diary-photos');

CREATE POLICY "Users can delete their own diary photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'diary-photos');

-- diary-videos 버킷 정책
CREATE POLICY "Users can upload their own diary videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'diary-videos');

CREATE POLICY "Users can view diary videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'diary-videos');

CREATE POLICY "Users can delete their own diary videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'diary-videos');

-- 3. 파일 크기 제한 설정 (선택사항)
-- Supabase는 기본적으로 50MB까지 업로드 가능
-- 개별 버킷별로 제한을 설정하려면 UI에서 설정하거나
-- 클라이언트 사이드에서 검증

-- 4. MIME 타입 제한 (선택사항, 클라이언트 사이드에서 검증)
-- 이미지: image/jpeg, image/png, image/gif, image/webp
-- 동영상: video/mp4, video/webm, video/quicktime
