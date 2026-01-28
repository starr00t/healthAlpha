# Health Alpha - 건강 관리 앱

매일의 건강 데이터를 기록하고 분석하는 웹 애플리케이션입니다.

## 주요 기능

### 📊 건강 데이터 관리
- **일일 건강 데이터 기록**: 체중, 혈압(수축기/이완기/심박수), 혈당 수치 입력
- **트렌드 분석**: 시간에 따른 건강 지표 시각화
- **상세 통계**: 7/30/90/365일 기간별 평균, 최소, 최대값 분석
- **데이터 필터링**: 날짜 범위 및 데이터 유형별 필터링

### 🎯 목표 설정 & 알림
- **건강 목표 설정**: 체중, 혈압, 혈당 목표 설정 및 진행 상황 추적
- **알림 설정**: 요일별 시간 지정 알림으로 기록 리마인더
- **목표 달성 기한**: D-Day 카운터로 목표 관리

### 🔐 사용자 인증
- **회원가입/로그인**: 이메일 기반 계정 관리
- **유저별 데이터 분리**: 각 사용자의 독립적인 건강 데이터 관리
- **프로필 관리**: 사용자 정보 수정

### 🔧 관리자 기능
- **사용자 관리**: 전체 사용자 조회 및 관리
- **권한 관리**: 관리자 권한 부여/제거
- **통계 대시보드**: 전체 사용자 수, 관리자 수 등

### 💾 데이터 관리
- **로컬 스토리지**: 브라우저 기반 데이터 저장
- **데이터 내보내기/가져오기**: JSON 형식으로 백업
- **클립보드 복사 & 공유**: 간편한 데이터 공유

### 🌓 다크 모드
- **테마 전환**: 라이트/다크 모드 지원
- **자동 저장**: 사용자 선호도 저장

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## 기본 관리자 계정

```
이메일: admin@health.com
비밀번호: admin123
```

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS (다크모드 지원)
- **상태 관리**: Zustand (persist 미들웨어)
- **차트**: Recharts
- **날짜 처리**: date-fns

## 프로젝트 구조

```
healthAlpha/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── globals.css        # 글로벌 스타일
├── components/            # React 컴포넌트
│   ├── AuthForm.tsx       # 로그인/회원가입
│   ├── HealthRecordForm.tsx   # 데이터 입력 폼
│   ├── FilteredRecordsList.tsx # 필터링 가능한 기록 목록
│   ├── TrendChart.tsx     # 트렌드 차트
│   ├── DetailedStats.tsx  # 상세 통계
│   ├── GoalsManager.tsx   # 목표 관리
│   ├── RemindersManager.tsx # 알림 관리
│   ├── AdminPanel.tsx     # 관리자 패널
│   ├── ThemeToggle.tsx    # 다크모드 토글
│   └── ...
├── store/                 # Zustand 상태 관리
│   ├── authStore.ts       # 인증 상태
│   ├── healthStore.ts     # 건강 데이터
│   ├── goalsStore.ts      # 목표 & 알림
│   └── themeStore.ts      # 테마 설정
├── types/                 # TypeScript 타입 정의
│   ├── health.ts
│   ├── user.ts
│   └── goals.ts
└── utils/                 # 유틸리티 함수
    └── healthUtils.ts
```

## 기능 상세

### 건강 데이터 기록
- 체중: kg 단위로 소수점 첫째 자리까지 기록
- 혈압: 수축기/이완기 혈압 및 심박수(bpm)
- 혈당: mg/dL 단위
- 메모: 특이사항 기록

### 트렌드 분석
- 최근 30일 데이터 기반 차트
- 상승/하락/안정 트렌드 자동 계산
- 평균, 최소, 최대값 표시

### 건강 상태 평가
- 혈압: 정상(<120/80), 주의(<140/90), 위험(≥140/90)
- 혈당: 정상(<100), 주의(<126), 위험(≥126)

## 보안 참고사항

✅ **프로덕션 레벨 보안**
- ✅ bcryptjs를 사용한 비밀번호 해싱 (서버 측)
- ✅ Upstash Redis를 통한 서버 측 데이터 저장
- ✅ Vercel 환경 변수를 통한 민감 정보 보호
- ✅ OpenAI API 키 서버 측 보안 관리
- ✅ Redis 기반 Rate Limiting (AI API 남용 방지)
- ✅ 이메일/비밀번호 형식 검증 강화

⚠️ **추가 보안 권장사항**
- 프로덕션 환경에서는 HTTPS 필수 (Vercel 자동 제공)
- 정기적인 보안 업데이트 및 의존성 점검
- 사용자 데이터 백업 및 복구 계획 수립
- 자세한 보안 가이드는 [SECURITY.md](SECURITY.md) 참조

## 라이선스

MIT License

## 개발자

Health Alpha Team © 2026
