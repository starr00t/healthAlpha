export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          개인정보 처리방침 (Privacy Policy)
        </h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. 수집하는 정보
            </h2>
            <p className="mb-2">Health Alpha는 다음과 같은 정보를 수집합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>계정 정보:</strong> 이메일 주소, 이름</li>
              <li><strong>건강 데이터:</strong> 체중, 혈압, 혈당, 걸음 수, 운동 시간, 칼로리</li>
              <li><strong>Google Fit 데이터:</strong> 걸음 수 (사용자가 Google Fit 연결을 선택한 경우)</li>
              <li><strong>사용 데이터:</strong> 앱 사용 기록, 목표 설정, 일정 관리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. 정보 사용 목적
            </h2>
            <p className="mb-2">수집된 정보는 다음의 목적으로만 사용됩니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>건강 데이터 기록 및 시각화</li>
              <li>AI 기반 건강 조언 제공</li>
              <li>목표 설정 및 진행률 추적</li>
              <li>Google Fit과의 걸음 수 동기화</li>
              <li>서비스 개선 및 사용자 경험 향상</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Google Fit API 사용
            </h2>
            <p className="mb-2">
              Health Alpha는 Google Fit API를 사용하여 걸음 수 데이터를 가져옵니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>요청 권한:</strong> 활동 데이터 읽기 (fitness.activity.read)</li>
              <li><strong>수집 데이터:</strong> 일일 걸음 수만 수집</li>
              <li><strong>사용 범위:</strong> 걸음 수 자동 입력 및 기록 관리에만 사용</li>
              <li><strong>제3자 공유:</strong> Google Fit 데이터는 제3자와 공유되지 않습니다</li>
              <li><strong>연결 해제:</strong> 언제든지 Google Fit 연결을 해제할 수 있습니다</li>
            </ul>
            <p className="mt-4 text-sm">
              Google API Services User Data Policy에 대한 자세한 내용은{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                여기
              </a>
              에서 확인하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 데이터 저장 및 보안
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>저장 위치:</strong> 브라우저 로컬 스토리지 (사용자 기기에만 저장)</li>
              <li><strong>서버 저장:</strong> 일부 데이터는 Vercel 서버 및 Upstash Redis에 암호화되어 저장</li>
              <li><strong>보안:</strong> HTTPS 암호화 통신 사용</li>
              <li><strong>접근 제한:</strong> 사용자 본인만 자신의 데이터에 접근 가능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. 데이터 공유
            </h2>
            <p className="mb-2">
              Health Alpha는 사용자의 개인정보를 제3자와 공유하지 않습니다. 단, 다음의 경우는 예외입니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>사용자의 명시적 동의가 있는 경우</li>
              <li>법적 요구사항이 있는 경우</li>
              <li>OpenAI API를 통한 AI 건강 조언 생성 (익명화된 건강 데이터만 전송)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. 데이터 보관 기간
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>건강 기록:</strong> 사용자가 삭제하기 전까지 보관</li>
              <li><strong>Google Fit 토큰:</strong> 연결 해제 시 즉시 삭제</li>
              <li><strong>계정 정보:</strong> 로그아웃 시 로컬 데이터 삭제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. 사용자 권리
            </h2>
            <p className="mb-2">사용자는 다음과 같은 권리를 가집니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>열람:</strong> 자신의 모든 데이터를 앱에서 확인</li>
              <li><strong>수정:</strong> 건강 기록 수정 및 업데이트</li>
              <li><strong>삭제:</strong> 개별 기록 또는 전체 데이터 삭제</li>
              <li><strong>철회:</strong> Google Fit 연결 해제</li>
              <li><strong>내보내기:</strong> 데이터 다운로드 (향후 지원 예정)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. 쿠키 및 추적 기술
            </h2>
            <p>
              Health Alpha는 필수적인 로컬 스토리지만 사용하며, 
              추적 쿠키나 분석 도구를 사용하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. 어린이 개인정보 보호
            </h2>
            <p>
              Health Alpha는 만 14세 미만 어린이를 대상으로 하지 않으며, 
              의도적으로 어린이의 개인정보를 수집하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. 개인정보 처리방침 변경
            </h2>
            <p>
              본 개인정보 처리방침은 필요에 따라 변경될 수 있습니다. 
              중요한 변경사항이 있을 경우 앱 내에서 공지합니다.
            </p>
            <p className="mt-2">
              <strong>최종 업데이트:</strong> 2026년 1월 27일
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. 문의하기
            </h2>
            <p className="mb-2">
              개인정보 처리방침에 대한 질문이나 우려사항이 있으시면 연락해 주세요:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li><strong>이메일:</strong> godstarr00t@gmail.com</li>
              <li><strong>서비스명:</strong> Health Alpha</li>
              <li><strong>웹사이트:</strong> https://health-alpha-nu.vercel.app</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            이 개인정보 처리방침은 Health Alpha 서비스 이용에 적용됩니다.
            <br />
            서비스를 사용함으로써 본 방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
