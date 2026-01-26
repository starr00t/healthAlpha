'use client';

import { useAuthStore } from '@/store/authStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useState, useEffect } from 'react';

export default function GoalsManager() {
  const { user } = useAuthStore();
  const { goals, addGoal, updateGoal, deleteGoal, getActiveGoals, syncToServer, loadFromServer } = useGoalsStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'weight' as 'weight' | 'bloodPressure' | 'bloodSugar' | 'steps' | 'calories',
    targetValue: '',
    targetSystolic: '',
    targetDiastolic: '',
    deadline: '',
  });

  // 서버에서 데이터 로드
  useEffect(() => {
    if (user?.email) {
      loadFromServer(user.email);
    }
  }, [user?.email, loadFromServer]);

  if (!user) return null;

  const userGoals = getActiveGoals(user.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const goal: any = {
      userId: user.id,
      type: formData.type,
      targetValue: parseFloat(formData.targetValue),
      deadline: new Date(formData.deadline).toISOString(),
      isActive: true,
    };

    if (formData.type === 'bloodPressure' && formData.targetSystolic && formData.targetDiastolic) {
      goal.targetSystolic = parseInt(formData.targetSystolic);
      goal.targetDiastolic = parseInt(formData.targetDiastolic);
    }

    addGoal(goal);
    
    // 서버에 동기화
    if (user.email) {
      await syncToServer(user.email);
    }
    
    setShowForm(false);
    setFormData({
      type: 'weight',
      targetValue: '',
      targetSystolic: '',
      targetDiastolic: '',
      deadline: '',
    });
  };

  const handleDelete = async (goalId: string) => {
    if (confirm('이 목표를 삭제하시겠습니까?')) {
      deleteGoal(goalId);
      
      // 서버에 동기화
      if (user.email) {
        await syncToServer(user.email);
      }
    }
  };

  const getGoalLabel = (goal: any) => {
    switch (goal.type) {
      case 'weight':
        return `체중 ${goal.targetValue}kg 달성`;
      case 'bloodPressure':
        return `혈압 ${goal.targetSystolic}/${goal.targetDiastolic} 달성`;
      case 'bloodSugar':
        return `혈당 ${goal.targetValue}mg/dL 유지`;
      case 'steps':
        return `하루 ${goal.targetValue.toLocaleString()}걸음 걷기`;
      case 'calories':
        return `하루 ${goal.targetValue}kcal 소모`;
      default:
        return '목표';
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'weight':
        return '⚖️';
      case 'bloodPressure':
        return '❤️';
      case 'bloodSugar':
        return '🩸';
      case 'steps':
        return '🚶';
      case 'calories':
        return '🔥';
      default:
        return '🎯';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">건강 목표</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? '취소' : '+ 목표 추가'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              목표 유형
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
              required
            >
              <option value="weight">체중</option>
              <option value="bloodPressure">혈압</option>
              <option value="bloodSugar">혈당</option>
              <option value="steps">걸음수</option>
              <option value="calories">칼로리</option>
            </select>
          </div>

          {formData.type === 'bloodPressure' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  목표 수축기 혈압
                </label>
                <input
                  type="number"
                  value={formData.targetSystolic}
                  onChange={(e) => setFormData({ ...formData, targetSystolic: e.target.value })}
                  placeholder="120"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  목표 이완기 혈압
                </label>
                <input
                  type="number"
                  value={formData.targetDiastolic}
                  onChange={(e) => setFormData({ ...formData, targetDiastolic: e.target.value })}
                  placeholder="80"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                목표 {formData.type === 'weight' ? '체중 (kg)' : formData.type === 'bloodSugar' ? '혈당 (mg/dL)' : formData.type === 'steps' ? '걸음수 (걸음)' : '칼로리 (kcal)'}
              </label>
              <input
                type="number"
                step={formData.type === 'steps' ? '1' : '0.1'}
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                placeholder={formData.type === 'weight' ? '70' : formData.type === 'bloodSugar' ? '100' : formData.type === 'steps' ? '10000' : '300'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              목표 달성 기한
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            목표 추가
          </button>
        </form>
      )}

      <div className="space-y-3">
        {userGoals.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            아직 설정된 목표가 없습니다.
          </p>
        ) : (
          userGoals.map((goal) => {
            const daysLeft = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isOverdue = daysLeft < 0;

            return (
              <div
                key={goal.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getGoalIcon(goal.type)}</span>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {getGoalLabel(goal)}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        기한: {new Date(goal.deadline).toLocaleDateString('ko-KR')}
                        {isOverdue ? (
                          <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                            (기한 초과)
                          </span>
                        ) : (
                          <span className="ml-2 text-primary-600 dark:text-primary-400">
                            (D-{daysLeft})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
