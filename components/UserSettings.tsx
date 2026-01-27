'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import ProfileSettings from './ProfileSettings';

export default function UserSettings() {
  const { user, logout, updateUser } = useAuthStore();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'account' | 'terms' | 'delete'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  // 계정 수정 상태
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  if (!user) return null;

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUpdateSuccess('');

    // 이름만 변경하는 경우
    const isNameChange = accountForm.name && accountForm.name !== user.name;
    // 비밀번호 변경하는 경우
    const isPasswordChange = accountForm.currentPassword && accountForm.newPassword;

    if (!isNameChange && !isPasswordChange) {
      setError('변경할 내용이 없습니다.');
      return;
    }

    if (isPasswordChange) {
      if (accountForm.newPassword.length < 6) {
        setError('새 비밀번호는 6자 이상이어야 합니다.');
        return;
      }
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    setIsUpdating(true);

    try {
      const response = await fetch('/api/auth/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: isNameChange ? accountForm.name : undefined,
          currentPassword: isPasswordChange ? accountForm.currentPassword : undefined,
          newPassword: isPasswordChange ? accountForm.newPassword : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 사용자 정보 업데이트
        if (isNameChange) {
          updateUser({ ...user, name: accountForm.name });
        }
        
        setUpdateSuccess('계정 정보가 성공적으로 업데이트되었습니다.');
        setIsEditingAccount(false);
        setAccountForm({
          name: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError(data.error || '계정 정보 업데이트 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Update account error:', err);
      setError('계정 정보 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditingAccount = () => {
    setIsEditingAccount(true);
    setAccountForm({
      name: user.name,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setUpdateSuccess('');
  };

  const cancelEditingAccount = () => {
    setIsEditingAccount(false);
    setAccountForm({
      name: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setUpdateSuccess('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '회원탈퇴') {
      setError('정확히 "회원탈퇴"를 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로컬 데이터 삭제
        localStorage.removeItem('health-alpha-records');
        localStorage.removeItem('health-alpha-events');
        localStorage.removeItem('health-alpha-goals');
        localStorage.removeItem('health-alpha-ai-history');
        localStorage.removeItem('health-alpha-home-layout');
        
        // 로그아웃
        logout();
        
        alert('회원 탈퇴가 완료되었습니다.');
      } else {
        setError(data.error || '회원 탈퇴 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setError('회원 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 서브 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeSubTab === 'profile'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              👤 프로필
            </button>
            <button
              onClick={() => setActiveSubTab('account')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeSubTab === 'account'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🔐 계정
            </button>
            <button
              onClick={() => setActiveSubTab('terms')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeSubTab === 'terms'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📄 약관/정책
            </button>
            <button
              onClick={() => setActiveSubTab('delete')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeSubTab === 'delete'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600'
              }`}
            >
              ⚠️ 회원탈퇴
            </button>
          </nav>
        </div>
      </div>

      {/* 프로필 설정 */}
      {activeSubTab === 'profile' && (
        <ProfileSettings />
      )}

      {/* 계정 정보 */}
      {activeSubTab === 'account' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              계정 정보
            </h2>
            {!isEditingAccount && (
              <button
                onClick={startEditingAccount}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                수정
              </button>
            )}
          </div>

          {updateSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm">
              {updateSuccess}
            </div>
          )}

          {!isEditingAccount ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">이름</span>
                <span className="font-medium text-gray-800 dark:text-white">{user.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">이메일</span>
                <span className="font-medium text-gray-800 dark:text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">가입일</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="이름"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  비밀번호 변경 (선택사항)
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      value={accountForm.currentPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="현재 비밀번호"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={accountForm.newPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="새 비밀번호 (6자 이상)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={accountForm.confirmPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="새 비밀번호 확인"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpdating ? '처리중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingAccount}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 약관 및 정책 */}
      {activeSubTab === 'terms' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            약관 및 정책
          </h2>
          <div className="space-y-3">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">이용약관</span>
                <span>→</span>
              </div>
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">개인정보처리방침</span>
                <span>→</span>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 */}
      {activeSubTab === 'delete' && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-800">
        <h2 className="text-xl font-bold mb-2 text-red-800 dark:text-red-300">
          회원 탈퇴
        </h2>
        <p className="text-sm text-red-700 dark:text-red-400 mb-4">
          ⚠️ 회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            회원 탈퇴하기
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-300 dark:border-red-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                정말로 탈퇴하시겠습니까? 아래에 <strong>"회원탈퇴"</strong>를 입력하여 확인해주세요.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== '회원탈퇴'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? '처리중...' : '탈퇴 확인'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
