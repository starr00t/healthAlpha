'use client';

import { useHealthStore } from '@/store/healthStore';

export default function StatsSummary() {
  const records = useHealthStore((state) => state.records);

  const latestRecord = records[0];
  const totalRecords = records.length;

  const getRecordCountByType = () => {
    const withWeight = records.filter((r) => r.weight !== undefined).length;
    const withBP = records.filter((r) => r.bloodPressure !== undefined).length;
    const withBS = records.filter((r) => r.bloodSugar !== undefined).length;
    const withSteps = records.filter((r) => r.steps !== undefined && r.steps > 0).length;

    return { withWeight, withBP, withBS, withSteps };
  };

  const counts = getRecordCountByType();

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-md p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">건강 관리 현황</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-90">전체 기록</div>
          <div className="text-3xl font-bold mt-1">{totalRecords}</div>
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-90">체중 기록</div>
          <div className="text-3xl font-bold mt-1">{counts.withWeight}</div>
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-90">혈압 기록</div>
          <div className="text-3xl font-bold mt-1">{counts.withBP}</div>
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-90">혈당 기록</div>
          <div className="text-3xl font-bold mt-1">{counts.withBS}</div>
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-90">걸음수 기록</div>
          <div className="text-3xl font-bold mt-1">{counts.withSteps}</div>
        </div>
      </div>

      {latestRecord && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-90 mb-2">최근 기록</div>
          <div className="text-lg font-semibold">
            {new Date(latestRecord.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            {latestRecord.weight && <span>체중: {latestRecord.weight}kg</span>}
            {latestRecord.bloodPressure && (
              <span>
                혈압: {latestRecord.bloodPressure.systolic}/{latestRecord.bloodPressure.diastolic}
                {latestRecord.bloodPressure.heartRate && ` (❤️ ${latestRecord.bloodPressure.heartRate})`}
              </span>
            )}
            {latestRecord.bloodSugar && <span>혈당: {latestRecord.bloodSugar}mg/dL</span>}
            {latestRecord.steps && <span>🚶 걸음수: {latestRecord.steps.toLocaleString()}걸음</span>}
          </div>
        </div>
      )}
    </div>
  );
}
