'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHealthStore } from '@/store/healthStore';
import { prepareChartData, calculateStats } from '@/utils/healthUtils';

interface TrendChartProps {
  metric: 'weight' | 'bloodPressure' | 'bloodSugar' | 'steps';
  title: string;
  color: string;
}

export default function TrendChart({ metric, title, color }: TrendChartProps) {
  const records = useHealthStore((state) => state.records);

  // 메트릭별 단위 결정
  const getUnit = () => {
    switch (metric) {
      case 'weight':
        return 'kg';
      case 'bloodPressure':
        return 'mmHg';
      case 'bloodSugar':
        return 'mg/dL';
      case 'steps':
        return '걸음';
      default:
        return '';
    }
  };

  const unit = getUnit();

  const chartData = useMemo(() => {
    const last30Days = records.slice(0, 30);
    return prepareChartData(last30Days, metric);
  }, [records, metric]);

  const stats = useMemo(() => {
    const values = chartData.map((d) => d.value);
    return calculateStats(values);
  }, [chartData]);

  // 혈압용 별도 통계
  const systolicStats = useMemo(() => {
    if (metric !== 'bloodPressure') return null;
    const values = chartData.map((d) => d.systolic).filter((v) => v !== undefined) as number[];
    return calculateStats(values);
  }, [chartData, metric]);

  const diastolicStats = useMemo(() => {
    if (metric !== 'bloodPressure') return null;
    const values = chartData.map((d) => d.diastolic).filter((v) => v !== undefined) as number[];
    return calculateStats(values);
  }, [chartData, metric]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({unit})</span>
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">데이터가 충분하지 않습니다</p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (stats.trend === 'up') return '📈';
    if (stats.trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = () => {
    if (metric === 'weight') {
      return stats.trend === 'down' ? 'text-green-600' : stats.trend === 'up' ? 'text-red-600' : 'text-gray-600';
    }
    // 걸음수는 증가가 좋음
    if (metric === 'steps') {
      return stats.trend === 'up' ? 'text-green-600' : stats.trend === 'down' ? 'text-red-600' : 'text-gray-600';
    }
    return stats.trend === 'up' ? 'text-red-600' : stats.trend === 'down' ? 'text-green-600' : 'text-gray-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({unit})</span>
        </h3>
        <div className={`text-2xl ${getTrendColor()}`}>
          {getTrendIcon()} {stats.trend === 'up' ? '상승' : stats.trend === 'down' ? '하락' : '안정'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {metric === 'bloodPressure' && systolicStats && diastolicStats ? (
          <>
            {/* 수축기 혈압 통계 */}
            <div className="col-span-3 mb-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">수축기 혈압</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">평균</div>
                  <div className="text-base font-bold text-red-600 dark:text-red-400">{systolicStats.average.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">최소</div>
                  <div className="text-base font-bold text-red-600 dark:text-red-400">{systolicStats.min.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">최대</div>
                  <div className="text-base font-bold text-red-600 dark:text-red-400">{systolicStats.max.toFixed(1)}</div>
                </div>
              </div>
            </div>
            {/* 이완기 혈압 통계 */}
            <div className="col-span-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">이완기 혈압</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">평균</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">{diastolicStats.average.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">최소</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">{diastolicStats.min.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">최대</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">{diastolicStats.max.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">평균</div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">{stats.average.toFixed(1)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">최소</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.min.toFixed(1)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">최대</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.max.toFixed(1)}</div>
            </div>
          </>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {metric === 'bloodPressure' ? (
            <>
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#ef4444"
                strokeWidth={2}
                name="수축기"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#3b82f6"
                strokeWidth={2}
                name="이완기"
                dot={{ r: 4 }}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              name={title}
              dot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
