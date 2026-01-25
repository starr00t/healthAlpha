# 🔒 OpenAI API 보안 가이드

## ⚠️ 중요: API 키 보안

### ❌ 절대 하지 말아야 할 것

```bash
# 위험! 클라이언트에 노출됨
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxx

# 결과:
# - 브라우저 개발자 도구에서 API 키 확인 가능
# - 누구나 복사해서 무단 사용 가능
# - 무제한 비용 청구 위험
# - 악의적인 사용자가 API 한도 소진
```

### ✅ 올바른 방법

```bash
# 안전! 서버 전용
OPENAI_API_KEY=sk-proj-xxxxx

# 결과:
# - API 키가 서버에서만 사용됨
# - 클라이언트 코드에 노출되지 않음
# - Next.js API Routes를 통해 안전하게 호출
# - Rate limiting 적용 가능
```

---

## 🏗️ 아키텍처

### 기존 방식 (위험)
```
브라우저 → OpenAI API
   ↑
 API 키 노출!
```

### 현재 방식 (안전)
```
브라우저 → Next.js API Route → OpenAI API
              ↑
          API 키 안전하게 보관
```

---

## 📁 파일 구조

```
healthAlpha/
├── .env.local              # 서버 환경 변수 (Git 제외)
│   └── OPENAI_API_KEY=sk-xxx
├── .env.local.example      # 예시 파일 (Git 포함 가능)
├── .gitignore              # .env.local 반드시 포함!
├── app/
│   └── api/
│       └── ai-advice/
│           └── route.ts    # 서버 측 API (API 키 사용)
├── lib/
│   └── aiHealthAdvisor.ts  # 클라이언트용 함수
└── components/
    └── AIHealthAdvisor.tsx # UI 컴포넌트
```

---

## 🔐 보안 체크리스트

### 개발 환경

- [ ] `.env.local` 파일 생성
- [ ] `OPENAI_API_KEY=sk-xxx` 설정 (NEXT_PUBLIC_ 없이!)
- [ ] `.gitignore`에 `.env.local` 포함 확인
- [ ] Git 히스토리에 API 키가 없는지 확인
- [ ] 서버 재시작 후 테스트

### 프로덕션 배포

**Vercel**
```bash
# Settings → Environment Variables
OPENAI_API_KEY=sk-proj-xxxxx
```

**Netlify**
```bash
# Site settings → Build & deploy → Environment
OPENAI_API_KEY=sk-proj-xxxxx
```

**기타 플랫폼**
- Railway: 환경 변수 탭에 추가
- Render: Environment 탭에 추가
- AWS/GCP: Secrets Manager 사용 권장

---

## 🛡️ 추가 보안 조치

### 1. Rate Limiting (권장)

```typescript
// app/api/ai-advice/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 15분당 최대 10회
  message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
});
```

### 2. 인증 추가 (권장)

```typescript
// 로그인한 사용자만 AI 조언 사용 가능
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }
  
  // ... AI 조언 로직
}
```

### 3. 비용 모니터링

```typescript
// 사용량 로깅
import { logApiUsage } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  const result = await callOpenAI(...);
  
  // 사용량 기록
  await logApiUsage({
    userId: session.userId,
    tokens: result.usage.total_tokens,
    cost: calculateCost(result.usage),
    timestamp: new Date(),
  });
  
  return NextResponse.json(result);
}
```

### 4. 사용 한도 설정

```typescript
// 사용자별 일일 한도
const DAILY_LIMIT = 20;

export async function POST(request: NextRequest) {
  const userId = session.userId;
  const today = new Date().toISOString().split('T')[0];
  const usageKey = `usage:${userId}:${today}`;
  
  const usage = await redis.get(usageKey) || 0;
  
  if (usage >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: '일일 사용 한도를 초과했습니다.' },
      { status: 429 }
    );
  }
  
  await redis.incr(usageKey);
  await redis.expire(usageKey, 86400); // 24시간
  
  // ... AI 조언 로직
}
```

---

## 🚨 사고 대응

### API 키가 노출되었다면?

1. **즉시 키 폐기**
   ```bash
   # OpenAI 대시보드 → API Keys → Revoke
   ```

2. **새 키 발급**
   ```bash
   # 새 API 키 생성
   # .env.local 업데이트
   # 프로덕션 환경 변수 업데이트
   ```

3. **비용 확인**
   ```bash
   # OpenAI 대시보드 → Usage
   # 예상치 못한 사용량 확인
   ```

4. **사용 한도 설정**
   ```bash
   # OpenAI 대시보드 → Billing → Usage limits
   # 월 최대 한도 설정 (예: $10)
   ```

---

## 💰 비용 관리

### OpenAI 대시보드 설정

```bash
# 1. 사용 한도 설정
Settings → Limits → Monthly budget: $10

# 2. 알림 설정
Settings → Notifications → Email alerts: ON

# 3. 사용량 모니터링
Usage → Daily/Monthly reports
```

### 예상 비용 계산

```
모델: gpt-4o-mini
입력: $0.00015 / 1K tokens
출력: $0.0006 / 1K tokens

1회 조언:
- 입력 500 tokens = $0.000075
- 출력 500 tokens = $0.0003
- 총: $0.000375

월 100명 × 10회 = 1,000회
총 비용: $0.375 (약 500원)

월 1,000명 × 10회 = 10,000회
총 비용: $3.75 (약 5,000원)
```

---

## 📊 모니터링

### 로깅 시스템

```typescript
// lib/logger.ts
export async function logAIRequest({
  userId,
  type,
  tokens,
  cost,
  success,
}: {
  userId: string;
  type: string;
  tokens: number;
  cost: number;
  success: boolean;
}) {
  // 데이터베이스에 기록
  await db.aiLogs.create({
    data: {
      userId,
      type,
      tokens,
      cost,
      success,
      timestamp: new Date(),
    },
  });
}
```

### 대시보드

```typescript
// app/admin/ai-analytics/page.tsx
export default function AIAnalytics() {
  const stats = useAIStats();
  
  return (
    <div>
      <h1>AI 사용 통계</h1>
      <div>총 요청: {stats.totalRequests}</div>
      <div>총 비용: ${stats.totalCost}</div>
      <div>평균 응답 시간: {stats.avgResponseTime}ms</div>
      <div>실패율: {stats.failureRate}%</div>
    </div>
  );
}
```

---

## 📚 참고 자료

- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Next.js API Routes Security](https://nextjs.org/docs/api-routes/introduction)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

## ✅ 최종 점검

배포 전 확인사항:

- [ ] API 키가 서버 환경 변수에만 있음
- [ ] 클라이언트 코드에 API 키 없음
- [ ] .env.local이 .gitignore에 포함됨
- [ ] Git 히스토리에 API 키 없음
- [ ] Rate limiting 구현됨
- [ ] 인증 시스템 적용됨
- [ ] 사용 한도 설정됨
- [ ] 비용 알림 설정됨
- [ ] 모니터링 시스템 작동 중

---

**문의사항이 있으시면 Issues 탭에 남겨주세요!**
