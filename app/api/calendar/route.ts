import { NextRequest, NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';

// GET /api/calendar?email=user@example.com - 캘린더 데이터 조회
export async function GET(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // 사용자의 캘린더 데이터 조회
    const calendarData = await redis.get(`calendar:${email}`);
    
    return NextResponse.json({
      events: calendarData?.events || [],
      diaries: calendarData?.diaries || [],
    });
  } catch (error: any) {
    console.error('Get calendar data error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/calendar - 캘린더 데이터 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { email, events, diaries } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Redis에 캘린더 데이터 저장
    await redis.set(`calendar:${email}`, { events, diaries });
    
    return NextResponse.json({
      message: 'Calendar data saved successfully',
      eventCount: events?.length || 0,
      diaryCount: diaries?.length || 0,
    });
  } catch (error: any) {
    console.error('Save calendar data error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
