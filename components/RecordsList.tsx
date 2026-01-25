'use client';

import { useHealthStore } from '@/store/healthStore';
import { getHealthStatus } from '@/utils/healthUtils';

export default function RecordsList() {
  const records = useHealthStore((state) => state.records);
  const deleteRecord = useHealthStore((state) => state.deleteRecord);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">기록 내역</h2>
        <p className="text-gray-500 text-center py-8">
          아직 기록된 데이터가 없습니다. 위 폼을 사용하여 건강 데이터를 입력해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">기록 내역</h2>
      <div className="space-y-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="text-lg font-semibold text-gray-800">
                {new Date(record.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </div>
              <button
                onClick={() => deleteRecord(record.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                삭제
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {record.weight && (
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-gray-600">체중</div>
                  <div className="text-xl font-bold text-blue-600">
                    {record.weight} kg
                  </div>
                </div>
              )}

              {record.bloodPressure && (
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-gray-600">혈압</div>
                  <div className="text-xl font-bold text-red-600">
                    {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                  </div>
                  {record.bloodPressure.heartRate && (
                    <div className="text-sm text-gray-700 mt-1">
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
                          ? 'bg-green-100 text-green-800'
                          : getHealthStatus(
                              'bloodPressure',
                              0,
                              record.bloodPressure.systolic,
                              record.bloodPressure.diastolic
                            ).status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
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
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-gray-600">혈당</div>
                  <div className="text-xl font-bold text-purple-600">
                    {record.bloodSugar} mg/dL
                  </div>
                  <div className="text-xs mt-1">
                    <span
                      className={`px-2 py-1 rounded ${
                        getHealthStatus('bloodSugar', record.bloodSugar).status === 'normal'
                          ? 'bg-green-100 text-green-800'
                          : getHealthStatus('bloodSugar', record.bloodSugar).status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getHealthStatus('bloodSugar', record.bloodSugar).message}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {record.notes && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <strong>메모:</strong> {record.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
