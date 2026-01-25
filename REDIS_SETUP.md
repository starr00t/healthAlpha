# Health Alpha - Upstash Redis Setup Guide

## 🚀 Vercel에서 Upstash Redis 설정하기

### 1. Vercel 프로젝트 대시보드 이동
https://vercel.com/dashboard → 프로젝트 선택

### 2. Storage 탭 선택
- 상단 메뉴에서 "Storage" 클릭
- "Create Database" 버튼 클릭

### 3. Upstash Redis 선택
- "KV (Redis)" 선택
- "Continue" 클릭

### 4. 데이터베이스 생성
- Database Name: `healthalpha-db` (또는 원하는 이름)
- Region: 가까운 지역 선택 (예: Seoul)
- "Create" 버튼 클릭

### 5. 프로젝트에 연결
- 생성된 데이터베이스에서 "Connect Project" 클릭
- Health Alpha 프로젝트 선택
- "Connect" 클릭

### 6. 자동 배포
- Vercel이 자동으로 환경 변수를 설정하고 재배포합니다
- 환경 변수:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### 7. 완료!
- 약 1-2분 후 재배포 완료
- 이제 모든 사용자가 Redis에서 중앙 관리됩니다

## ✅ 확인 방법

1. 새로운 브라우저에서 회원가입
2. 관리자 계정으로 로그인
3. 관리자 패널 → 사용자 관리
4. 새로 가입한 사용자가 목록에 표시됨!

## 🔄 데이터 마이그레이션

기존 localStorage 사용자는 자동으로 폴백됩니다.
새로 가입하는 사용자부터 Redis에 저장됩니다.

## 💰 비용

Upstash Redis 무료 티어:
- 10,000 commands/day
- 256 MB storage
- 개인 프로젝트에 충분!

## 📚 참고 링크

- Upstash Redis: https://upstash.com/
- Vercel Storage: https://vercel.com/docs/storage/vercel-kv
