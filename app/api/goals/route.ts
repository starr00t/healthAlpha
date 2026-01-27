import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// GET - 목표 및 알림 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const goalsData = await redis.get(`goals:${email}`);
    
    return NextResponse.json({
      goals: goalsData || { goals: [], reminders: [] }
    });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST - 목표 및 알림 저장
export async function POST(request: NextRequest) {
  try {
    const { email, goals, reminders } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await redis.set(`goals:${email}`, { goals, reminders });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save goals' },
      { status: 500 }
    );
  }
}

// DELETE - 목표 및 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email');
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await redis.del(`goals:${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Goals DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete goals' },
      { status: 500 }
    );
  }
}
