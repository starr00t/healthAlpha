import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 생성
// Vercel 환경 변수에서 자동으로 읽어옴
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Redis가 설정되어 있는지 확인
export const isRedisConfigured = () => {
  return !!(
    (process.env.UPSTASH_REDIS_REST_KV_REST_API_URL && process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
};
