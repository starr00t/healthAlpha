import { HealthRecord, HealthStats, ChartDataPoint } from '@/types/health';

export const calculateStats = (values: number[]): HealthStats => {
  if (values.length === 0) {
    return { average: 0, min: 0, max: 0, trend: 'stable' };
  }

  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // 트렌드 계산: 최근 30% vs 이전 70% 비교
  const splitPoint = Math.floor(values.length * 0.7);
  const recentAvg = values.slice(splitPoint).reduce((sum, val) => sum + val, 0) / 
                    (values.length - splitPoint);
  const previousAvg = values.slice(0, splitPoint).reduce((sum, val) => sum + val, 0) / 
                      splitPoint;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  const diffPercentage = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (diffPercentage > 5) trend = 'up';
  else if (diffPercentage < -5) trend = 'down';

  return { average, min, max, trend };
};

export const prepareChartData = (
  records: HealthRecord[],
  metric: 'weight' | 'bloodPressure' | 'bloodSugar'
): ChartDataPoint[] => {
  return records
    .filter((record) => {
      if (metric === 'weight') return record.weight !== undefined;
      if (metric === 'bloodPressure') return record.bloodPressure !== undefined;
      if (metric === 'bloodSugar') return record.bloodSugar !== undefined;
      return false;
    })
    .map((record) => {
      const baseData: ChartDataPoint = {
        date: new Date(record.date).toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: 0,
      };

      if (metric === 'weight' && record.weight) {
        baseData.value = record.weight;
      } else if (metric === 'bloodPressure' && record.bloodPressure) {
        baseData.value = record.bloodPressure.systolic;
        baseData.systolic = record.bloodPressure.systolic;
        baseData.diastolic = record.bloodPressure.diastolic;
      } else if (metric === 'bloodSugar' && record.bloodSugar) {
        baseData.value = record.bloodSugar;
      }

      return baseData;
    })
    .reverse(); // 날짜 순서대로 정렬
};

export const getHealthStatus = (
  metric: 'weight' | 'bloodPressure' | 'bloodSugar',
  value: number,
  systolic?: number,
  diastolic?: number
): { status: 'normal' | 'warning' | 'danger'; message: string } => {
  if (metric === 'bloodPressure' && systolic && diastolic) {
    if (systolic < 120 && diastolic < 80) {
      return { status: 'normal', message: '정상' };
    } else if (systolic < 140 && diastolic < 90) {
      return { status: 'warning', message: '주의' };
    } else {
      return { status: 'danger', message: '위험' };
    }
  }

  if (metric === 'bloodSugar') {
    if (value < 100) {
      return { status: 'normal', message: '정상' };
    } else if (value < 126) {
      return { status: 'warning', message: '주의' };
    } else {
      return { status: 'danger', message: '위험' };
    }
  }

  return { status: 'normal', message: '기록됨' };
};
