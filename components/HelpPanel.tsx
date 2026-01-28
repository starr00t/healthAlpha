'use client';

import { useState } from 'react';

export default function HelpPanel() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const helpSections = [
    {
      id: 'overview',
      title: '📋 앱 개요',
      icon: '🏥',
      content: [
        {
          subtitle: 'Health Alpha란?',
          text: '일상의 건강 데이터를 체계적으로 기록하고 관리하는 PWA(Progressive Web App)입니다. 혈압, 체중, 혈당 등을 추적하고 AI가 맞춤형 건강 조언을 제공합니다.',
        },
        {
          subtitle: '주요 특징',
          items: [
            '📱 모바일/데스크톱 모두 지원 (PWA)',
            '🔒 안전한 사용자 인증 및 데이터 보호',
            '🌙 다크모드 지원',
            '📊 실시간 통계 및 트렌드 분석',
            '🤖 AI 기반 건강 조언',
            '💾 데이터 백업 및 복원',
          ],
        },
      ],
    },
    {
      id: 'home',
      title: '🏠 홈 대시보드',
      icon: '📊',
      content: [
        {
          subtitle: '맞춤형 대시보드',
          text: '홈 화면에서 오늘의 건강 현황, 목표 진행률, 일정, AI 조언을 한눈에 확인할 수 있습니다.',
        },
        {
          subtitle: '제공 정보',
          items: [
            '📊 오늘의 건강 현황: 체중, 혈압, 혈당, 체온 최신 기록',
            '🎯 목표 진행률: 설정한 건강 목표 달성 현황',
            '📅 오늘의 일정: 병원 예약, 운동 계획 등',
            '🤖 AI 건강 조언: 가장 최근 종합 분석 결과',
            '📈 주간 트렌드: 최근 7일간 건강 데이터 변화',
          ],
        },
        {
          subtitle: '위젯 커스터마이징',
          items: [
            '⚙️ 설정 버튼: 위젯 표시/숨김 및 순서 조정',
            '🔄 드래그 앤 드롭: 위젯 순서 자유롭게 변경',
            '👁️ 표시/숨김: 필요한 위젯만 선택적으로 표시',
            '💾 자동 저장: 레이아웃 설정 자동 저장',
          ],
        },
        {
          subtitle: '빠른 액션',
          items: [
            '➕ 빠른 기록: 위젯에서 바로 건강 데이터 입력',
            '📋 상세 보기: 위젯 클릭으로 상세 페이지 이동',
            '🔄 실시간 업데이트: 데이터 변경 시 즉시 반영',
          ],
        },
      ],
    },
    {
      id: 'record',
      title: '📝 기록 입력',
      icon: '✍️',
      content: [
        {
          subtitle: '건강 기록 입력',
          text: '혈압(수축기/이완기), 체중, 혈당, 체온을 날짜와 시간을 지정하여 기록할 수 있습니다.',
        },
        {
          subtitle: '사용 방법',
          items: [
            '1. "기록 입력" 탭 선택',
            '2. 측정한 건강 데이터 입력 (최소 1개 이상)',
            '3. 날짜/시간 설정 (기본값: 현재)',
            '4. 메모 추가 (선택사항)',
            '5. "기록 추가" 버튼 클릭',
          ],
        },
        {
          subtitle: '팁',
          items: [
            '💡 정기적인 측정 시간을 정하면 더 정확한 분석 가능',
            '💡 메모에 컨디션이나 특이사항을 기록하세요',
            '💡 기록 후 바로 트렌드 그래프에서 확인 가능',
          ],
        },
      ],
    },
    {
      id: 'calendar',
      title: '📅 캘린더',
      icon: '🗓️',
      content: [
        {
          subtitle: '캘린더 기능',
          text: '날짜별로 건강 기록, 일정, 일기, 노트를 한눈에 확인하고 관리할 수 있습니다.',
        },
        {
          subtitle: '사용 방법',
          items: [
            '📆 월간 캘린더: 날짜별 기록 현황 확인',
            '📅 주간 캘린더: 주간 일정 상세 보기',
            '🔍 날짜 클릭: 해당 날짜의 상세 기록 보기',
            '✏️ 기록 편집: 과거 데이터 수정 및 삭제',
            '➕ 빠른 추가: 건강 기록, 일정, 일기, 노트 등록',
          ],
        },
        {
          subtitle: '추가 가능한 항목',
          items: [
            '📊 건강 기록: 체중, 혈압, 혈당, 체온',
            '🏥 일정: 병원 예약, 운동 계획, 약 복용',
            '📝 일기: 기분, 식사, 운동, 증상 기록',
            '📌 노트: 일반 메모, 생활 기록, 카테고리별 관리',
          ],
        },
        {
          subtitle: '노트 기능',
          items: [
            '🏷️ 카테고리: 건강, 운동, 식단, 약물, 증상, 생활, 메모',
            '📝 상세 내용: 제목과 본문으로 기록',
            '🔍 검색: 통합 검색으로 노트 빠르게 찾기',
            '✏️ 수정/삭제: 언제든지 노트 편집 가능',
          ],
        },
        {
          subtitle: '색상 표시',
          items: [
            '🟢 녹색: 건강 상태 양호한 날',
            '🟡 노란색: 주의 필요한 날',
            '🔴 빨간색: 위험 수치 기록된 날',
            '📍 점 표시: 건강 기록, 일정, 일기, 노트 표시',
          ],
        },
        {
          subtitle: '월간 통계',
          items: [
            '📊 기록 횟수: 이번 달 총 기록 수',
            '🔥 연속 기록: 연속으로 기록한 일수',
            '📈 평균값: 체중, 혈압, 혈당 월간 평균',
          ],
        },
      ],
    },
    {
      id: 'trends',
      title: '📊 트렌드 분석',
      icon: '📈',
      content: [
        {
          subtitle: '시각화 차트',
          text: '시간에 따른 건강 데이터 변화를 그래프로 확인할 수 있습니다.',
        },
        {
          subtitle: '지원 차트',
          items: [
            '💉 혈압 차트: 수축기/이완기 혈압 추이',
            '⚖️ 체중 차트: 체중 변화 추이',
            '🍬 혈당 차트: 혈당 수치 변화',
            '🌡️ 체온 차트: 체온 기록',
          ],
        },
        {
          subtitle: '기간 필터',
          items: [
            '📅 7일: 최근 일주일',
            '📅 30일: 최근 한 달',
            '📅 90일: 최근 3개월',
            '📅 전체: 모든 기록',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '📈 상세 통계',
      icon: '📊',
      content: [
        {
          subtitle: '통계 분석',
          text: '건강 데이터의 평균, 최고, 최저값 등 상세한 통계를 제공합니다.',
        },
        {
          subtitle: '제공 정보',
          items: [
            '📊 평균값: 기간별 평균 계산',
            '📈 최고/최저: 최고값과 최저값 표시',
            '📉 변화율: 이전 기간 대비 변화',
            '🎯 목표 달성률: 설정한 목표와 비교',
            '📅 기록 빈도: 측정 횟수 및 패턴',
          ],
        },
        {
          subtitle: '기록 목록',
          items: [
            '📋 전체 기록 확인',
            '✏️ 기록 수정/삭제',
            '🔍 검색 및 필터링',
            '📥 선택 항목 내보내기',
          ],
        },
      ],
    },
    {
      id: 'goals',
      title: '🎯 목표 & 알림',
      icon: '⏰',
      content: [
        {
          subtitle: '목표 설정',
          text: '건강 목표를 설정하고 달성 현황을 추적할 수 있습니다.',
        },
        {
          subtitle: '목표 관리',
          items: [
            '🎯 목표 등록: 체중, 혈압 등 구체적 목표 설정',
            '📊 진행률: 목표 달성률 실시간 확인',
            '✅ 완료 표시: 달성한 목표 체크',
            '🗑️ 목표 삭제: 불필요한 목표 제거',
          ],
        },
        {
          subtitle: '알림 설정',
          items: [
            '⏰ 측정 알림: 정기적인 건강 체크 리마인더',
            '💊 약 복용: 약 먹을 시간 알림',
            '🏥 병원 예약: 진료일 미리 알림',
            '🏃 운동 시간: 운동 스케줄 알림',
          ],
        },
      ],
    },
    {
      id: 'manage',
      title: '⚙️ 데이터 관리',
      icon: '💾',
      content: [
        {
          subtitle: '백업 & 복원',
          text: '모든 건강 데이터를 안전하게 백업하고 필요시 복원할 수 있습니다.',
        },
        {
          subtitle: '기능',
          items: [
            '💾 백업: JSON 파일로 전체 데이터 저장',
            '📥 복원: 백업 파일에서 데이터 불러오기',
            '🔄 병합: 기존 데이터와 백업 데이터 통합',
            '🗑️ 전체 삭제: 모든 데이터 초기화 (주의!)',
          ],
        },
        {
          subtitle: '검색 기능',
          items: [
            '🔍 통합 검색: 건강 기록, 일정, 일기 통합 검색',
            '📅 날짜 필터: 특정 기간 데이터만 조회',
            '🏷️ 키워드: 메모 내용으로 검색',
            '📊 필터링: 조건별 데이터 필터',
          ],
        },
      ],
    },
    {
      id: 'settings',
      title: '⚙️ 설정',
      icon: '⚙️',
      content: [
        {
          subtitle: '사용자 설정',
          text: '프로필, 계정, 데이터 동기화 등 모든 설정을 한 곳에서 관리할 수 있습니다.',
        },
        {
          subtitle: '프로필 설정',
          items: [
            '👤 기본 정보: 성별, 생년월일(자동 나이 계산), 키, 체형, 거주 지역',
            '🎯 건강 목표: 목표 체중/혈압 설정',
            '🏥 건강 정보: 기저질환, 알레르기 태그 관리',
            '📊 BMI 자동 계산: 최근 체중 데이터 기반 실시간 계산',
            '☁️ 데이터 동기화: 클라우드 백업 및 다기기 동기화',
          ],
        },
        {
          subtitle: '계정 관리',
          items: [
            '📧 이메일: 계정 이메일 확인',
            '👤 이름 변경: 사용자 이름 수정',
            '🔐 비밀번호 변경: 보안 강화',
            '🗑️ 계정 삭제: 모든 데이터와 함께 계정 영구 삭제',
          ],
        },
        {
          subtitle: '약관 및 정책',
          items: [
            '📜 이용약관 확인',
            '🔒 개인정보처리방침 확인',
          ],
        },
      ],
    },
    {
      id: 'ai',
      title: '🤖 AI 건강 조언',
      icon: '🧠',
      content: [
        {
          subtitle: 'AI 분석',
          text: 'OpenAI GPT 모델이 건강 데이터를 분석하여 개인 맞춤형 조언을 제공합니다.',
        },
        {
          subtitle: '제공 서비스',
          items: [
            '📊 데이터 분석: 최근 건강 기록 종합 분석',
            '💡 맞춤 조언: 개인 프로필 기반 건강 팁',
            '⚠️ 위험 경고: 이상 수치 감지 및 알림',
            '🎯 목표 제안: 실현 가능한 건강 목표',
            '🏥 병원 방문: 필요시 전문의 상담 권장',
          ],
        },
        {
          subtitle: '사용 방법',
          items: [
            '1. "AI 조언" 탭 선택',
            '2. "AI 조언 받기" 버튼 클릭',
            '3. 최근 30일 데이터 자동 분석',
            '4. 개인화된 건강 조언 확인',
            '5. 조언 저장 및 재확인 가능',
          ],
        },
      ],
    },
    {
      id: 'admin',
      title: '🔧 관리자 기능',
      icon: '👨‍💼',
      content: [
        {
          subtitle: '사용자 관리',
          text: '관리자는 전체 사용자를 관리하고 시스템을 모니터링할 수 있습니다.',
        },
        {
          subtitle: '관리 기능',
          items: [
            '👥 사용자 목록: 전체 사용자 조회',
            '🔐 권한 관리: 관리자 권한 부여/해제',
            '📊 통계 조회: 사용자별 데이터 현황',
            '🗑️ 계정 삭제: 사용자 계정 제거',
            '⚙️ 시스템 설정: 앱 전역 설정',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: '💡 유용한 팁',
      icon: '🌟',
      content: [
        {
          subtitle: '효과적인 사용법',
          items: [
            '📅 매일 같은 시간에 측정하세요 (아침 기상 직후 추천)',
            '📝 메모 기능을 활용하여 컨디션을 기록하세요',
            '🎯 현실적인 목표를 설정하고 단계적으로 달성하세요',
            '📊 주기적으로 통계를 확인하여 변화를 관찰하세요',
            '💾 정기적으로 데이터를 백업하세요',
            '🤖 AI 조언을 참고하되 전문의 상담도 병행하세요',
          ],
        },
        {
          subtitle: 'PWA 앱으로 설치',
          items: [
            '📱 모바일: 브라우저 메뉴 → "홈 화면에 추가"',
            '💻 데스크톱: 주소창 우측 설치 아이콘 클릭',
            '🚀 오프라인에서도 기록 가능',
            '⚡ 앱처럼 빠르고 편리하게 사용',
          ],
        },
        {
          subtitle: '건강 측정 가이드',
          items: [
            '💉 혈압: 5분 휴식 후 앉은 자세에서 측정',
            '⚖️ 체중: 아침 공복, 화장실 후 측정',
            '🍬 혈당: 공복 8시간 이후 또는 식후 2시간',
            '🌡️ 체온: 겨드랑이 또는 귀로 측정',
          ],
        },
      ],
    },
    {
      id: 'support',
      title: '❓ 도움말 & 지원',
      icon: '🆘',
      content: [
        {
          subtitle: '자주 묻는 질문',
          items: [
            'Q: 데이터는 어디에 저장되나요?',
            'A: 현재 브라우저 로컬 스토리지에 저장됩니다. 백업 기능을 사용하세요.',
            '',
            'Q: 다른 기기에서도 사용할 수 있나요?',
            'A: 같은 계정으로 로그인하면 가능합니다. 데이터 백업/복원을 활용하세요.',
            '',
            'Q: AI 조언이 안 나와요.',
            'A: OpenAI API 키가 설정되어 있는지 관리자에게 문의하세요.',
            '',
            'Q: 기록을 삭제했는데 복구할 수 있나요?',
            'A: 백업 파일이 있다면 복원 가능합니다. 정기적인 백업을 권장합니다.',
          ],
        },
        {
          subtitle: '주의사항',
          items: [
            '⚠️ 본 앱은 건강 관리 보조 도구이며 의료 진단을 대체할 수 없습니다',
            '⚠️ 이상 수치 발견 시 반드시 전문의와 상담하세요',
            '⚠️ 정기적인 건강검진을 받으세요',
            '⚠️ 데이터 백업을 습관화하세요',
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
          <span className="text-4xl">📖</span>
          도움말 & 사용 가이드
        </h2>
        <p className="text-primary-100 text-lg">
          Health Alpha의 모든 기능을 효과적으로 활용하는 방법을 안내합니다
        </p>
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          빠른 시작 가이드
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">프로필 설정</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">"설정" 탭의 "프로필 설정"에서 기본 정보와 건강 정보를 입력하세요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">첫 기록 입력</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">"기록 입력" 탭에서 혈압, 체중 등을 측정하여 기록하세요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">목표 설정</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">"목표 & 알림" 탭에서 건강 목표를 설정하고 알림을 등록하세요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">데이터 분석</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">"트렌드 분석"과 "상세 통계"로 건강 변화를 확인하세요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">5</span>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">AI 조언 받기</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">"AI 조언" 탭에서 개인 맞춤형 건강 조언을 받아보세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 도움말 섹션 */}
      <div className="space-y-3">
        {helpSections.map((section) => (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all"
          >
            {/* 섹션 헤더 */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{section.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <span className={`text-2xl transform transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* 섹션 내용 */}
            {expandedSection === section.id && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      {item.subtitle && (
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {item.subtitle}
                        </h4>
                      )}
                      {item.text && (
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {item.text}
                        </p>
                      )}
                      {item.items && (
                        <ul className="space-y-1.5">
                          {item.items.map((listItem, itemIdx) => (
                            <li
                              key={itemIdx}
                              className="text-gray-700 dark:text-gray-300 pl-4"
                            >
                              {listItem.startsWith('Q:') || listItem.startsWith('A:') ? (
                                <span className={listItem.startsWith('Q:') ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}>
                                  {listItem}
                                </span>
                              ) : listItem === '' ? (
                                <br />
                              ) : (
                                <span className="flex items-start gap-2">
                                  <span className="text-primary-500 dark:text-primary-400 mt-1">•</span>
                                  <span>{listItem}</span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          더 궁금한 사항이 있으신가요?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Health Alpha는 지속적으로 업데이트되고 있습니다. 건강한 삶을 응원합니다! 💪
        </p>
      </div>
    </div>
  );
}
