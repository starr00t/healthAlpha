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

// GET /api/users - 모든 사용자 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // 관리자 권한 확인 (헤더에서)
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await redis.get<User>(`user:${adminEmail}`);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
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
