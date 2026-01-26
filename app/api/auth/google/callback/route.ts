import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/googleFit';
import { Redis } from '@upstash/redis';

// Redis 초기화 (환경변수 확인)
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else {
    console.warn('Redis credentials not configured');
  }
} catch (error) {
  console.error('Failed to initialize Redis:', error);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId를 state로 전달
    const error = searchParams.get('error');

    console.log('Google OAuth callback - code:', code ? 'received' : 'missing');
    console.log('Google OAuth callback - state:', state);
    console.log('Google OAuth callback - error:', error);

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/?error=oauth_denied', request.url)
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    // OAuth 코드를 액세스 토큰으로 교환
    console.log('Exchanging code for token...');
    const credentials = await exchangeCodeForToken(code);
    console.log('Token exchange successful');

    // Redis에 사용자의 Google Fit 토큰 저장
    if (state && redis) {
      try {
        await redis.set(`google-fit-token:${state}`, {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          connectedAt: new Date().toISOString(),
        });
        console.log('Token saved to Redis for user:', state);
      } catch (redisError) {
        console.error('Failed to save token to Redis:', redisError);
        // Redis 저장 실패해도 연결은 성공으로 처리
      }
    } else if (!redis) {
      console.warn('Redis not available, token not persisted');
    }

    // 성공 메시지와 함께 리다이렉트 (토큰 정보를 URL에 포함)
    console.log('Redirecting to app with success status');
    const successUrl = new URL('/', request.url);
    successUrl.searchParams.set('google_fit', 'connected');
    successUrl.searchParams.set('access_token', credentials.accessToken);
    successUrl.searchParams.set('refresh_token', credentials.refreshToken || '');
    successUrl.searchParams.set('expires_at', credentials.expiresAt.toString());
    
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    );
  }
}
