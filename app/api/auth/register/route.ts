import { NextRequest, NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';
import crypto from 'crypto';

// 비밀번호 해싱
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 사용자 타입
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

// POST /api/auth/register - 회원가입
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 이메일 중복 체크
    const existingUser = await redis.get<User>(`user:${email}`);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // 새 사용자 생성
    const userId = crypto.randomUUID();
    const newUser: User = {
      id: userId,
      email,
      passwordHash: hashPassword(password),
      name,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      subscription: {
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        aiRequestsUsed: 0,
        aiRequestsLimit: 10,
      },
    };

    // Redis에 저장
    await redis.set(`user:${email}`, newUser);
    await redis.sadd('users:all', email); // 모든 사용자 이메일 목록

    // 비밀번호 제외하고 반환
    const { passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
