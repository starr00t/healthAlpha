# Health Alpha - Supabase 마이그레이션 가이드

## 📋 개요

localStorage 용량 제한(5-10MB)을 해결하기 위해 Supabase로 마이그레이션합니다.

**Supabase 무료 티어:**
- PostgreSQL 데이터베이스: 500MB
- Storage (파일): 1GB
- 대역폭: 5GB/월
- 월간 활성 사용자: 50,000명

## 🚀 1단계: Supabase 프로젝트 생성

### 1-1. Supabase 회원가입
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 1-2. 새 프로젝트 생성
1. "New Project" 클릭
2. 설정:
   - **Name:** `healthalpha`
   - **Database Password:** 강력한 비밀번호 생성 (저장 필수!)
   - **Region:** `Northeast Asia (Seoul)` 선택
   - **Pricing Plan:** `Free` 선택
3. "Create new project" 클릭 (약 2분 소요)

### 1-3. API 키 확인
프로젝트 생성 완료 후:
1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보 복사 (나중에 사용):
   - `Project URL`
   - `anon public` (공개 키)
   - `service_role` (비밀 키, 서버에서만 사용)

## 🗄️ 2단계: 데이터베이스 테이블 생성

### 2-1. SQL Editor 열기
1. 좌측 메뉴에서 **SQL Editor** 클릭
2. "New query" 클릭

### 2-2. 테이블 생성 SQL 실행
`schema.sql` 파일의 SQL을 복사하여 실행 (다음 단계에서 생성)

## 💾 3단계: Storage 버킷 생성

### 3-1. Storage 메뉴 열기
1. 좌측 메뉴에서 **Storage** 클릭
2. "Create a new bucket" 클릭

### 3-2. 버킷 생성
다음 3개 버킷 생성:
- **health-photos** (Public)
- **health-videos** (Public)
- **note-photos** (Public)

각 버킷 생성 시:
- Bucket name 입력
- Public bucket: ✅ 체크
- "Create bucket" 클릭

### 3-3. 버킷 정책 설정
`storage-policies.sql` 파일의 SQL을 실행하여 권한 설정

## 🔧 4단계: Vercel 환경 변수 설정

### 4-1. Vercel 대시보드 접속
https://vercel.com/dashboard → Health Alpha 프로젝트 선택

### 4-2. 환경 변수 추가
**Settings** → **Environment Variables** → **Add**

추가할 변수:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- Environment: `Production`, `Preview`, `Development` 모두 선택
- "Save" 클릭

### 4-3. 재배포
환경 변수 저장 후 자동으로 재배포됩니다 (약 2-3분)

## ✅ 5단계: 마이그레이션 확인

1. 배포 완료 후 사이트 접속
2. 새 계정 생성
3. 데이터 입력 테스트:
   - 건강 기록 추가
   - 노트 작성 (사진 포함)
   - 다이어리 작성

4. Supabase 대시보드에서 확인:
   - **Table Editor**: 데이터가 저장되었는지 확인
   - **Storage**: 사진이 업로드되었는지 확인

## 🔄 6단계: 기존 데이터 마이그레이션 (선택사항)

기존 localStorage 데이터를 Supabase로 이전하려면:
1. 개발자도구 → Application → Local Storage
2. 데이터 복사
3. 새 계정에서 수동으로 재입력

또는 마이그레이션 스크립트 실행 (별도 제공)

## 💡 팁

**무료 티어 한도 관리:**
- 사진 크기: 2MB 이하 권장
- 총 저장 공간: 1.5GB (DB 500MB + Storage 1GB)
- 오래된 데이터 주기적 정리

**유료 전환 시기:**
- Pro 플랜: $25/월
- DB: 8GB, Storage: 100GB
- 무료 한도 도달 시 고려

## 📚 참고 자료

- Supabase 공식 문서: https://supabase.com/docs
- Next.js + Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
