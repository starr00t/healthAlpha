'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function UserSettings() {
  const { user, logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          계정 정보
        </h2>
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          약관 및 정책
        </h2>
        <div className="space-y-3">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 text-primary-600 hover:text-primary-700 hover:underline"
          >
            이용약관 →
          </a>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 text-primary-600 hover:text-primary-700 hover:underline"
          >
            개인정보처리방침 →
          </a>
        </div>
      </div>

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
    </div>
  );
}
