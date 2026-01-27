import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// GET - 노트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const notes = await redis.get(`notes:${email}`);
    
    return NextResponse.json({
      notes: notes || []
    });
  } catch (error) {
    console.error('Notes GET error:', error);
    return NextResponse.json(
      { notes: [] },
      { status: 200 }
    );
  }
}

// POST - 노트 저장
export async function POST(request: NextRequest) {
  try {
    const { email, notes } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await redis.set(`notes:${email}`, notes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notes POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save notes' },
      { status: 500 }
    );
  }
}
