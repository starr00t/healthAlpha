import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * Google Fit Webhook 엔드포인트
 * Google Fit에서 데이터 변경 시 이 엔드포인트로 알림을 보냅니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Google Fit Webhook received:', body);

    // Google Fit Webhook 검증
    if (!body.collectionName || !body.userId) {
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    // 걸음수 데이터인지 확인
    if (body.collectionName === 'com.google.step_count.delta') {
      const userId = body.userId;
      
      // 변경 플래그 설정 (클라이언트가 폴링으로 확인)
      await kv.set(`google-fit-updated:${userId}`, {
        updated: true,
        timestamp: new Date().toISOString(),
        dataType: 'steps',
      }, { ex: 3600 }); // 1시간 후 자동 삭제

      console.log(`Steps updated for user: ${userId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Google Fit Webhook 검증용 엔드포인트
 * Google에서 Webhook 설정 시 GET 요청으로 검증
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('hub.challenge');

  if (challenge) {
    // Google의 검증 요청에 응답
    return new NextResponse(challenge, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' });
}
