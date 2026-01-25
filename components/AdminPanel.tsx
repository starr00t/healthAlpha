'use client';

import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { useState } from 'react';
import { SubscriptionTier, subscriptionFeatures } from '@/types/user';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin?: boolean;
  subscription?: any;
}

type TabType = 'users' | 'settings' | 'subscriptions';

export default function AdminPanel() {
  const { user, getAllUsers, deleteUser, updateUserAdmin, grantPremiumAccess } = useAuthStore();
  const { settings, updateSettings, hasApiKey } = useAdminStore();
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [isLoading, setIsLoading] = useState(true);
  
  // OpenAI 설정
  const [apiKey, setApiKey] = useState(settings.openaiApiKey || '');
  const [model, setModel] = useState(settings.openaiModel || 'gpt-4o-mini');
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens || 500);
  const [temperature, setTemperature] = useState(settings.temperature || 0.7);
  const [enableAI, setEnableAI] = useState(settings.enableAIFeatures || false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 구독 관리
  const [selectedUser, setSelectedUser] = useState<StoredUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('premium');
  const [duration, setDuration] = useState<number>(30);
  const [isUnlimited, setIsUnlimited] = useState(false);

  // 초기 로드
  useEffect(() => {
    refreshUsers();
  }, []);

  if (!user?.isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-center text-red-600 dark:text-red-400">
          관리자 권한이 필요합니다.
        </p>
      </div>
    );
  }

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('정말 이 사용자를 삭제하시겠습니까?')) {
      if (deleteUser(userId)) {
        refreshUsers();
      } else {
        alert('관리자 계정은 삭제할 수 없습니다.');
      }
    }
  };

  const handleToggleAdmin = (userId: string, currentAdmin: boolean) => {
    if (confirm(`${currentAdmin ? '관리자 권한을 제거' : '관리자 권한을 부여'}하시겠습니까?`)) {
      updateUserAdmin(userId, !currentAdmin);
      refreshUsers();
    }
  };

  const handleSaveSettings = () => {
    updateSettings({
      openaiApiKey: apiKey.trim(),
      openaiModel: model,
      maxTokens,
      temperature,
      enableAIFeatures: enableAI,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult('API 키를 입력해주세요.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (response.ok) {
        setTestResult('✅ API 키가 유효합니다!');
      } else {
        const error = await response.json();
        setTestResult(`❌ API 키가 유효하지 않습니다: ${error.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      setTestResult(`❌ 연결 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleGrantAccess = () => {
    if (!selectedUser) return;

    const days = isUnlimited ? undefined : duration;
    const success = grantPremiumAccess(selectedUser.id, selectedTier, days);
    
    if (success) {
      setShowModal(false);
      setSelectedUser(null);
      refreshUsers();
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length < 8) return key;
    return key.substring(0, 7) + '•'.repeat(key.length - 11) + key.substring(key.length - 4);
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-semibold rounded">👑 Pro</span>;
      case 'premium':
        return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded">⭐ Premium</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-semibold rounded">Free</span>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded">✓ 활성</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-semibold rounded">✗ 만료</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-semibold rounded">-</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '무기한';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const filteredUsers = users.filter(
    (u: StoredUser) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter((u: StoredUser) => u.isAdmin).length;
  const regularCount = totalUsers - adminCount;
  const premiumCount = users.filter((u: StoredUser) => u.subscription?.tier === 'premium').length;
  const proCount = users.filter((u: StoredUser) => u.subscription?.tier === 'pro').length;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          👑 관리자 패널
        </h2>

        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            👥 사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'subscriptions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            💎 구독 관리
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🔧 AI 설정
          </button>
        </div>

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div>
            {/* localStorage 제한 안내 */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">
                    중요: 로컬 스토리지 사용 중
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                    현재 앱은 브라우저의 localStorage를 사용하고 있어, <strong>각 브라우저마다 독립적인 사용자 데이터</strong>를 저장합니다.
                  </p>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                    <li>다른 사람이 자신의 브라우저에서 가입한 계정은 여기에 표시되지 않습니다</li>
                    <li>같은 브라우저에서 가입한 사용자만 확인 가능합니다</li>
                    <li>실제 다중 사용자 환경을 위해서는 백엔드 데이터베이스(Supabase 등)가 필요합니다</li>
                  </ul>
                  <button
                    onClick={refreshUsers}
                    className="mt-3 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded font-medium"
                  >
                    🔄 사용자 목록 새로고침
                  </button>
                </div>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">전체 사용자</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalUsers}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">관리자</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {adminCount}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">일반 사용자</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {regularCount}
                </div>
              </div>
            </div>

            {/* 검색 */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="이메일 또는 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 사용자 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      이름
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      이메일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      가입일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      권한
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredUsers.map((u: StoredUser) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.isAdmin
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {u.isAdmin ? '관리자' : '일반'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.isAdmin || false)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          {u.isAdmin ? '권한 제거' : '관리자 지정'}
                        </button>
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        )}

        {/* 구독 관리 탭 */}
        {activeTab === 'subscriptions' && (
          <div>
            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">전체 사용자</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{users.length}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">무료</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                  {users.filter(u => !u.subscription || u.subscription.tier === 'free').length}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-400">Premium</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">{premiumCount}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <div className="text-sm text-amber-600 dark:text-amber-400">Pro</div>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">{proCount}</div>
              </div>
            </div>

            {/* 구독 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이메일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">구독</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">AI 사용</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">만료일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredUsers.map((u: StoredUser) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">{getTierBadge(u.subscription?.tier)}</td>
                      <td className="px-4 py-3">{getStatusBadge(u.subscription?.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {u.subscription?.tier === 'pro' ? (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">무제한</span>
                        ) : (
                          <span>
                            {u.subscription?.aiRequestsUsed || 0} / {u.subscription?.aiRequestsLimit || 5}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(u.subscription?.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          권한 부여
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI 설정 탭 */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 관리자 Pro 구독 상태 */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👑</span>
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                      관리자 계정 - Pro 구독
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      무제한 AI 조언 사용 가능 • 모든 프리미엄 기능 이용
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">∞</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">무제한</div>
                </div>
              </div>
            </div>

            {/* API 키 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <button
                  onClick={handleTestApiKey}
                  disabled={isTesting || !apiKey.trim()}
                  className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300"
                >
                  {isTesting ? '테스트 중...' : '테스트'}
                </button>
              </div>
              {testResult && (
                <div className={`mt-2 p-3 rounded-lg text-sm ${
                  testResult.startsWith('✅') 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {testResult}
                </div>
              )}
            </div>

            {/* AI 기능 활성화 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">AI 기능 활성화</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  유료 사용자에게 AI 건강 조언 기능을 제공합니다
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAI}
                  onChange={(e) => setEnableAI(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 
                              rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute 
                              after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                              after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                              peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 모델 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI 모델
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (추천 - 저렴하고 빠름)</option>
                <option value="gpt-4o">GPT-4o (고급 - 더 정확함)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (가장 저렴)</option>
              </select>
            </div>

            {/* 고급 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min="100"
                  max="2000"
                  step="100"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 
                         text-white rounded-lg font-semibold shadow-lg hover:shadow-xl"
              >
                💾 설정 저장
              </button>
              {saved && (
                <div className="flex items-center px-4 py-3 bg-green-50 dark:bg-green-900/20 
                              text-green-600 dark:text-green-400 rounded-lg">
                  ✓ 저장됨
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 권한 부여 모달 */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              프리미엄 권한 부여
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <span className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</span>님에게 프리미엄 권한을 부여합니다.
            </p>

            {/* 등급 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                구독 등급
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'premium', 'pro'] as SubscriptionTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTier === tier
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {tier === 'pro' && '👑'}
                      {tier === 'premium' && '⭐'}
                      {tier === 'free' && '📦'}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {tier}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 기간 설정 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                사용 기간
              </label>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isUnlimited}
                    onChange={(e) => setIsUnlimited(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">무기한</span>
                </label>
              </div>
              {!isUnlimited && (
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  placeholder="일 단위 (예: 30)"
                />
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleGrantAccess}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                권한 부여
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
