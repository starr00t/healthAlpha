import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// DELETE /api/auth/delete - 회원 탈퇴
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Redis에서 사용자 데이터 조회
    const userDataStr = await redis.get(`user:${userId}`);
    
    if (!userDataStr) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = JSON.parse(userDataStr);

    // 이메일로 사용자 ID 매핑 삭제
    await redis.del(`email:${userData.email}`);

    // 사용자 데이터 삭제
    await redis.del(`user:${userId}`);

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
