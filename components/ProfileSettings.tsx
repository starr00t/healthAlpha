'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useHealthStore } from '@/store/healthStore';
import { UserProfile, bodyTypeLabels, genderLabels, BodyType, Gender } from '@/types/user';

export default function ProfileSettings() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateHealthProfile = useAuthStore((state) => state.updateHealthProfile);
  
  // 건강 데이터 동기화
  const { syncEnabled, setSyncEnabled, syncToServer, syncFromServer, lastSyncTime, isSyncing } = useHealthStore();

  const [formData, setFormData] = useState<UserProfile>({
    height: user?.profile?.height,
    bodyType: user?.profile?.bodyType,
    birthDate: user?.profile?.birthDate,
    gender: user?.profile?.gender,
    location: user?.profile?.location,
    targetWeight: user?.profile?.targetWeight,
    targetBloodPressure: user?.profile?.targetBloodPressure,
    medicalConditions: user?.profile?.medicalConditions || [],
    allergies: user?.profile?.allergies || [],
  });

  const [medicalInput, setMedicalInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        height: user.profile.height,
        bodyType: user.profile.bodyType,
        birthDate: user.profile.birthDate,
        gender: user.profile.gender,
        location: user.profile.location,
        targetWeight: user.profile.targetWeight,
        targetBloodPressure: user.profile.targetBloodPressure,
        medicalConditions: user.profile.medicalConditions || [],
        allergies: user.profile.allergies || [],
      });
    }
  }, [user]);

  const calculateAge = () => {
    if (!formData.birthDate) return null;
    const today = new Date();
    const birth = new Date(formData.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (weight: number) => {
    if (!formData.height || !weight) return null;
    const heightInM = formData.height / 100;
    return (weight / (heightInM * heightInM)).toFixed(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHealthProfile(formData);
    setSuccessMessage('프로필이 저장되었습니다! ✓');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const addMedicalCondition = () => {
    if (medicalInput.trim() && !formData.medicalConditions?.includes(medicalInput.trim())) {
      setFormData({
        ...formData,
        medicalConditions: [...(formData.medicalConditions || []), medicalInput.trim()],
      });
      setMedicalInput('');
    }
  };

  const removeMedicalCondition = (condition: string) => {
    setFormData({
      ...formData,
      medicalConditions: formData.medicalConditions?.filter((c) => c !== condition),
    });
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !formData.allergies?.includes(allergyInput.trim())) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      allergies: formData.allergies?.filter((a) => a !== allergy),
    });
  };

  const age = calculateAge();
  
  // 최근 체중 데이터 가져오기
  const records = useHealthStore((state) => state.records);
  const recentWeightRecord = records
    .filter((r) => r.weight !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const currentWeight = recentWeightRecord?.weight || 70;
  const bmi = calculateBMI(currentWeight);

  const handleSyncToggle = async () => {
    const newSyncEnabled = !syncEnabled;
    setSyncEnabled(newSyncEnabled);
    
    if (newSyncEnabled) {
      // 동기화 활성화 시 서버로 즉시 업로드
      await syncToServer();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 성공 메시지 */}
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* 데이터 동기화 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          ☁️ 데이터 동기화
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  자동 클라우드 동기화
                </h4>
                {syncEnabled && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded">
                    활성화
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                건강 데이터를 서버에 자동으로 백업하고 다른 기기에서 동일한 데이터를 볼 수 있습니다
              </p>
              {lastSyncTime && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  마지막 동기화: {new Date(lastSyncTime).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={handleSyncToggle}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {syncEnabled && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => syncFromServer()}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSyncing ? '동기화 중...' : '⬇️ 서버에서 다운로드'}
              </button>
              <button
                type="button"
                onClick={() => syncToServer()}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSyncing ? '동기화 중...' : '⬆️ 서버로 업로드'}
              </button>
            </div>
          )}

          {!syncEnabled && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ 동기화가 비활성화되어 있습니다. 데이터는 이 기기에만 저장됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          👤 기본 정보
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              성별
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">선택하세요</option>
              {(Object.keys(genderLabels) as Gender[]).map((key) => (
                <option key={key} value={key}>
                  {genderLabels[key]}
                </option>
              ))}
            </select>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              생년월일 {age && <span className="text-primary-600 dark:text-primary-400">({age}세)</span>}
            </label>
            <input
              type="date"
              value={formData.birthDate || ''}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* 키 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              키 (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 170"
            />
          </div>

          {/* 체형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              체형
            </label>
            <select
              value={formData.bodyType || ''}
              onChange={(e) => setFormData({ ...formData, bodyType: e.target.value as BodyType })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">선택하세요</option>
              {(Object.keys(bodyTypeLabels) as BodyType[]).map((key) => (
                <option key={key} value={key}>
                  {bodyTypeLabels[key]}
                </option>
              ))}
            </select>
          </div>

          {/* 거주 지역 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              거주 지역
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 서울시 강남구"
            />
          </div>
        </div>

        {/* BMI 정보 */}
        {bmi && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">현재 BMI</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{bmi}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {parseFloat(bmi) < 18.5 && '저체중'}
              {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 23 && '정상'}
              {parseFloat(bmi) >= 23 && parseFloat(bmi) < 25 && '과체중'}
              {parseFloat(bmi) >= 25 && parseFloat(bmi) < 30 && '비만'}
              {parseFloat(bmi) >= 30 && '고도비만'}
            </p>
          </div>
        )}
      </div>

      {/* 건강 목표 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          🎯 건강 목표
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 목표 체중 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              목표 체중 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.targetWeight || ''}
              onChange={(e) => setFormData({ ...formData, targetWeight: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 65"
            />
          </div>

          {/* 목표 혈압 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              목표 혈압 (수축기/이완기)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.targetBloodPressure?.systolic || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetBloodPressure: {
                      systolic: parseInt(e.target.value),
                      diastolic: formData.targetBloodPressure?.diastolic || 80,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="120"
              />
              <span className="text-gray-500 dark:text-gray-400 self-center">/</span>
              <input
                type="number"
                value={formData.targetBloodPressure?.diastolic || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetBloodPressure: {
                      systolic: formData.targetBloodPressure?.systolic || 120,
                      diastolic: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 의료 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          🏥 의료 정보
        </h3>

        {/* 기저질환 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            기저질환
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={medicalInput}
              onChange={(e) => setMedicalInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalCondition())}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 고혈압, 당뇨병"
            />
            <button
              type="button"
              onClick={addMedicalCondition}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.medicalConditions?.map((condition, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm flex items-center gap-2"
              >
                {condition}
                <button
                  type="button"
                  onClick={() => removeMedicalCondition(condition)}
                  className="hover:text-red-900 dark:hover:text-red-100"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 알레르기 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            알레르기
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 페니실린, 땅콩"
            />
            <button
              type="button"
              onClick={addAllergy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.allergies?.map((allergy, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm flex items-center gap-2"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(allergy)}
                  className="hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium text-lg"
        >
          💾 프로필 저장
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 프로필 정보 활용</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• 나이와 성별에 따른 맞춤형 건강 기준 제공</li>
          <li>• 키와 체중으로 BMI 자동 계산</li>
          <li>• 목표 달성률 추적 및 권장사항 제공</li>
          <li>• 기저질환 고려한 건강 알림</li>
          <li>• 지역별 병원/약국 정보 제공 (향후 기능)</li>
        </ul>
      </div>
    </form>
  );
}
