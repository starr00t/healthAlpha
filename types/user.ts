// 사용자 타입 정의

export type BodyType = 'slim' | 'athletic' | 'average' | 'heavyset' | 'obese';
export type Gender = 'male' | 'female' | 'other';
export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string; // ISO string
  endDate?: string; // ISO string, 무료는 undefined
  aiRequestsUsed?: number; // 이번 달 사용한 AI 요청 횟수
  aiRequestsLimit?: number; // 월간 한도 (free: 5, premium: 100, pro: unlimited)
}

export interface UserProfile {
  height?: number; // cm
  bodyType?: BodyType;
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;
  location?: string; // 거주 지역
  targetWeight?: number; // 목표 체중 (kg)
  targetBloodPressure?: { systolic: number; diastolic: number }; // 목표 혈압
  medicalConditions?: string[]; // 기저질환
  allergies?: string[]; // 알레르기
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin?: boolean;
  profile?: UserProfile;
  subscription?: UserSubscription;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const bodyTypeLabels: Record<BodyType, string> = {
  slim: '마른 편',
  athletic: '근육질',
  average: '보통',
  heavyset: '살찐 편',
  obese: '비만',
};

export const genderLabels: Record<Gender, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

export const subscriptionTierLabels: Record<SubscriptionTier, string> = {
  free: '무료',
  premium: '프리미엄',
  pro: '프로',
};

export const subscriptionFeatures = {
  free: {
    name: '무료',
    price: 0,
    aiRequests: 5,
    features: [
      '기본 건강 기록',
      '커랜더 및 다이어리',
      '통계 및 그래프',
      '기본 건강 조언 (월 5회)',
    ],
  },
  premium: {
    name: '프리미엄',
    price: 2900,
    aiRequests: 100,
    features: [
      '무료 플랜의 모든 기능',
      'AI 맞춤형 건강 조언 (월 100회)',
      '상세한 트렌드 분석',
      '목표 달성 코칭',
      '데이터 내보내기 (PDF/CSV)',
    ],
  },
  pro: {
    name: '프로',
    price: 4900,
    aiRequests: -1, // unlimited
    features: [
      '프리미엄의 모든 기능',
      'AI 조언 무제한',
      '가족 계정 추가 (5명)',
      '전문 건강 리포트',
      '우선 고객 지원',
    ],
  },
};
