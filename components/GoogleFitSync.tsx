'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useHealthStore } from '@/store/healthStore';
import { getGoogleAuthUrl } from '@/lib/googleFit';

export default function GoogleFitSync() {
  const { user } = useAuthStore();
  const { addRecord } = useHealthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncedSteps, setSyncedSteps] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  // URL 파라미터에서 연결 성공 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const params = new URLSearchParams(window.location.search);
      const googleFitStatus = params.get('google_fit');
      const errorStatus = params.get('error');
      
      if (googleFitStatus === 'connected') {
        // 연결 성공 - localStorage에 저장
        localStorage.setItem(`google-fit-connected:${user.id}`, 'true');
        setIsConnected(true);
        
        // URL에서 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname);
        
        // 성공 메시지
        alert('✅ Google Fit 연결 완료!');
        
        console.log('Google Fit connected successfully for user:', user.id);
      } else if (errorStatus) {
        console.error('Google Fit connection error:', errorStatus);
        alert(`❌ Google Fit 연결 실패: ${errorStatus}`);
        
        // URL에서 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [user]);

  // 연결 상태 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const connected = localStorage.getItem(`google-fit-connected:${user.id}`);
      setIsConnected(!!connected);
      
      const lastSyncTime = localStorage.getItem(`google-fit-last-sync:${user.id}`);
      setLastSync(lastSyncTime);

      const autoSyncEnabled = localStorage.getItem(`google-fit-auto-sync:${user.id}`);
      setAutoSync(autoSyncEnabled === 'true');
    }
  }, [user]);

  // 30초마다 업데이트 확인 (자동 동기화 활성화 시)
  useEffect(() => {
    if (!user || !isConnected || !autoSync) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/google-fit/sync?userId=${user.id}`);
        const data = await response.json();

        if (data.hasUpdate) {
          console.log('Google Fit update detected, syncing...');
          await syncSteps();
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // 즉시 한 번 실행
    checkForUpdates();

    // 30초마다 확인
    const interval = setInterval(checkForUpdates, 30 * 1000);

    return () => clearInterval(interval);
  }, [user, isConnected, autoSync]);

  const handleConnect = () => {
    if (!user) return;

    // Google OAuth URL로 이동 (state에 userId 포함)
    const authUrl = getGoogleAuthUrl();
    const urlWithState = `${authUrl}&state=${user.id}`;
    window.location.href = urlWithState;
  };

  const handleDisconnect = () => {
    if (!user) return;

    if (confirm('Google Fit 연결을 해제하시겠습니까?')) {
      localStorage.removeItem(`google-fit-connected:${user.id}`);
      localStorage.removeItem(`google-fit-last-sync:${user.id}`);
      localStorage.removeItem(`google-fit-auto-sync:${user.id}`);
      setIsConnected(false);
      setLastSync(null);
      setSyncedSteps(null);
      setAutoSync(false);
    }
  };

  const syncSteps = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/google-fit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();
      
      // 오늘 날짜의 기록에 걸음수 추가/업데이트
      const today = new Date().toISOString().split('T')[0];
      
      addRecord({
        date: today + 'T00:00:00.000Z',
        steps: data.steps,
        walkingTime: data.walkingTime,
        calories: data.calories,
      });

      setSyncedSteps(data.steps);
      const syncTime = new Date().toISOString();
      setLastSync(syncTime);
      localStorage.setItem(`google-fit-last-sync:${user.id}`, syncTime);

      alert(`✅ 동기화 완료!\n걸음수: ${data.steps.toLocaleString()}걸음`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('동기화에 실패했습니다. Google Fit 연결을 다시 시도해주세요.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = () => {
    if (!user) return;
    
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem(`google-fit-auto-sync:${user.id}`, String(newValue));
  };

  // URL에서 연결 성공 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_fit') === 'connected') {
        localStorage.setItem(`google-fit-connected:${user.id}`, 'true');
        setIsConnected(true);
        
        // URL 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname);
        
        // 자동으로 첫 동기화 실행
        setTimeout(() => syncSteps(), 1000);
      }
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🏃</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Google Fit 연동
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            걸음수 자동 동기화
          </p>
        </div>
        {isConnected ? (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
            연결됨
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
            미연결
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          {/* 마지막 동기화 시간 */}
          {lastSync && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">마지막 동기화:</span>{' '}
                {new Date(lastSync).toLocaleString('ko-KR')}
              </p>
              {syncedSteps !== null && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">걸음수:</span>{' '}
                  {syncedSteps.toLocaleString()}걸음
                </p>
              )}
            </div>
          )}

          {/* 자동 동기화 토글 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">자동 동기화</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                30초마다 업데이트 확인
              </p>
            </div>
            <button
              onClick={toggleAutoSync}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSync ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 동기화 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={syncSteps}
              disabled={isSyncing}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSyncing ? '동기화 중...' : '🔄 지금 동기화'}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 border border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              연결 해제
            </button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 <strong>Tip:</strong> 자동 동기화를 켜두면 Google Fit에서 걸음수가 변경될 때마다 자동으로 업데이트됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Google Fit과 연동하면 걸음수를 자동으로 가져올 수 있습니다.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✓ 실시간 걸음수 동기화</li>
              <li>✓ 자동 칼로리 계산</li>
              <li>✓ 매일 자동 업데이트</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>🔗</span>
            Google Fit 연결하기
          </button>
        </div>
      )}
    </div>
  );
}
