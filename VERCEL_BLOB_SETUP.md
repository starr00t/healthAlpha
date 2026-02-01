# Vercel Blob Storage 설정 가이드

## 📋 개요

사진/동영상을 Vercel Blob Storage에 저장하여 localStorage 용량 문제를 해결합니다.

**Vercel Blob 무료 티어:**
- 저장 공간: 1GB
- 대역폭: 10GB/월
- 비용: $0

**장점:**
- ✅ Base64 인코딩 불필요 → 크기 33% 절감
- ✅ Vercel 통합으로 설정 간단
- ✅ 환경 변수 자동 설정
- ✅ CDN 제공으로 빠른 로딩

## 🚀 설정 방법

### 1단계: Vercel Blob Storage 생성

1. https://vercel.com/dashboard 접속
2. Health Alpha 프로젝트 클릭
3. 상단 메뉴에서 **Storage** 클릭
4. **Create Database** 버튼 클릭
5. **Blob** 선택
6. Store Name: `healthalpha-files` 입력
7. **Create** 클릭

### 2단계: 프로젝트 연결

1. 생성된 Blob Storage에서 **Connect Project** 클릭
2. Health Alpha 프로젝트 선택
3. **Connect** 클릭
4. 환경 변수가 자동으로 추가됩니다:
   - `BLOB_READ_WRITE_TOKEN`

### 3단계: 자동 재배포

- Vercel이 자동으로 재배포합니다 (약 2-3분)
- 배포 완료 후 즉시 사용 가능

## ✅ 작동 방식

**기존 (localStorage + Base64):**
```
사진 업로드 → Base64 인코딩 (33% 증가) → localStorage 저장
문제: 1MB 사진 → 1.33MB, 브라우저 용량 제한
```

**개선 (Vercel Blob):**
```
사진 업로드 → Blob Storage 저장 → URL만 localStorage에 저장
장점: 1MB 사진 → URL은 100바이트, localStorage 절약
```

## 📊 용량 비교

**예시: 사진 3장 (각 1MB)**

### 기존 방식:
- Base64 인코딩: 3MB × 1.33 = **3.99MB**
- localStorage 사용량: 3.99MB

### Blob 방식:
- Blob Storage: 3MB
- localStorage 사용량: 300바이트 (URL만)
- **약 13,000배 절약!**

## 🎯 사용 예시

### 노트에 사진 추가:
1. 사진 선택
2. 자동으로 Blob에 업로드
3. URL만 노트에 저장
4. 화면에 표시 시 URL로 이미지 로드

### 데이터 삭제:
1. 노트 삭제
2. Blob의 사진도 자동 삭제
3. 불필요한 파일 정리

## 💰 비용 관리

### 무료 티어 한도:
- 저장: 1GB (약 1,000장의 1MB 사진)
- 대역폭: 10GB/월

### 유료 전환 시 ($0.15/GB):
- 저장: $0.15/GB/월
- 대역폭: $0.20/GB

### 예상 비용 (개인 사용):
- 월 50장 업로드 (각 500KB) = 25MB
- 연간 300MB 누적
- 비용: **무료 (1GB 이내)**

## 🔧 트러블슈팅

### "Upload failed" 에러:
- Blob Storage가 프로젝트에 연결되었는지 확인
- 환경 변수 `BLOB_READ_WRITE_TOKEN` 확인
- 재배포 완료되었는지 확인

### 사진이 로드되지 않음:
- Blob URL이 유효한지 확인
- 네트워크 연결 확인
- 브라우저 콘솔에서 에러 확인

### 용량 초과:
- Vercel 대시보드 → Storage → 사용량 확인
- 오래된 파일 삭제
- 또는 유료 플랜 전환

## 📚 참고 자료

- Vercel Blob 문서: https://vercel.com/docs/storage/vercel-blob
- 가격 정보: https://vercel.com/docs/storage/vercel-blob/usage-and-pricing
