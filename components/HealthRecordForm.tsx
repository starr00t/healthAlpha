'use client';

import { useState } from 'react';
import { useHealthStore } from '@/store/healthStore';
import { calculateWalkingMetrics, getRecentWeight } from '@/utils/walkingCalculator';

export default function HealthRecordForm() {
  const addRecord = useHealthStore((state) => state.addRecord);
  const records = useHealthStore((state) => state.records);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
    bloodSugar: '',
    steps: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: any = {
      date: formData.date + 'T00:00:00.000Z',
      notes: formData.notes || undefined,
    };

    if (formData.weight) {
      record.weight = parseFloat(formData.weight);
    }

    if (formData.systolic && formData.diastolic) {
      record.bloodPressure = {
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
      };
    }

    if (formData.bloodSugar) {
      record.bloodSugar = parseFloat(formData.bloodSugar);
    }

    // 걸음수 데이터 처리 (자동 계산)
    if (formData.steps) {
      const steps = parseInt(formData.steps);
      record.steps = steps;
      
      // 최근 체중 가져오기
      const userWeight = getRecentWeight(records) || (formData.weight ? parseFloat(formData.weight) : undefined);
      const { walkingTime, calories } = calculateWalkingMetrics(steps, userWeight);
      
      record.walkingTime = walkingTime;
      record.calories = calories;
    }

    addRecord(record);

    // 폼 초기화
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      systolic: '',
      diastolic: '',
      heartRate: '',
      bloodSugar: '',
      steps: '',
      notes: '',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-white">건강 데이터 입력</h2>
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            날짜
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            체중 (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="예: 70.5"
            className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                수축기 혈압 (mmHg)
              </label>
              <input
                type="number"
                value={formData.systolic}
                onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                placeholder="예: 120"
                className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이완기 혈압 (mmHg)
              </label>
              <input
                type="number"
                value={formData.diastolic}
                onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                placeholder="예: 80"
                className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              심박수 (bpm)
            </label>
            <input
              type="number"
              value={formData.heartRate}
              onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
              placeholder="예: 72"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            혈당 (mg/dL)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.bloodSugar}
            onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
            placeholder="예: 95"
            className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            걸음수 🚶
          </label>
          <input
            type="number"
            value={formData.steps}
            onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
            placeholder="예: 10000"
            className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {formData.steps && parseInt(formData.steps) > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>⏱️ 예상 걸은 시간: 약 {Math.round(parseInt(formData.steps) / 100)}분</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔥 예상 칼로리: 약 {Math.round(parseInt(formData.steps) * (getRecentWeight(records) || (formData.weight ? parseFloat(formData.weight) : 70)) * 0.0005)}kcal</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            메모
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="오늘의 건강 상태나 특이사항을 기록하세요"
            rows={3}
            className="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          기록 추가
        </button>
      </form>
    </div>
  );
}
