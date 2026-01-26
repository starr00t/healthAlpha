import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/googleFit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId를 state로 전달

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    // OAuth 코드를 액세스 토큰으로 교환
    const credentials = await exchangeCodeForToken(code);

    // Redis에 사용자의 Google Fit 토큰 저장
    if (state) {
      await redis.set(`google-fit-token:${state}`, {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
        connectedAt: new Date().toISOString(),
      });
    }

    // 성공 메시지와 함께 리다이렉트
    return NextResponse.redirect(
      new URL('/?google_fit=connected', request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    );
  }
}
