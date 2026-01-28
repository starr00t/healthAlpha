'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getGoogleAuthUrl } from '@/lib/googleFit';

interface GoogleFitSyncProps {
  onStepsSynced?: (steps: number) => void;
}

export default function GoogleFitSync({ onStepsSynced }: GoogleFitSyncProps) {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncedSteps, setSyncedSteps] = useState<number | null>(null);

  // URL 파라미터에서 연결 성공 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const params = new URLSearchParams(window.location.search);
      const googleFitStatus = params.get('google_fit');
      const errorStatus = params.get('error');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresAt = params.get('expires_at');
      
      if (googleFitStatus === 'connected' && accessToken) {
        // 연결 성공 - localStorage에 토큰 저장
        localStorage.setItem(`google-fit-connected:${user.id}`, 'true');
        localStorage.setItem(`google-fit-token:${user.id}`, JSON.stringify({
          accessToken,
          refreshToken: refreshToken || null,
          expiresAt: parseInt(expiresAt || '0'),
        }));
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
    }
  }, [user]);

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
      localStorage.removeItem(`google-fit-token:${user.id}`);
      setIsConnected(false);
      setLastSync(null);
      setSyncedSteps(null);
    }
  };

  const syncSteps = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      // localStorage에서 토큰 가져오기
      const tokenStr = localStorage.getItem(`google-fit-token:${user.id}`);
      if (!tokenStr) {
        throw new Error('Google Fit token not found');
      }

      const tokenData = JSON.parse(tokenStr);
      
      const response = await fetch('/api/google-fit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const data = await response.json();
      
      // 폼에 걸음수만 채우기 (저장하지 않음)
      if (onStepsSynced) {
        onStepsSynced(data.steps);
      }

      setSyncedSteps(data.steps);
      const syncTime = new Date().toISOString();
      setLastSync(syncTime);
      localStorage.setItem(`google-fit-last-sync:${user.id}`, syncTime);

      alert(`✅ 동기화 완료!\n걸음수: ${data.steps.toLocaleString()}걸음\n\n폼에 걸음수가 입력되었습니다.\n다른 데이터(체중, 혈압 등)도 함께 입력하고 '기록 추가' 버튼을 누르세요.`);
    } catch (error) {
      console.error('Sync error:', error);
      alert(`동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\nGoogle Fit 연결을 다시 시도해주세요.`);
    } finally {
      setIsSyncing(false);
    }
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
              💡 <strong>Tip:</strong> 동기화하면 위 폼에 걸음수가 자동으로 입력됩니다. 체중, 혈압 등 다른 데이터도 함께 입력하고 '기록 추가' 버튼을 누르세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Google Fit과 연동하면 걸음수를 폼에 자동으로 입력할 수 있습니다.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✓ 버튼 클릭으로 간편하게 걸음수 가져오기</li>
              <li>✓ 체중, 혈압 등 다른 데이터와 함께 기록</li>
              <li>✓ 자동 칼로리 계산</li>
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
