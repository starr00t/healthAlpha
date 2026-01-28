'use client';

import { useAuthStore } from '@/store/authStore';
import { useHealthStore } from '@/store/healthStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useHomeLayoutStore } from '@/store/homeLayoutStore';
import { useEffect, useMemo, useState } from 'react';
import HomeLayoutSettings from './HomeLayoutSettings';

interface GoalProgress {
  id: string;
  type: string;
  icon: string;
  label: string;
  current: number;
  target: number;
  progress: number;
  unit: string;
  deadline: string;
  daysLeft: number;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const { records } = useHealthStore();
  const { goals, getActiveGoals } = useGoalsStore();
  const { events } = useCalendarStore();
  const { widgets } = useHomeLayoutStore();
  const [lastAIAdvice, setLastAIAdvice] = useState<any>(null);
  const [healthAnalysisAdvices, setHealthAnalysisAdvices] = useState<any[]>([]);

  useEffect(() => {
    // AI 조언 히스토리 로드 (userId 기반 필터링 + 서버 동기화)
    const loadAIHistory = async () => {
      if (typeof window !== 'undefined' && user) {
        // 먼저 서버에서 로드 시도
        try {
          const response = await fetch(`/api/preferences?email=${encodeURIComponent(user.email)}&type=aiHistory`);
          if (response.ok) {
            const data = await response.json();
            if (data.preferences && Array.isArray(data.preferences)) {
              const userHistory = data.preferences.filter((advice: any) => 
                advice.userId === user.id
              );
              
              if (userHistory.length > 0) {
                setLastAIAdvice(userHistory[0]);
                
                // 가장 최근의 종합 건강 분석만 표시
                const comprehensiveAnalysis = userHistory.find((advice: any) => 
                  advice.category === '종합 건강 분석'
                );
                setHealthAnalysisAdvices(comprehensiveAnalysis ? [comprehensiveAnalysis] : []);
                
                // 서버 데이터를 로컬에도 저장
                localStorage.setItem('health-alpha-ai-history', JSON.stringify(data.preferences));
                return;
              }
            }
          }
        } catch (error) {
          console.error('Failed to load AI history from server:', error);
        }
        
        // 서버 로드 실패 시 로컬에서 로드
        const stored = localStorage.getItem('health-alpha-ai-history');
        if (stored) {
          const history = JSON.parse(stored);
          const userHistory = history.filter((advice: any) => 
            advice.userId === user.id || !advice.userId
          );
          
          if (userHistory.length > 0) {
            setLastAIAdvice(userHistory[0]);
            
            // 가장 최근의 종합 건강 분석만 표시
            const comprehensiveAnalysis = userHistory.find((advice: any) => 
              advice.category === '종합 건강 분석'
            );
            setHealthAnalysisAdvices(comprehensiveAnalysis ? [comprehensiveAnalysis] : []);
          } else {
            setLastAIAdvice(null);
            setHealthAnalysisAdvices([]);
          }
        }
      }
    };
    
    loadAIHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  const userGoals = getActiveGoals(user.id);

  // 오늘 날짜
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 오늘의 기록
  const todayRecords = records.filter(r => r.date.startsWith(todayStr));
  const latestRecord = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null;

  // 목표별 진행률 계산
  const goalProgress: GoalProgress[] = useMemo(() => {
    return userGoals.map(goal => {
      let current = 0;
      let unit = '';
      let label = '';
      let icon = '';

      switch (goal.type) {
        case 'weight':
          current = latestRecord?.weight || 0;
          unit = 'kg';
          label = '체중';
          icon = '⚖️';
          break;
        case 'bloodPressure':
          current = latestRecord?.bloodPressure?.systolic || 0;
          unit = 'mmHg';
          label = '혈압';
          icon = '❤️';
          break;
        case 'bloodSugar':
          current = latestRecord?.bloodSugar || 0;
          unit = 'mg/dL';
          label = '혈당';
          icon = '🩸';
          break;
        case 'steps':
          current = latestRecord?.steps || 0;
          unit = '걸음';
          label = '걸음수';
          icon = '🚶';
          break;
        case 'calories':
          current = latestRecord?.calories || 0;
          unit = 'kcal';
          label = '칼로리';
          icon = '🔥';
          break;
      }

      const target = goal.targetValue;
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: goal.id,
        type: goal.type,
        icon,
        label,
        current,
        target,
        progress,
        unit,
        deadline: goal.deadline,
        daysLeft,
      };
    });
  }, [userGoals, latestRecord]);

  // 오늘의 일정
  const todayEvents = useMemo(() => {
    const userEvents = events.filter(e => e.userId === user.id);
    return userEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === today.toDateString();
    });
  }, [events, user.id, today]);

  // AI 조언 경과 일수
  const adviceDaysAgo = useMemo(() => {
    if (!lastAIAdvice?.timestamp) return null;
    const adviceDate = new Date(lastAIAdvice.timestamp);
    const diffTime = today.getTime() - adviceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [lastAIAdvice, today]);

  // 활성화된 위젯을 순서대로 정렬
  const sortedWidgets = useMemo(() => {
    return [...widgets]
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  // 위젯 렌더링 맵
  const widgetComponents: Record<string, JSX.Element | null> = useMemo(() => ({
    'schedule': todayEvents.length > 0 || true ? (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          📅 오늘의 일정 ({today.getMonth() + 1}월 {today.getDate()}일)
        </h2>
        {todayEvents.length > 0 ? (
          <div className="space-y-2">
            {todayEvents.map(event => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="text-2xl">{event.category === 'medical' ? '🏥' : event.category === 'exercise' ? '🏃' : '📌'}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{event.title}</h3>
                  {event.time && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">⏰ {event.time}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">
            오늘 예정된 일정이 없습니다.
          </p>
        )}
      </div>
    ) : null,

    'health-status': (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          📊 오늘의 건강 현황
        </h2>
        {latestRecord ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestRecord.weight ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">체중</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {latestRecord.weight} <span className="text-sm">kg</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">체중</div>
                <div className="text-lg font-medium text-gray-400 dark:text-gray-500">
                  미기록
                </div>
              </div>
            )}
            {latestRecord.bloodPressure ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">혈압</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {latestRecord.bloodPressure.systolic}/{latestRecord.bloodPressure.diastolic}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">혈압</div>
                <div className="text-lg font-medium text-gray-400 dark:text-gray-500">
                  미기록
                </div>
              </div>
            )}
            {latestRecord.steps ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">걸음수</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {latestRecord.steps.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">걸음수</div>
                <div className="text-lg font-medium text-gray-400 dark:text-gray-500">
                  미기록
                </div>
              </div>
            )}
            {latestRecord.calories ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">칼로리</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {latestRecord.calories} <span className="text-sm">kcal</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">칼로리</div>
                <div className="text-lg font-medium text-gray-400 dark:text-gray-500">
                  미기록
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            오늘 아직 건강 데이터를 기록하지 않았습니다.
          </p>
        )}
      </div>
    ),

    'goals': goalProgress.length > 0 ? (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          🎯 목표 달성률
        </h2>
        <div className="space-y-4">
          {goalProgress.map(goal => (
            <div key={goal.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{goal.label}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.daysLeft >= 0 ? `D-${goal.daysLeft}` : '기한 초과'}
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>{goal.current} {goal.unit}</span>
                  <span>{goal.target} {goal.unit}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      goal.progress >= 100 ? 'bg-green-500' : 
                      goal.progress >= 70 ? 'bg-primary-500' : 
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-gray-800 dark:text-white">
                {goal.progress.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null,

    'health-analysis': healthAnalysisAdvices.length > 0 ? (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          📊 건강데이터 분석
        </h2>
        <div className="space-y-4">
          {healthAnalysisAdvices.map((advice, index) => {
            const adviceDate = new Date(advice.timestamp);
            const daysAgo = Math.floor((today.getTime() - adviceDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                    {advice.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {advice.advice}
                  </p>
                </div>

                {advice.recommendations && advice.recommendations.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
                    <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">
                      📋 권장사항
                    </h4>
                    <ul className="space-y-1">
                      {advice.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-xs text-green-700 dark:text-green-300 flex items-start gap-1">
                          <span className="text-green-600 dark:text-green-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {advice.warnings && advice.warnings.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-red-800 dark:text-red-200 mb-2">
                      ⚠️ 주의사항
                    </h4>
                    <ul className="space-y-1">
                      {advice.warnings.map((warning: string, i: number) => (
                        <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1">
                          <span className="text-red-600 dark:text-red-400">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : null,

    'ai-advice': lastAIAdvice ? (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          💡 최근 건강 조언
        </h2>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
              {lastAIAdvice.category || '건강 조언'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {adviceDaysAgo === 0 ? '오늘' : `${adviceDaysAgo}일 전`}
            </span>
          </div>

          {lastAIAdvice.question && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">질문:</p>
              <p className="text-gray-800 dark:text-white font-medium">
                {lastAIAdvice.question}
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-5 mb-4">
            <p className="text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
              {lastAIAdvice.advice}
            </p>
          </div>

          {lastAIAdvice.recommendations && lastAIAdvice.recommendations.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                📋 권장사항
              </h3>
              <ul className="space-y-2">
                {lastAIAdvice.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lastAIAdvice.warnings && lastAIAdvice.warnings.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                ⚠️ 주의사항
              </h3>
              <ul className="space-y-2">
                {lastAIAdvice.warnings.map((warning: string, i: number) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {adviceDaysAgo !== null && adviceDaysAgo >= 7 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ 마지막 건강 조언을 받은지 일주일이 지났습니다. AI 건강 조언 탭에서 새로운 조언을 받아보세요!
              </p>
            </div>
          )}
        </div>
      </div>
    ) : null,
  }), [todayEvents, latestRecord, goalProgress, healthAnalysisAdvices, lastAIAdvice, adviceDaysAgo, today]);

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow-md p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">안녕하세요, {user.name}님! 👋</h1>
        <p className="text-primary-100">오늘도 건강한 하루 되세요</p>
      </div>

      {/* 위젯 기반 동적 렌더링 */}
      {sortedWidgets.map(widget => {
        const component = widgetComponents[widget.id];
        return component ? <div key={widget.id}>{component}</div> : null;
      })}

      {/* 홈 화면 설정 버튼 */}
      <HomeLayoutSettings />
    </div>
  );
}
