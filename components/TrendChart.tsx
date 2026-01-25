'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHealthStore } from '@/store/healthStore';
import { prepareChartData, calculateStats } from '@/utils/healthUtils';

interface TrendChartProps {
  metric: 'weight' | 'bloodPressure' | 'bloodSugar';
  title: string;
  color: string;
}

export default function TrendChart({ metric, title, color }: TrendChartProps) {
  const records = useHealthStore((state) => state.records);

  const chartData = useMemo(() => {
    const last30Days = records.slice(0, 30);
    return prepareChartData(last30Days, metric);
  }, [records, metric]);

  const stats = useMemo(() => {
    const values = chartData.map((d) => d.value);
    return calculateStats(values);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
        <p className="text-gray-500 text-center py-8">데이터가 충분하지 않습니다</p>
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
    return stats.trend === 'up' ? 'text-red-600' : stats.trend === 'down' ? 'text-green-600' : 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className={`text-2xl ${getTrendColor()}`}>
          {getTrendIcon()} {stats.trend === 'up' ? '상승' : stats.trend === 'down' ? '하락' : '안정'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">평균</div>
          <div className="text-lg font-bold text-gray-800">{stats.average.toFixed(1)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">최소</div>
          <div className="text-lg font-bold text-blue-600">{stats.min.toFixed(1)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">최대</div>
          <div className="text-lg font-bold text-red-600">{stats.max.toFixed(1)}</div>
        </div>
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
