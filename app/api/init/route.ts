import { NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// GET /api/init - 초기 관리자 계정 생성
export async function GET() {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Redis not configured' },
        { status: 500 }
      );
    }

    const adminEmail = 'admin@health.com';
    const adminPassword = 'admin123';
    
    // 이미 존재하는지 확인
    const existing = await redis.get(`user:${adminEmail}`);
    if (existing) {
      return NextResponse.json({
        message: 'Admin user already exists',
        email: adminEmail,
      });
    }

    // 관리자 계정 생성
    const adminUser = {
      id: 'admin-001',
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      name: '관리자',
      createdAt: new Date().toISOString(),
      isAdmin: true,
      subscription: {
        tier: 'pro',
        status: 'active',
        startDate: new Date().toISOString(),
        aiRequestsUsed: 0,
        aiRequestsLimit: -1, // 무제한
      },
    };

    // Redis에 저장
    await redis.set(`user:${adminEmail}`, adminUser);
    await redis.sadd('users:all', adminEmail);

    return NextResponse.json({
      message: 'Admin user created successfully',
      email: adminEmail,
      password: adminPassword,
    });
  } catch (error: any) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
