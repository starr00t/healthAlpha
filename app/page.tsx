'use client';

import HealthRecordForm from '@/components/HealthRecordForm';
import TrendChart from '@/components/TrendChart';
import StatsSummary from '@/components/StatsSummary';
import DataManagementPanel from '@/components/DataManagementPanel';
import AuthForm from '@/components/AuthForm';
import UserProfile from '@/components/UserProfile';
import AdminPanel from '@/components/AdminPanel';
import ThemeToggle from '@/components/ThemeToggle';
import GoalsManager from '@/components/GoalsManager';
import RemindersManager from '@/components/RemindersManager';
import DetailedStats from '@/components/DetailedStats';
import EditableRecordsList from '@/components/EditableRecordsList';
import HealthCalendar from '@/components/HealthCalendar';
import AIHealthAdvisor from '@/components/AIHealthAdvisor';
import HelpPanel from '@/components/HelpPanel';
import HomePage from '@/components/HomePage';
import UserSettings from '@/components/UserSettings';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useHealthStore } from '@/store/healthStore';
import { useThemeStore } from '@/store/themeStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useHomeLayoutStore } from '@/store/homeLayoutStore';
import { useNoteStore } from '@/store/noteStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'record' | 'calendar' | 'trends' | 'stats' | 'goals' | 'manage' | 'ai' | 'help' | 'settings' | 'admin'>('home');
  const { isAuthenticated, user, logout } = useAuthStore();
  const healthStore = useHealthStore();
  const calendarStore = useCalendarStore();
  const goalsStore = useGoalsStore();
  const homeLayoutStore = useHomeLayoutStore();
  const noteStore = useNoteStore();
  const { isDarkMode } = useThemeStore();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  // 다크모드 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  // 사용자 로그인/로그아웃 시 데이터 동기화
  useEffect(() => {
    if (isAuthenticated && user) {
      healthStore.setUserId(user.id, user.email);
      calendarStore.setUserId(user.id, user.email);
      goalsStore.setUserId(user.id, user.email);
      homeLayoutStore.setUserId(user.id, user.email);
      noteStore.setUserId(user.id, user.email);
    } else {
      healthStore.clearRecords();
      calendarStore.clearData();
      goalsStore.clearData();
    }
  }, [isAuthenticated, user]);
  }, [isAuthenticated, user]);

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        {/* 헤더 */}
        <header className="mb-6 md:mb-8">
          {/* 상단: 타이틀과 테마 토글 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
                Health Alpha
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                매일의 건강을 기록하고 관리하세요
              </p>
            </div>
            <ThemeToggle />
          </div>
          
          {/* 하단: 사용자 프로필 */}
          {user && (
            <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-gray-800 px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-base md:text-lg font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">
                  {user.name}
                  {user.isAdmin && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                      관리자
                    </span>
                  )}
                </p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs md:text-sm font-medium transition-colors flex-shrink-0"
                title="로그아웃"
              >
                🚪 <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          )}
        </header>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('home')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                🏠 홈
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'record'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📝 기록 입력
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📅 캘린더
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'trends'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📊 트렌드 분석
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📈 상세 통계
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'goals'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                🎯 목표 & 알림
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                ⚙️ 데이터 관리
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'ai'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                🤖 AI 조언
              </button>
              <button
                onClick={() => setActiveTab('help')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'help'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📖 도움말
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                ⚙️ 설정
              </button>
              {user?.isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'admin'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  🔧 관리자
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        {activeTab === 'home' && (
          <HomePage />
        )}

        {activeTab === 'record' && (
          <div className="space-y-6">
            <StatsSummary />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthRecordForm />
              <EditableRecordsList />
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <HealthCalendar />
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <TrendChart
              metric="weight"
              title="체중 변화"
              color="#3b82f6"
            />
            <TrendChart
              metric="bloodPressure"
              title="혈압 변화"
              color="#ef4444"
            />
            <TrendChart
              metric="bloodSugar"
              title="혈당 변화"
              color="#8b5cf6"
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <DetailedStats />
        )}

        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalsManager />
            <RemindersManager />
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="max-w-6xl mx-auto">
            <DataManagementPanel />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-4xl mx-auto">
            <AIHealthAdvisor />
          </div>
        )}

        {activeTab === 'help' && (
          <div className="max-w-5xl mx-auto">
            <HelpPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto">
            <UserSettings />
          </div>
        )}

        {activeTab === 'admin' && user?.isAdmin && (
          <AdminPanel />
        )}

        {/* 푸터 */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2026 Health Alpha. 건강한 내일을 위한 오늘의 기록</p>
        </footer>
      </div>
    </main>
  );
}
