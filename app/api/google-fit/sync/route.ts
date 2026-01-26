import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getTodaySteps, refreshAccessToken } from '@/lib/googleFit';
import { calculateWalkingMetrics } from '@/utils/walkingCalculator';

// Redis 초기화 (선택적)
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error('Failed to initialize Redis:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, accessToken, refreshToken, expiresAt } = await request.json();

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: 'User ID and access token required' },
        { status: 400 }
      );
    }

    let currentAccessToken = accessToken;

    // 토큰 만료 확인 및 갱신
    if (Date.now() >= expiresAt) {
      if (!refreshToken) {
        return NextResponse.json(
          { error: 'Token expired, please reconnect' },
          { status: 401 }
        );
      }

      const newCredentials = await refreshAccessToken(refreshToken);
      currentAccessToken = newCredentials.accessToken;

      // 갱신된 토큰을 응답에 포함
      return NextResponse.json({
        error: 'token_refreshed',
        newToken: {
          accessToken: newCredentials.accessToken,
          expiresAt: newCredentials.expiresAt,
        }
      }, { status: 401 });
    }

    // Google Fit에서 오늘의 걸음수 가져오기
    const steps = await getTodaySteps(currentAccessToken);

    // 기본 체중 (나중에 프로필에서 가져올 수 있음)
    let userWeight = 70;

    // Redis가 사용 가능하면 체중 기록 시도
    if (redis) {
      try {
        const healthData: any = await redis.get(`health:${userEmail}`);
        if (healthData && Array.isArray(healthData)) {
          const recordsWithWeight = healthData.filter((r: any) => r.weight);
          if (recordsWithWeight.length > 0) {
            userWeight = recordsWithWeight[0].weight;
          }
        }
      } catch (redisError) {
        console.warn('Failed to get weight from Redis:', redisError);
      }
    }

    // 걸은 시간과 칼로리 자동 계산
    const { walkingTime, calories } = calculateWalkingMetrics(steps, userWeight);

    // 업데이트 플래그 제거 (Redis 사용 가능 시)
    if (redis) {
      try {
        await redis.del(`google-fit-updated:${userId}`);
      } catch (redisError) {
        console.warn('Failed to delete update flag:', redisError);
      }
    }

    return NextResponse.json({
      steps,
      walkingTime,
      calories,
      source: 'google_fit',
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync steps error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync steps' },
      { status: 500 }
    );
  }
}

/**
 * 업데이트 확인용 GET 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // 업데이트 플래그 확인
    const updateFlag: any = await redis.get(`google-fit-updated:${userId}`);

    return NextResponse.json({
      hasUpdate: !!updateFlag,
      timestamp: updateFlag?.timestamp,
    });
  } catch (error) {
    console.error('Check update error:', error);
    return NextResponse.json(
      { error: 'Failed to check update' },
      { status: 500 }
    );
  }
}
