# 🚀 Health Alpha - Vercel 배포 가이드

## 📋 배포 전 체크리스트

- [x] PWA 설정 완료
- [x] 아이콘 생성 완료
- [x] Manifest.json 생성
- [ ] GitHub 저장소 생성
- [ ] Vercel 계정 생성
- [ ] 환경 변수 설정

## 🌐 Vercel 배포 단계

### 1️⃣ GitHub 저장소 생성

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit: Health Alpha PWA"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/your-username/health-alpha.git
git branch -M main
git push -u origin main
```

### 2️⃣ Vercel 배포

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - "New Project" 클릭
   - GitHub 저장소 선택 (health-alpha)
   - Import

3. **프로젝트 설정**
   - Framework Preset: **Next.js** (자동 감지됨)
   - Root Directory: `./`
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)

4. **환경 변수 설정 (선택사항)**
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```
   > 💡 참고: OpenAI API 키는 나중에 관리자 패널에서도 설정 가능

5. **Deploy 버튼 클릭**
   - 약 1-2분 후 배포 완료
   - `https://your-project-name.vercel.app` URL 생성됨

### 3️⃣ 도메인 설정 (선택사항)

1. Vercel 프로젝트 → Settings → Domains
2. 커스텀 도메인 추가
   - 예: `healthalpha.com`
3. DNS 설정에 따라 CNAME 또는 A 레코드 추가

## 📱 PWA 기능 확인

배포 후 다음 기능을 테스트하세요:

### 모바일 (Chrome/Safari)

1. **홈 화면에 추가**
   - Chrome: 메뉴 → "홈 화면에 추가"
   - Safari: 공유 → "홈 화면에 추가"

2. **오프라인 테스트**
   - 앱 실행
   - 비행기 모드 활성화
   - 앱이 정상 작동하는지 확인

3. **Service Worker 확인**
   - Chrome DevTools → Application → Service Workers
   - 상태가 "activated and is running"인지 확인

## 🔐 환경 변수 관리

### Vercel Dashboard에서 설정

```
Project → Settings → Environment Variables
```

추가해야 할 변수:
- `OPENAI_API_KEY` (선택사항)
  - 값: `sk-...`
  - 환경: Production, Preview, Development

### 환경 변수 우선순위

1. Vercel 환경 변수 (우선)
2. 관리자 패널에서 설정한 API 키
3. 설정되지 않음 (무료 사용자 모드)

## 🔄 자동 배포

GitHub에 푸시할 때마다 자동으로 배포됩니다:

```bash
git add .
git commit -m "Update: 새로운 기능 추가"
git push
```

- **main 브랜치**: Production 배포
- **다른 브랜치**: Preview 배포 (테스트용 URL 생성)

## 🐛 배포 문제 해결

### 빌드 에러

```bash
# 로컬에서 빌드 테스트
npm run build
npm start
```

### 환경 변수 문제

1. Vercel Dashboard → Project → Settings → Environment Variables 확인
2. 변수 이름이 정확한지 확인 (대소문자 구분)
3. Redeploy 버튼 클릭

### PWA 작동 안 함

1. HTTPS 확인 (Vercel은 자동 HTTPS)
2. manifest.json 경로 확인
3. Service Worker 등록 확인
4. 브라우저 캐시 클리어

## 📊 모니터링

### Vercel Analytics (무료)

1. Project → Analytics
2. 페이지 뷰, 성능 등 확인

### 로그 확인

1. Project → Deployments
2. 최근 배포 클릭 → Logs

## 🎉 배포 완료!

축하합니다! Health Alpha가 배포되었습니다.

**다음 단계:**
1. ✅ 모바일에서 앱 설치 테스트
2. ✅ 관리자 계정 로그인 (admin@health.com / admin123)
3. ✅ OpenAI API 키 등록 (관리자 패널 → AI 설정)
4. ✅ 데이터 백업 기능 테스트
5. ✅ 친구/가족과 공유

**앱 URL:** `https://your-project.vercel.app`

## 🔗 유용한 링크

- [Vercel 문서](https://vercel.com/docs)
- [Next.js PWA 가이드](https://github.com/shadowwalker/next-pwa)
- [PWA 체크리스트](https://web.dev/pwa-checklist/)
