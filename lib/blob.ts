import { put, del } from '@vercel/blob';

// Blob Storage에 파일 업로드
export async function uploadToBlob(
  file: File | Blob,
  filename: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const blob = await put(filename, file, {
      access: 'public',
    });

    return { url: blob.url, error: null };
  } catch (error) {
    console.error('Blob 업로드 실패:', error);
    return { url: null, error: error instanceof Error ? error.message : '업로드 실패' };
  }
}

// Blob Storage에서 파일 삭제
export async function deleteFromBlob(url: string): Promise<{ error: string | null }> {
  try {
    await del(url);
    return { error: null };
  } catch (error) {
    console.error('Blob 삭제 실패:', error);
    return { error: error instanceof Error ? error.message : '삭제 실패' };
  }
}

// Base64를 Blob으로 변환
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// 파일 이름 생성 (충돌 방지)
export function generateBlobFilename(userId: string, type: 'photo' | 'video', extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${userId}/${type}s/${timestamp}-${random}.${extension}`;
}
