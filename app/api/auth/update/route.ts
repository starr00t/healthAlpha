import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import bcrypt from 'bcryptjs';

// PATCH /api/auth/update - 계정 정보 수정
export async function PATCH(request: NextRequest) {
  try {
    const { userId, name, currentPassword, newPassword } = await request.json();

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

    // 이름 변경
    if (name && name !== userData.name) {
      if (name.length < 2) {
        return NextResponse.json(
          { error: '이름은 2자 이상이어야 합니다.' },
          { status: 400 }
        );
      }
      userData.name = name;
    }

    // 비밀번호 변경
    if (currentPassword && newPassword) {
      // 현재 비밀번호 확인
      const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: '현재 비밀번호가 일치하지 않습니다.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: '새 비밀번호는 6자 이상이어야 합니다.' },
          { status: 400 }
        );
      }

      // 새 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userData.password = hashedPassword;
    }

    // 업데이트된 데이터 저장
    await redis.set(`user:${userId}`, JSON.stringify(userData));

    // 비밀번호 제외하고 반환
    const { password, ...userWithoutPassword } = userData;

    return NextResponse.json(
      { 
        message: 'Account updated successfully',
        user: userWithoutPassword
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
