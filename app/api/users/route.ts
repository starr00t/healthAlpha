import { NextRequest, NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  isAdmin?: boolean;
  profile?: any;
  subscription?: any;
}

// 관리자 권한 확인 헬퍼
async function checkAdminAuth(request: NextRequest): Promise<{ isAdmin: boolean; adminEmail?: string; error?: string }> {
  const adminEmail = request.headers.get('x-admin-email');
  if (!adminEmail) {
    return { isAdmin: false, error: 'Unauthorized' };
  }

  const admin = await redis.get<User>(`user:${adminEmail}`);
  if (!admin || !admin.isAdmin) {
    return { isAdmin: false, error: 'Forbidden - Admin access required' };
  }

  return { isAdmin: true, adminEmail };
}

// GET /api/users - 모든 사용자 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const authCheck = await checkAdminAuth(request);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    // 모든 사용자 이메일 목록 가져오기
    const userEmails = await redis.smembers('users:all');
    
    // 각 사용자 정보 가져오기
    const users: any[] = [];
    for (const email of userEmails) {
      const user = await redis.get<User>(`user:${email}`);
      if (user) {
        const { passwordHash, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH /api/users - 사용자 정보 업데이트 (관리자 전용)
export async function PATCH(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const authCheck = await checkAdminAuth(request);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { userId, email, updates } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email required' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    let userKey: string;
    if (email) {
      userKey = `user:${email}`;
    } else {
      // userId로 사용자 찾기
      const userEmails = await redis.smembers('users:all');
      const foundEmail = await Promise.all(
        userEmails.map(async (e) => {
          const u = await redis.get<User>(`user:${e}`);
          return u?.id === userId ? e : null;
        })
      ).then(results => results.find(e => e !== null));

      if (!foundEmail) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      userKey = `user:${foundEmail}`;
    }

    const user = await redis.get<User>(userKey);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 사용자 정보 업데이트
    const updatedUser = {
      ...user,
      ...updates,
      // 특정 필드는 보호
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    };

    await redis.set(userKey, updatedUser);

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - 사용자 삭제 (관리자 전용)
export async function DELETE(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const authCheck = await checkAdminAuth(request);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email required' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    let userEmail: string | undefined;
    if (email) {
      userEmail = email;
    } else {
      // userId로 사용자 찾기
      const userEmails = await redis.smembers('users:all');
      const foundEmail = await Promise.all(
        userEmails.map(async (e) => {
          const u = await redis.get<User>(`user:${e}`);
          return u?.id === userId ? e : null;
        })
      ).then(results => results.find(e => e !== null));

      userEmail = foundEmail || undefined;
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = await redis.get<User>(`user:${userEmail}`);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 관리자 계정 삭제 방지
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin account' },
        { status: 403 }
      );
    }

    // 사용자 데이터 삭제
    await redis.del(`user:${userEmail}`);
    await redis.srem('users:all', userEmail);
    
    // 관련 데이터도 삭제
    await redis.del(`health:${userEmail}`);
    await redis.del(`calendar:${userEmail}`);
    await redis.del(`goals:${userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}