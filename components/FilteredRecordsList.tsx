'use client';

import { useHealthStore } from '@/store/healthStore';
import { useState, useMemo } from 'react';

export default function FilteredRecordsList() {
  const records = useHealthStore((state) => state.records);
  const deleteRecord = useHealthStore((state) => state.deleteRecord);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    hasWeight: false,
    hasBloodPressure: false,
    hasBloodSugar: false,
  });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 날짜 필터
      if (filters.startDate && new Date(record.date) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(record.date) > new Date(filters.endDate)) {
        return false;
      }

      // 타입 필터 (하나라도 선택되어 있으면)
      if (filters.hasWeight || filters.hasBloodPressure || filters.hasBloodSugar) {
        let matches = false;
        if (filters.hasWeight && record.weight !== undefined) matches = true;
        if (filters.hasBloodPressure && record.bloodPressure !== undefined) matches = true;
        if (filters.hasBloodSugar && record.bloodSugar !== undefined) matches = true;
        return matches;
      }

      return true;
    });
  }, [records, filters]);

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      hasWeight: false,
      hasBloodPressure: false,
      hasBloodSugar: false,
    });
  };

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.hasWeight ||
    filters.hasBloodPressure ||
    filters.hasBloodSugar;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">기록 필터링</h2>

      {/* 필터 컨트롤 */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              시작 날짜
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              종료 날짜
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            데이터 유형
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500">
              <input
                type="checkbox"
                checked={filters.hasWeight}
                onChange={(e) => setFilters({ ...filters, hasWeight: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">⚖️ 체중</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500">
              <input
                type="checkbox"
                checked={filters.hasBloodPressure}
                onChange={(e) => setFilters({ ...filters, hasBloodPressure: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">❤️ 혈압</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500">
              <input
                type="checkbox"
                checked={filters.hasBloodSugar}
                onChange={(e) => setFilters({ ...filters, hasBloodSugar: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">🩸 혈당</span>
            </label>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 결과 표시 */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          총 <strong className="text-primary-600 dark:text-primary-400">{filteredRecords.length}</strong>개의 기록
          {hasActiveFilters && ` (전체: ${records.length}개)`}
        </p>
      </div>

      {/* 기록 목록 */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {hasActiveFilters ? '필터 조건에 맞는 기록이 없습니다.' : '아직 기록된 데이터가 없습니다.'}
          </p>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="text-lg font-semibold text-gray-800 dark:text-white">
                  {new Date(record.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </div>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                >
                  삭제
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {record.weight && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">체중</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {record.weight} kg
                    </div>
                  </div>
                )}

                {record.bloodPressure && (
                  <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">혈압</div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                    </div>
                    {record.bloodPressure.heartRate && (
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        ❤️ {record.bloodPressure.heartRate} bpm
                      </div>
                    )}
                  </div>
                )}

                {record.bloodSugar && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">혈당</div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {record.bloodSugar} mg/dL
                    </div>
                  </div>
                )}
              </div>

              {record.notes && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <strong>메모:</strong> {record.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
