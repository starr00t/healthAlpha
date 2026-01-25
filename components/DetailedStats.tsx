'use client';

import { useHealthStore } from '@/store/healthStore';
import { useState, useMemo } from 'react';
import { calculateStats } from '@/utils/healthUtils';

export default function DetailedStats() {
  const records = useHealthStore((state) => state.records);
  const [dateRange, setDateRange] = useState(30); // 기본 30일

  const filteredRecords = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);
    return records.filter((r) => new Date(r.date) >= cutoffDate);
  }, [records, dateRange]);

  const weightStats = useMemo(() => {
    const values = filteredRecords
      .filter((r) => r.weight !== undefined)
      .map((r) => r.weight!);
    return values.length > 0 ? calculateStats(values) : null;
  }, [filteredRecords]);

  const systolicStats = useMemo(() => {
    const values = filteredRecords
      .filter((r) => r.bloodPressure?.systolic !== undefined)
      .map((r) => r.bloodPressure!.systolic);
    return values.length > 0 ? calculateStats(values) : null;
  }, [filteredRecords]);

  const diastolicStats = useMemo(() => {
    const values = filteredRecords
      .filter((r) => r.bloodPressure?.diastolic !== undefined)
      .map((r) => r.bloodPressure!.diastolic);
    return values.length > 0 ? calculateStats(values) : null;
  }, [filteredRecords]);

  const heartRateStats = useMemo(() => {
    const values = filteredRecords
      .filter((r) => r.bloodPressure?.heartRate !== undefined)
      .map((r) => r.bloodPressure!.heartRate!);
    return values.length > 0 ? calculateStats(values) : null;
  }, [filteredRecords]);

  const bloodSugarStats = useMemo(() => {
    const values = filteredRecords
      .filter((r) => r.bloodSugar !== undefined)
      .map((r) => r.bloodSugar!);
    return values.length > 0 ? calculateStats(values) : null;
  }, [filteredRecords]);

  const getTrendBadge = (trend: 'up' | 'down' | 'stable') => {
    const badges = {
      up: { icon: '📈', text: '상승', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      down: { icon: '📉', text: '하락', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      stable: { icon: '➡️', text: '안정', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    };
    return badges[trend];
  };

  const StatCard = ({ title, stats, unit, icon }: any) => {
    if (!stats) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">데이터 없음</p>
        </div>
      );
    }

    const badge = getTrendBadge(stats.trend);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({unit})</span>
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.icon} {badge.text}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">평균</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.average.toFixed(1)}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">최소</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.min.toFixed(1)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">최대</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.max.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">상세 통계</h2>
          <div className="flex gap-2">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === days
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {days}일
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <p className="text-sm text-primary-800 dark:text-primary-200">
            최근 <strong>{dateRange}일</strong> 동안의 데이터 (총 <strong>{filteredRecords.length}</strong>개 기록)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="체중" stats={weightStats} unit="kg" icon="⚖️" />
        <StatCard title="수축기 혈압" stats={systolicStats} unit="mmHg" icon="❤️" />
        <StatCard title="이완기 혈압" stats={diastolicStats} unit="mmHg" icon="💗" />
        <StatCard title="심박수" stats={heartRateStats} unit="bpm" icon="💓" />
        <StatCard title="혈당" stats={bloodSugarStats} unit="mg/dL" icon="🩸" />
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            선택한 기간에 기록된 데이터가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
