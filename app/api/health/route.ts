import { NextRequest, NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';

interface HealthRecord {
  id: string;
  date: string;
  meals: string;
  exercise: string;
  sleep: string;
  mood: string;
  notes: string;
  symptoms?: string;
  medications?: string;
  [key: string]: any;
}

// GET /api/health?email=user@example.com - 건강 데이터 조회
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

    // 사용자의 건강 데이터 조회
    const healthData = await redis.get<HealthRecord[]>(`health:${email}`);
    
    return NextResponse.json({
      records: healthData || [],
    });
  } catch (error: any) {
    console.error('Get health data error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/health - 건강 데이터 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { email, records } = await request.json();
    
    if (!email || !records) {
      return NextResponse.json(
        { error: 'Email and records required' },
        { status: 400 }
      );
    }

    // Redis에 건강 데이터 저장
    await redis.set(`health:${email}`, records);
    
    return NextResponse.json({
      message: 'Health data saved successfully',
      count: records.length,
    });
  } catch (error: any) {
    console.error('Save health data error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/health?email=user@example.com - 건강 데이터 삭제
export async function DELETE(request: NextRequest) {
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

    await redis.del(`health:${email}`);
    
    return NextResponse.json({
      message: 'Health data deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete health data error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
