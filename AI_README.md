# Health Alpha - AI 건강 조언 기능

## 🤖 AI 건강 조언 시스템

Health Alpha는 OpenAI GPT를 활용하여 개인 맞춤형 건강 조언을 제공합니다.

### 주요 기능

1. **자동 건강 분석**
   - 최근 7일간의 건강 데이터 분석
   - 체중, 혈압, 혈당 각각에 대한 맞춤 조언
   - 종합 건강 상태 평가

2. **AI 챗봇**
   - 건강 관련 질문에 실시간 답변
   - 사용자 프로필 기반 맞춤 조언
   - 한국어 자연어 처리

3. **우선순위 기반 알림**
   - 긴급(urgent): 즉시 조치 필요
   - 높음(high): 빠른 시일 내 조치 권장
   - 보통(medium): 일반적인 건강 조언
   - 낮음(low): 참고사항

### 설정 방법

#### 1. OpenAI API 키 발급

```bash
# OpenAI 웹사이트 방문
https://platform.openai.com/api-keys

# API 키 생성 후 복사
```

#### 2. 환경 변수 설정

```bash
# 프로젝트 루트에 .env.local 파일 생성
cp .env.local.example .env.local

# API 키 입력
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

#### 3. 서버 재시작

```bash
npm run dev
```

### 비용 안내

OpenAI API는 사용량 기반 과금입니다.

**권장 모델: gpt-4o-mini**
- 입력: $0.00015 / 1K tokens
- 출력: $0.0006 / 1K tokens
- 한 번의 조언 요청: 약 500-1000 tokens
- 월 100회 사용 시: 약 $0.05-0.10

**대안 모델:**
- `gpt-3.5-turbo`: 더 저렴 (정확도 약간 낮음)
- `gpt-4o`: 더 정확 (비용 높음)

### 사용 예시

#### 자동 분석

```typescript
import { analyzeHealthData } from '@/lib/aiHealthAdvisor';

const analysis = await analyzeHealthData(healthRecords, userProfile);
// analysis.overallAnalysis: 종합 건강 조언
// analysis.weightAnalysis: 체중 관리 조언
// analysis.bloodPressureAnalysis: 혈압 관리 조언
// analysis.bloodSugarAnalysis: 혈당 관리 조언
```

#### 맞춤 질문

```typescript
import { getAIHealthAdvice } from '@/lib/aiHealthAdvisor';

const advice = await getAIHealthAdvice({
  context: {
    userProfile,
    recentRecords,
  },
  question: "체중 감량을 위한 운동 추천해주세요",
  type: 'weight'
});
```

### 프라이버시 및 보안

- **데이터 처리**: OpenAI API로 전송되는 데이터는 익명화됩니다
- **개인정보 제외**: 이름, 이메일 등 식별 정보는 전송하지 않습니다
- **일시적 처리**: API 요청은 실시간으로 처리되며 저장되지 않습니다
- **API 키 보안**: `.env.local` 파일은 절대 공개 저장소에 커밋하지 마세요

### API 키 없이 사용

API 키를 설정하지 않으면 **기본 조언 시스템**이 작동합니다:
- 일반적인 건강 관리 조언 제공
- 규칙 기반 권장사항 제공
- 무료로 사용 가능
- AI 기반보다 정확도는 낮음

### 문제 해결

**API 키 오류**
```
Error: OpenAI API error: Unauthorized
→ API 키가 올바른지 확인하세요
→ .env.local 파일이 프로젝트 루트에 있는지 확인
```

**비용 초과**
```
Error: You exceeded your current quota
→ OpenAI 대시보드에서 사용량 확인
→ 결제 수단 추가 또는 한도 증가
```

**느린 응답**
```
→ gpt-4o-mini 모델 사용 권장
→ 네트워크 연결 확인
→ 동시 요청 수 제한
```

### 주의사항

⚠️ **의학적 면책**
- AI 조언은 일반적인 건강 정보 제공 목적입니다
- 의학적 진단이나 처방을 대체하지 않습니다
- 심각한 증상이 있다면 반드시 전문의와 상담하세요

⚠️ **데이터 정확성**
- AI는 입력된 데이터를 기반으로 조언합니다
- 정확한 건강 기록 입력이 중요합니다
- 기저질환과 알레르기 정보를 정확히 입력하세요

### 향후 계획

- [ ] GPT-4o 모델 지원
- [ ] 대화 히스토리 저장
- [ ] 음성 입력 지원
- [ ] 다국어 지원
- [ ] 건강 리포트 자동 생성
- [ ] 의료 논문 기반 조언
- [ ] 개인화된 식단 추천
- [ ] 운동 계획 자동 생성

---

**라이선스**: MIT
**문의**: issues 탭에 남겨주세요
