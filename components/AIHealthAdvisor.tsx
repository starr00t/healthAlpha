'use client';

import { useState, useEffect } from 'react';
import { useHealthStore } from '@/store/healthStore';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { getAIHealthAdvice, analyzeHealthData, AIAdviceResponse } from '@/lib/aiHealthAdvisor';

export default function AIHealthAdvisor() {
  const records = useHealthStore((state) => state.records);
  const user = useAuthStore((state) => state.user);
  const adminStore = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    weightAnalysis?: AIAdviceResponse;
    bloodPressureAnalysis?: AIAdviceResponse;
    bloodSugarAnalysis?: AIAdviceResponse;
    overallAnalysis?: AIAdviceResponse;
  } | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAdvice, setCustomAdvice] = useState<AIAdviceResponse | null>(null);

  // localStorage에서 직접 설정 읽기 (hydration 문제 해결)
  const getAdminSettings = () => {
    if (typeof window === 'undefined') return adminStore.settings;
    
    try {
      const stored = localStorage.getItem('health-alpha-admin-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.state?.settings || adminStore.settings;
      }
    } catch (e) {
      console.error('Failed to load admin settings:', e);
    }
    return adminStore.settings;
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const settings = getAdminSettings();
      const result = await analyzeHealthData(
        records,
        user?.profile,
        user?.id,
        user?.subscription,
        settings.openaiApiKey,
        settings.openaiModel
      );
      setAnalysis(result);
    } catch (error) {
      console.error('분석 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return;

    setLoading(true);
    const settings = getAdminSettings();
    
    console.log('=== Asking AI ===');
    console.log('Question:', customQuestion);
    console.log('User subscription:', user?.subscription?.tier);
    console.log('API Key configured:', !!settings.openaiApiKey);
    console.log('API Key length:', settings.openaiApiKey?.length || 0);
    
    try {
      const advice = await getAIHealthAdvice(
        {
          context: {
            userProfile: user?.profile,
            recentRecords: records.slice(0, 7),
          },
          question: customQuestion,
          type: 'general',
          userId: user?.id,
          userSubscription: user?.subscription,
        },
        settings.openaiApiKey,
        settings.openaiModel
      );
      console.log('AI Response:', advice);
      setCustomAdvice(advice);
      setCustomQuestion('');
    } catch (error) {
      console.error('질문 처리 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  const AdviceCard = ({ title, advice, icon }: { title: string; advice: AIAdviceResponse; icon: string }) => (
    <div className={`rounded-lg border-2 p-6 ${getPriorityColor(advice.priority)}`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            {title}
            <span className="text-sm font-normal">{getPriorityIcon(advice.priority)}</span>
          </h3>
          <p className="text-sm leading-relaxed">{advice.advice}</p>
        </div>
      </div>

      {advice.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-sm">📋 권장사항</h4>
          <ul className="space-y-1">
            {advice.recommendations.map((rec, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-xs mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {advice.warnings && advice.warnings.length > 0 && (
        <div className="bg-white/50 dark:bg-black/20 rounded p-3">
          <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
            ⚠️ 주의사항
          </h4>
          <ul className="space-y-1">
            {advice.warnings.map((warning, i) => (
              <li key={i} className="text-sm">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          🤖 AI 건강 조언
        </h2>
        <p className="text-purple-100">
          인공지능이 당신의 건강 데이터를 분석하여 맞춤형 조언을 제공합니다
        </p>
      </div>

      {/* API 키 안내 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          💡 AI 기능 안내
        </h3>
        <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <p className="font-medium">
            ✅ 현재 상태: 기본 건강 조언 시스템 작동 중
          </p>
          <p>
            더 정확한 AI 조언을 원하시면 관리자가 OpenAI API 키를 서버에 설정해야 합니다.
          </p>
          
          <details className="mt-2">
            <summary className="cursor-pointer font-medium hover:text-blue-800 dark:hover:text-blue-200">
              🔧 관리자용: API 설정 방법
            </summary>
            <ol className="mt-2 ml-4 space-y-1">
              <li>1. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI 웹사이트</a>에서 API 키 발급</li>
              <li>2. 프로젝트 루트에 <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">.env.local</code> 파일 생성</li>
              <li>3. <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">OPENAI_API_KEY=your-api-key</code> 추가</li>
              <li>4. ⚠️ <strong className="text-red-600 dark:text-red-400">NEXT_PUBLIC_ 접두사 사용 금지!</strong> (보안 위험)</li>
              <li>5. 개발 서버 재시작</li>
            </ol>
          </details>

          <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded">
            <p className="font-semibold mb-1">🔒 보안 정보</p>
            <ul className="text-xs space-y-1">
              <li>• API 키는 서버에서만 사용됩니다 (클라이언트 노출 방지)</li>
              <li>• 모든 요청은 서버를 통해 안전하게 처리됩니다</li>
              <li>• 개인 식별 정보는 AI에 전송되지 않습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 분석 시작 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading || records.length === 0}
          className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              분석 중...
            </>
          ) : (
            <>
              🔍 건강 데이터 분석하기
            </>
          )}
        </button>
      </div>

      {records.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          건강 기록이 없습니다. 먼저 데이터를 입력해주세요.
        </div>
      )}

      {/* 분석 결과 */}
      {analysis && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">📊 분석 결과</h3>

          {/* 전체 분석 */}
          {analysis.overallAnalysis && (
            <AdviceCard title="종합 건강 조언" advice={analysis.overallAnalysis} icon="🏥" />
          )}

          {/* 체중 분석 */}
          {analysis.weightAnalysis && (
            <AdviceCard title="체중 관리" advice={analysis.weightAnalysis} icon="⚖️" />
          )}

          {/* 혈압 분석 */}
          {analysis.bloodPressureAnalysis && (
            <AdviceCard title="혈압 관리" advice={analysis.bloodPressureAnalysis} icon="💓" />
          )}

          {/* 혈당 분석 */}
          {analysis.bloodSugarAnalysis && (
            <AdviceCard title="혈당 관리" advice={analysis.bloodSugarAnalysis} icon="🩸" />
          )}
        </div>
      )}

      {/* AI 챗봇 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          💬 AI에게 질문하기
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
            placeholder="예: 체중 감량을 위해 어떤 운동을 해야 하나요?"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={handleAskQuestion}
            disabled={loading || !customQuestion.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            질문
          </button>
        </div>

        {/* 자주 묻는 질문 */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">자주 묻는 질문:</p>
          <div className="flex flex-wrap gap-2">
            {[
              '혈압을 낮추는 방법은?',
              '건강한 식단 추천해주세요',
              '운동 계획 짜주세요',
              '스트레스 관리 방법',
            ].map((q) => (
              <button
                key={q}
                onClick={() => setCustomQuestion(q)}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 커스텀 조언 */}
        {customAdvice && (
          <div className="mt-4">
            <AdviceCard title="AI 답변" advice={customAdvice} icon="🤖" />
          </div>
        )}
      </div>

      {/* 주의사항 */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">⚠️ 주의사항</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• AI 조언은 일반적인 건강 정보 제공 목적이며, 의학적 진단이나 처방을 대체하지 않습니다.</li>
          <li>• 심각한 건강 문제나 증상이 있다면 반드시 전문의와 상담하세요.</li>
          <li>• 개인의 건강 상태에 따라 조언이 적합하지 않을 수 있습니다.</li>
          <li>• 기저질환이나 복용 중인 약물이 있다면 의사와 상담 후 실행하세요.</li>
        </ul>
      </div>
    </div>
  );
}
