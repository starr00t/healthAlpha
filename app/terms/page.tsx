export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          이용약관 (Terms of Service)
        </h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. 서비스 소개
            </h2>
            <p>
              Health Alpha는 개인 건강 데이터를 기록하고 관리하며, 
              AI 기반 건강 조언을 제공하는 웹 애플리케이션입니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. 서비스 이용 조건
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>본 서비스는 무료로 제공됩니다</li>
              <li>만 14세 이상 사용자만 이용 가능합니다</li>
              <li>정확한 정보를 입력할 책임은 사용자에게 있습니다</li>
              <li>계정 정보 및 비밀번호 관리 책임은 사용자에게 있습니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. 의료 면책 조항
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                ⚠️ 중요 고지사항
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-yellow-800 dark:text-yellow-300">
                <li>Health Alpha는 의료 서비스가 아닙니다</li>
                <li>AI 건강 조언은 참고용이며, 의학적 진단이나 치료를 대체하지 않습니다</li>
                <li>건강 문제가 있는 경우 반드시 의사와 상담하세요</li>
                <li>응급 상황에서는 즉시 응급실을 방문하거나 119에 연락하세요</li>
                <li>서비스 이용으로 인한 건강 문제에 대해 책임지지 않습니다</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 사용자의 의무
            </h2>
            <p className="mb-2">사용자는 다음 행위를 해서는 안 됩니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>타인의 개인정보를 무단으로 수집하거나 사용</li>
              <li>서비스를 불법적인 목적으로 사용</li>
              <li>서비스의 정상적인 운영을 방해</li>
              <li>악성 코드나 바이러스 유포</li>
              <li>타인의 계정을 도용</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. 서비스 제공 및 중단
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스는 24시간 제공을 원칙으로 하나, 시스템 점검 등으로 일시 중단될 수 있습니다</li>
              <li>천재지변, 서버 장애 등 불가항력적 사유로 서비스가 중단될 수 있습니다</li>
              <li>서비스 개선을 위해 기능이 변경되거나 추가될 수 있습니다</li>
              <li>사전 공지 후 서비스를 종료할 수 있습니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Google Fit 연동
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Google Fit 연동은 선택사항입니다</li>
              <li>Google의 이용약관 및 개인정보 처리방침이 추가로 적용됩니다</li>
              <li>연동 해제는 언제든지 가능합니다</li>
              <li>Google Fit 서비스 중단 시 연동 기능도 중단될 수 있습니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. 데이터 소유권
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>사용자가 입력한 건강 데이터의 소유권은 사용자에게 있습니다</li>
              <li>사용자는 언제든지 데이터를 수정하거나 삭제할 수 있습니다</li>
              <li>서비스 종료 시 사용자 데이터는 안전하게 삭제됩니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. 지적 재산권
            </h2>
            <p>
              Health Alpha의 모든 콘텐츠, 디자인, 소스코드는 저작권법에 의해 보호됩니다. 
              무단 복제, 배포, 수정을 금지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. 책임의 제한
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스는 "있는 그대로" 제공되며, 특정 목적에의 적합성을 보증하지 않습니다</li>
              <li>서비스 이용으로 인한 직간접적 손해에 대해 책임지지 않습니다</li>
              <li>AI 조언의 정확성이나 완전성을 보장하지 않습니다</li>
              <li>데이터 손실에 대비하여 사용자 스스로 백업할 것을 권장합니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. 약관 변경
            </h2>
            <p>
              본 약관은 필요에 따라 변경될 수 있으며, 변경 시 앱 내에서 공지됩니다. 
              변경된 약관은 공지 후 7일 뒤부터 효력이 발생합니다.
            </p>
            <p className="mt-2">
              <strong>최종 업데이트:</strong> 2026년 1월 27일
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. 준거법 및 관할
            </h2>
            <p>
              본 약관은 대한민국 법률에 따라 해석되며, 
              서비스 이용과 관련된 분쟁은 대한민국 법원을 관할 법원으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. 문의하기
            </h2>
            <ul className="list-none space-y-2 ml-4">
              <li><strong>이메일:</strong> admin@health-alpha.app</li>
              <li><strong>서비스명:</strong> Health Alpha</li>
              <li><strong>웹사이트:</strong> https://health-alpha-nu.vercel.app</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            본 이용약관에 동의하지 않으시면 서비스 이용을 중단해 주시기 바랍니다.
            <br />
            서비스를 계속 사용하시는 경우 본 약관에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
