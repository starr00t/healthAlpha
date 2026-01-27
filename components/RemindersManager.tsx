'use client';

import { useAuthStore } from '@/store/authStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useState, useEffect } from 'react';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function RemindersManager() {
  const { user } = useAuthStore();
  const { reminders, addReminder, updateReminder, deleteReminder, getActiveReminders, syncToServer, syncFromServer } =
    useGoalsStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    days: [] as number[],
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // 서버에서 데이터 로드
  useEffect(() => {
    if (user?.email) {
      syncFromServer();
    }
  }, [user?.email, syncFromServer]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (!user) return null;

  const userReminders = getActiveReminders(user.id);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.days.length === 0) {
      alert('요일을 하나 이상 선택해주세요.');
      return;
    }

    addReminder({
      userId: user.id,
      title: formData.title,
      time: formData.time,
      days: formData.days,
      isActive: true,
    });

    // 서버에 동기화
    if (user.email) {
      await syncToServer(user.email);
    }

    setShowForm(false);
    setFormData({ title: '', time: '', days: [] });
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort(),
    }));
  };

  const handleDelete = async (reminderId: string) => {
    if (confirm('이 알림을 삭제하시겠습니까?')) {
      deleteReminder(reminderId);
    }
  };

  const toggleReminderActive = (reminderId: string, isActive: boolean) => {
    updateReminder(reminderId, { isActive: !isActive });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">알림 설정</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? '취소' : '+ 알림 추가'}
        </button>
      </div>

      {permission !== 'granted' && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            알림을 받으려면 브라우저 알림 권한이 필요합니다.
          </p>
          <button
            onClick={requestPermission}
            className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
          >
            권한 요청
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              알림 제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 건강 데이터 기록하기"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              알림 시간
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              반복 요일
            </label>
            <div className="flex gap-2">
              {DAYS.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    formData.days.includes(index)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            알림 추가
          </button>
        </form>
      )}

      <div className="space-y-3">
        {userReminders.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            아직 설정된 알림이 없습니다.
          </p>
        ) : (
          userReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔔</span>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {reminder.title}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>시간: {reminder.time}</p>
                    <p>
                      요일:{' '}
                      {reminder.days.map((d) => DAYS[d]).join(', ')}
                    </p>
                  </div>
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminder.isActive}
                        onChange={() => toggleReminderActive(reminder.id, reminder.isActive)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">활성화</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
