import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as 'photo' | 'video';

    if (!file || !userId || !type) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (사진 10MB, 동영상 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. (최대 10MB)` },
        { status: 400 }
      );
    }

    // 파일 확장자 추출
    const extension = file.name.split('.').pop() || 'jpg';
    
    // 고유 파일명 생성
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const filename = `${userId}/${type}s/${timestamp}-${random}.${extension}`;

    // Blob에 업로드
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // Vercel Blob은 URL로 직접 삭제 가능
    const { del } = await import('@vercel/blob');
    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    return NextResponse.json(
      { error: '파일 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
