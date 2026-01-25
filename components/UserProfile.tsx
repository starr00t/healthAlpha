'use client';

import { useAuthStore } from '@/store/authStore';
import ProfileSettings from './ProfileSettings';
import { useState } from 'react';

export default function UserProfile() {
  const { user, logout, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  if (!user) return null;

  const handleSave = () => {
    if (newName.trim().length >= 2) {
      updateProfile(newName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewName(user.name);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* 계정 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">계정 정보</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              )}
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                수정
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
              {user.isAdmin && (
                <p className="mt-1 text-purple-600 dark:text-purple-400 font-medium">🔧 관리자 계정</p>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={logout}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 건강 프로필 설정 */}
      <ProfileSettings />
    </div>
  );
}
