'use client';

import { useHealthStore } from '@/store/healthStore';
import { useState } from 'react';
import { getHealthStatus } from '@/utils/healthUtils';
import { HealthRecord } from '@/types/health';

export default function EditableRecordsList() {
  const records = useHealthStore((state) => state.records);
  const deleteRecord = useHealthStore((state) => state.deleteRecord);
  const updateRecord = useHealthStore((state) => state.updateRecord);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const startEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setEditForm({
      date: record.date.split('T')[0],
      weight: record.weight?.toString() || '',
      systolic: record.bloodPressure?.systolic.toString() || '',
      diastolic: record.bloodPressure?.diastolic.toString() || '',
      heartRate: record.bloodPressure?.heartRate?.toString() || '',
      bloodSugar: record.bloodSugar?.toString() || '',
      notes: record.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (recordId: string) => {
    const updates: any = {
      date: editForm.date + 'T00:00:00.000Z',
      notes: editForm.notes || undefined,
    };

    if (editForm.weight) {
      updates.weight = parseFloat(editForm.weight);
    } else {
      updates.weight = undefined;
    }

    if (editForm.systolic && editForm.diastolic) {
      updates.bloodPressure = {
        systolic: parseInt(editForm.systolic),
        diastolic: parseInt(editForm.diastolic),
        heartRate: editForm.heartRate ? parseInt(editForm.heartRate) : undefined,
      };
    } else {
      updates.bloodPressure = undefined;
    }

    if (editForm.bloodSugar) {
      updates.bloodSugar = parseFloat(editForm.bloodSugar);
    } else {
      updates.bloodSugar = undefined;
    }

    updateRecord(recordId, updates);
    setEditingId(null);
    setEditForm({});
  };

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">기록 내역</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          아직 기록된 데이터가 없습니다. 위 폼을 사용하여 건강 데이터를 입력해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">기록 내역</h2>
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {records.map((record) => (
          <div
            key={record.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {editingId === record.id ? (
              // 수정 모드
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    날짜
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      체중 (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                      placeholder="70.5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      혈당 (mg/dL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.bloodSugar}
                      onChange={(e) => setEditForm({ ...editForm, bloodSugar: e.target.value })}
                      placeholder="95"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      수축기
                    </label>
                    <input
                      type="number"
                      value={editForm.systolic}
                      onChange={(e) => setEditForm({ ...editForm, systolic: e.target.value })}
                      placeholder="120"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      이완기
                    </label>
                    <input
                      type="number"
                      value={editForm.diastolic}
                      onChange={(e) => setEditForm({ ...editForm, diastolic: e.target.value })}
                      placeholder="80"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      심박수
                    </label>
                    <input
                      type="number"
                      value={editForm.heartRate}
                      onChange={(e) => setEditForm({ ...editForm, heartRate: e.target.value })}
                      placeholder="72"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    메모
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => saveEdit(record.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    저장
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              // 조회 모드
              <>
                <div className="flex justify-between items-start mb-3">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {new Date(record.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(record)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 기록을 삭제하시겠습니까?')) {
                          deleteRecord(record.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {record.weight && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <div className="text-sm text-gray-600 dark:text-gray-400">체중</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {record.weight} kg
                      </div>
                    </div>
                  )}

                  {record.bloodPressure && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      <div className="text-sm text-gray-600 dark:text-gray-400">혈압</div>
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                      </div>
                      {record.bloodPressure.heartRate && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          ❤️ {record.bloodPressure.heartRate} bpm
                        </div>
                      )}
                      <div className="text-xs mt-1">
                        <span
                          className={`px-2 py-1 rounded ${
                            getHealthStatus(
                              'bloodPressure',
                              0,
                              record.bloodPressure.systolic,
                              record.bloodPressure.diastolic
                            ).status === 'normal'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : getHealthStatus(
                                  'bloodPressure',
                                  0,
                                  record.bloodPressure.systolic,
                                  record.bloodPressure.diastolic
                                ).status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {
                            getHealthStatus(
                              'bloodPressure',
                              0,
                              record.bloodPressure.systolic,
                              record.bloodPressure.diastolic
                            ).message
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {record.bloodSugar && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                      <div className="text-sm text-gray-600 dark:text-gray-400">혈당</div>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {record.bloodSugar} mg/dL
                      </div>
                      <div className="text-xs mt-1">
                        <span
                          className={`px-2 py-1 rounded ${
                            getHealthStatus('bloodSugar', record.bloodSugar).status === 'normal'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : getHealthStatus('bloodSugar', record.bloodSugar).status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {getHealthStatus('bloodSugar', record.bloodSugar).message}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {record.notes && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <strong>메모:</strong> {record.notes}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
