// 목표 타입 정의

export interface HealthGoal {
  id: string;
  userId: string;
  type: 'weight' | 'bloodPressure' | 'bloodSugar';
  targetValue: number;
  targetSystolic?: number; // 혈압용
  targetDiastolic?: number; // 혈압용
  deadline: string;
  isActive: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  time: string; // HH:mm 형식
  days: number[]; // 0-6 (일-토)
  isActive: boolean;
  createdAt: string;
}
