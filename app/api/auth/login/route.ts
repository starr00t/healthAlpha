import { NextRequest, NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';
import crypto from 'crypto';

// 비밀번호 해싱
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

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

// POST /api/auth/login - 로그인
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      // Redis 미설정 시 localStorage 사용 안내
      return NextResponse.json(
        { 
          error: 'Database not configured',
          fallback: 'local' 
        },
        { status: 503 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await redis.get<User>(`user:${email}`);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 비밀번호 제외하고 반환
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
