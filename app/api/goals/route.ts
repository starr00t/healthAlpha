import { NextRequest, NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';

// GET - 목표 및 알림 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isRedisConfigured()) {
      console.log('⚠️ Redis not configured, returning empty goals');
      return NextResponse.json({
        goals: { goals: [], reminders: [] }
      });
    }

    const goalsData = await redis.get(`goals:${email}`);
    
    return NextResponse.json({
      goals: goalsData || { goals: [], reminders: [] }
    });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json({
      goals: { goals: [], reminders: [] }
    });
  }
}

// POST - 목표 및 알림 저장
export async function POST(request: NextRequest) {
  try {
    const { email, goals, reminders } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isRedisConfigured()) {
      console.log('⚠️ Redis not configured, skipping save');
      return NextResponse.json({ success: true, warning: 'Redis not configured' });
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

    if (!isRedisConfigured()) {
      console.log('⚠️ Redis not configured, skipping delete');
      return NextResponse.json({ success: true, warning: 'Redis not configured' });
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
