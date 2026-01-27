import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// GET - 사용자 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const key = type ? `preferences:${email}:${type}` : `preferences:${email}`;
    const preferences = await redis.get(key);
    
    return NextResponse.json({ preferences: preferences || null });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST - 사용자 설정 저장
export async function POST(request: NextRequest) {
  try {
    const { email, type, data } = await request.json();
    
    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      );
    }

    const key = `preferences:${email}:${type}`;
    await redis.set(key, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Preferences POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

// DELETE - 사용자 설정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (type) {
      await redis.del(`preferences:${email}:${type}`);
    } else {
      // 모든 설정 삭제
      const keys = await redis.keys(`preferences:${email}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Preferences DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete preferences' },
      { status: 500 }
    );
  }
}
