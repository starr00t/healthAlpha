// 건강 데이터 타입 정의

export interface HealthRecord {
  id: string;
  date: string; // ISO 8601 형식
  weight?: number; // kg
  bloodPressure?: {
    systolic: number; // 수축기 혈압
    diastolic: number; // 이완기 혈압
    heartRate?: number; // 심박수 (bpm)
  };
  bloodSugar?: number; // mg/dL
  steps?: number; // 걸음수
  walkingTime?: number; // 걸은 시간 (분) - 자동 계산
  calories?: number; // 칼로리 (kcal) - 자동 계산
  notes?: string;
}

export interface HealthStats {
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
}

export type HealthMetric = 'weight' | 'bloodPressure' | 'bloodSugar' | 'steps' | 'calories';

export interface ChartDataPoint {
  date: string;
  value: number;
  systolic?: number;
  diastolic?: number;
}
