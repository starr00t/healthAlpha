import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getTodaySteps, refreshAccessToken } from '@/lib/googleFit';
import { calculateWalkingMetrics } from '@/utils/walkingCalculator';

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Redis에서 Google Fit 토큰 가져오기
    const tokenData: any = await kv.get(`google-fit-token:${userId}`);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Google Fit not connected' },
        { status: 401 }
      );
    }

    let accessToken = tokenData.accessToken;

    // 토큰 만료 확인 및 갱신
    if (Date.now() >= tokenData.expiresAt) {
      if (!tokenData.refreshToken) {
        return NextResponse.json(
          { error: 'Token expired, please reconnect' },
          { status: 401 }
        );
      }

      const newCredentials = await refreshAccessToken(tokenData.refreshToken);
      accessToken = newCredentials.accessToken;

      // 갱신된 토큰 저장
      await kv.set(`google-fit-token:${userId}`, {
        ...tokenData,
        accessToken: newCredentials.accessToken,
        expiresAt: newCredentials.expiresAt,
      });
    }

    // Google Fit에서 오늘의 걸음수 가져오기
    const steps = await getTodaySteps(accessToken);

    // 최근 체중 기록 가져오기 (Redis에서)
    const healthData: any = await kv.get(`health:${userEmail}`);
    let userWeight = 70; // 기본값

    if (healthData && Array.isArray(healthData)) {
      const recordsWithWeight = healthData.filter((r: any) => r.weight);
      if (recordsWithWeight.length > 0) {
        userWeight = recordsWithWeight[0].weight;
      }
    }

    // 걸은 시간과 칼로리 자동 계산
    const { walkingTime, calories } = calculateWalkingMetrics(steps, userWeight);

    // 업데이트 플래그 제거
    await kv.del(`google-fit-updated:${userId}`);

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
      { error: 'Failed to sync steps' },
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
    const updateFlag: any = await kv.get(`google-fit-updated:${userId}`);

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
