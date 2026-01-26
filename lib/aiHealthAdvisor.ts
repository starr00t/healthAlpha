// AI 건강 조언 시스템
// OpenAI GPT API 연동 준비

import { HealthRecord } from '@/types/health';
import { UserProfile } from '@/types/user';
import { DiaryEntry } from '@/types/calendar';

export interface HealthContext {
  userProfile?: UserProfile;
  recentRecords: HealthRecord[];
  recentDiaries?: DiaryEntry[];
  currentMetrics?: {
    weight?: number;
    bloodPressure?: { systolic: number; diastolic: number; heartRate?: number };
    bloodSugar?: number;
  };
}

export interface AIAdviceRequest {
  context: HealthContext;
  question?: string; // 사용자 질문 (선택)
  type: 'general' | 'weight' | 'bloodPressure' | 'bloodSugar' | 'lifestyle' | 'goal';
  userId?: string; // 사용자 ID
  userSubscription?: any; // 구독 정보
}

export interface AIAdviceResponse {
  advice: string;
  recommendations: string[];
  warnings?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedLinks?: { title: string; url: string }[];
  isPremium?: boolean;
  error?: string;
  usageInfo?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

// GPT에게 보낼 프롬프트 생성
function buildHealthPrompt(request: AIAdviceRequest): string {
  const { context, question, type } = request;
  const { userProfile, recentRecords, recentDiaries, currentMetrics } = context;

  let prompt = '당신은 전문 건강 상담 AI입니다. 다음 정보를 바탕으로 맞춤형 건강 조언을 제공해주세요.\n\n';

  // 사용자 프로필
  if (userProfile) {
    prompt += '## 사용자 정보\n';
    if (userProfile.gender) prompt += `- 성별: ${userProfile.gender}\n`;
    if (userProfile.birthDate) {
      const age = calculateAge(userProfile.birthDate);
      prompt += `- 나이: ${age}세\n`;
    }
    if (userProfile.height) prompt += `- 키: ${userProfile.height}cm\n`;
    if (userProfile.bodyType) prompt += `- 체형: ${userProfile.bodyType}\n`;
    if (userProfile.medicalConditions?.length) {
      prompt += `- 기저질환: ${userProfile.medicalConditions.join(', ')}\n`;
    }
    if (userProfile.allergies?.length) {
      prompt += `- 알레르기: ${userProfile.allergies.join(', ')}\n`;
    }
    if (userProfile.targetWeight) prompt += `- 목표 체중: ${userProfile.targetWeight}kg\n`;
    prompt += '\n';
  }

  // 최근 건강 기록
  if (recentRecords.length > 0) {
    prompt += '## 최근 건강 기록 (최근 7일)\n';
    recentRecords.slice(0, 7).forEach((record) => {
      prompt += `- ${record.date}:\n`;
      if (record.weight) prompt += `  체중 ${record.weight}kg\n`;
      if (record.bloodPressure) {
        prompt += `  혈압 ${record.bloodPressure.systolic}/${record.bloodPressure.diastolic}`;
        if (record.bloodPressure.heartRate) prompt += ` (심박수 ${record.bloodPressure.heartRate})`;
        prompt += '\n';
      }
      if (record.bloodSugar) prompt += `  혈당 ${record.bloodSugar}mg/dL\n`;
      if (record.notes) prompt += `  메모: ${record.notes}\n`;
    });
    prompt += '\n';
  }

  // 현재 수치
  if (currentMetrics) {
    prompt += '## 현재 측정 수치\n';
    if (currentMetrics.weight) prompt += `- 체중: ${currentMetrics.weight}kg\n`;
    if (currentMetrics.bloodPressure) {
      prompt += `- 혈압: ${currentMetrics.bloodPressure.systolic}/${currentMetrics.bloodPressure.diastolic}`;
      if (currentMetrics.bloodPressure.heartRate) {
        prompt += ` (심박수 ${currentMetrics.bloodPressure.heartRate})`;
      }
      prompt += '\n';
    }
    if (currentMetrics.bloodSugar) prompt += `- 혈당: ${currentMetrics.bloodSugar}mg/dL\n`;
    prompt += '\n';
  }

  // 최근 다이어리
  if (recentDiaries && recentDiaries.length > 0) {
    prompt += '## 최근 생활 패턴 (다이어리)\n';
    recentDiaries.slice(0, 3).forEach((diary) => {
      prompt += `- ${diary.date}:\n`;
      if (diary.mood) prompt += `  기분: ${diary.mood}\n`;
      if (diary.activities?.length) prompt += `  활동: ${diary.activities.join(', ')}\n`;
      if (diary.content) prompt += `  내용: ${diary.content.substring(0, 100)}...\n`;
    });
    prompt += '\n';
  }

  // 조언 유형별 요청
  prompt += '## 요청 사항\n';
  
  // 질문이 있으면 질문을 우선시
  if (question) {
    prompt += `사용자의 구체적인 질문에 답변해주세요:\n"${question}"\n\n`;
    prompt += '위 질문에 대해 아래 건강 기록과 사용자 정보를 참고하여 맞춤형 답변을 제공해주세요.\n';
  } else {
    // 질문이 없을 때만 type에 따라 일반 조언
    switch (type) {
      case 'weight':
        prompt += '체중 관리에 대한 조언을 제공해주세요.\n';
        break;
      case 'bloodPressure':
        prompt += '혈압 관리에 대한 조언을 제공해주세요.\n';
        break;
      case 'bloodSugar':
        prompt += '혈당 관리에 대한 조언을 제공해주세요.\n';
        break;
      case 'lifestyle':
        prompt += '생활 습관 개선에 대한 조언을 제공해주세요.\n';
        break;
      case 'goal':
        prompt += '건강 목표 달성을 위한 조언을 제공해주세요.\n';
        break;
      default:
        prompt += '전반적인 건강 상태에 대한 조언을 제공해주세요.\n';
    }
  }

  prompt += `
응답 형식:
1. 전반적인 건강 조언 (2-3 문장)
2. 구체적인 권장사항 (3-5개 항목)
3. 주의사항 (있는 경우)
4. 우선순위 (low/medium/high/urgent 중 하나)

주의: 의학적 진단이나 처방은 하지 말고, 일반적인 건강 관리 조언만 제공하세요.
`;

  return prompt;
}

// 나이 계산 헬퍼
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 서버 API를 통한 AI 조언 요청 (보안 강화)
export async function getAIHealthAdvice(
  request: AIAdviceRequest,
  adminApiKey?: string,
  adminModel?: string
): Promise<AIAdviceResponse> {
  try {
    // 요청 헤더 구성
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 관리자 API 키와 모델 설정이 있으면 헤더에 추가
    if (adminApiKey) {
      headers['x-admin-api-key'] = adminApiKey;
    }
    if (adminModel) {
      headers['x-admin-model'] = adminModel;
    }

    // 서버 측 API Route 호출 (API 키가 노출되지 않음)
    const response = await fetch('/api/ai-advice', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: request.userId,
        userSubscription: request.userSubscription,
        userProfile: request.context.userProfile,
        recentRecords: request.context.recentRecords,
        recentDiaries: request.context.recentDiaries,
        currentMetrics: request.context.currentMetrics,
        question: request.question,
        type: request.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('AI API Error:', error);
      
      // 구독 관련 에러는 그대로 전달
      if (response.status === 403 || response.status === 429) {
        return {
          advice: error.error || '서비스를 사용할 수 없습니다.',
          recommendations: [],
          priority: 'high',
          error: error.error,
          usageInfo: error.usageInfo,
        };
      }

      // API 키 미등록 에러 (503)
      if (response.status === 503) {
        return {
          advice: error.error || '서비스가 준비되지 않았습니다.',
          recommendations: ['관리자에게 OpenAI API 키 등록을 요청하세요.'],
          priority: 'high',
          error: error.error,
        };
      }
      
      // 서버 오류 시 기본 조언 반환
      return getDummyAdvice(request);
    }

    const data = await response.json();

    // API 응답 검증
    if (data.error) {
      console.error('AI Service Error:', data.error);
      return {
        advice: data.error,
        recommendations: [],
        priority: 'high',
        error: data.error,
        usageInfo: data.usageInfo,
      };
    }

    return {
      advice: data.advice,
      recommendations: data.recommendations || [],
      warnings: data.warnings,
      priority: data.priority || 'medium',
      isPremium: data.isPremium,
      usageInfo: data.usageInfo,
    };
  } catch (error) {
    console.error('AI Health Advice Error:', error);
    // 네트워크 오류 등의 경우 기본 조언 반환
    return getDummyAdvice(request);
  }
}

// AI 응답 파싱
function parseAIResponse(response: string, type: string): AIAdviceResponse {
  // 간단한 파싱 로직 (실제로는 더 정교하게 구현)
  const lines = response.split('\n').filter((line) => line.trim());

  const advice = lines.slice(0, 3).join(' ');
  const recommendations = lines
    .filter((line) => line.match(/^[0-9-•]/))
    .map((line) => line.replace(/^[0-9-•.\s]+/, '').trim());

  const warnings = lines
    .filter((line) => line.includes('주의') || line.includes('경고') || line.includes('위험'))
    .map((line) => line.trim());

  // 우선순위 판단
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  if (response.includes('urgent') || response.includes('즉시') || response.includes('긴급')) {
    priority = 'urgent';
  } else if (response.includes('high') || response.includes('중요')) {
    priority = 'high';
  } else if (response.includes('low') || response.includes('낮음')) {
    priority = 'low';
  }

  return {
    advice,
    recommendations: recommendations.length > 0 ? recommendations : ['정기적인 건강 검진을 받으세요.'],
    warnings: warnings.length > 0 ? warnings : undefined,
    priority,
  };
}

// 더미 조언 (API 키 없을 때 또는 에러 시)
function getDummyAdvice(request: AIAdviceRequest): AIAdviceResponse {
  const { type, context } = request;

  switch (type) {
    case 'weight':
      return {
        advice: '체중 관리는 꾸준한 식단 조절과 규칙적인 운동이 중요합니다. 급격한 체중 변화보다는 점진적인 변화를 목표로 하세요.',
        recommendations: [
          '하루 3끼 규칙적으로 식사하기',
          '물 2L 이상 마시기',
          '주 3회 이상 30분 이상 운동하기',
          '가공식품과 당분 섭취 줄이기',
          '충분한 수면 취하기 (7-8시간)',
        ],
        priority: 'medium',
      };
    case 'bloodPressure':
      return {
        advice: '혈압 관리를 위해서는 염분 섭취를 줄이고 스트레스를 관리하는 것이 중요합니다.',
        recommendations: [
          '염분 섭취 하루 5g 이하로 제한',
          '규칙적인 유산소 운동',
          '스트레스 관리 (명상, 요가 등)',
          '카페인 섭취 줄이기',
          '정기적인 혈압 측정',
        ],
        warnings: ['고혈압이 지속되면 전문의 상담이 필요합니다.'],
        priority: 'high',
      };
    case 'bloodSugar':
      return {
        advice: '혈당 관리는 식사 시간과 구성이 중요합니다. 정제 탄수화물을 피하고 복합 탄수화물을 섭취하세요.',
        recommendations: [
          '식사 시간을 규칙적으로 유지',
          '통곡물, 채소 위주의 식단',
          '단순당 섭취 줄이기',
          '식후 가벼운 산책',
          '혈당 수치 정기적으로 체크',
        ],
        warnings: ['혈당 수치가 계속 높으면 당뇨 검사를 받아보세요.'],
        priority: 'high',
      };
    default:
      return {
        advice: '건강한 생활 습관을 유지하는 것이 가장 중요합니다. 규칙적인 운동, 균형 잡힌 식단, 충분한 수면을 실천하세요.',
        recommendations: [
          '하루 30분 이상 운동하기',
          '채소와 과일 충분히 섭취',
          '물 충분히 마시기',
          '규칙적인 수면 습관',
          '스트레스 관리하기',
        ],
        priority: 'medium',
      };
  }
}

// 건강 데이터 분석 및 자동 조언 생성
export async function analyzeHealthData(
  records: HealthRecord[],
  userProfile?: UserProfile,
  userId?: string,
  userSubscription?: any,
  adminApiKey?: string,
  adminModel?: string
): Promise<{
  weightAnalysis?: AIAdviceResponse;
  bloodPressureAnalysis?: AIAdviceResponse;
  bloodSugarAnalysis?: AIAdviceResponse;
  overallAnalysis: AIAdviceResponse;
}> {
  const recentRecords = records.slice(0, 7);

  const result: any = {
    overallAnalysis: await getAIHealthAdvice(
      {
        context: { userProfile, recentRecords },
        type: 'general',
        userId,
        userSubscription,
      },
      adminApiKey,
      adminModel
    ),
  };

  // 체중 데이터가 있으면 분석
  if (recentRecords.some((r) => r.weight)) {
    result.weightAnalysis = await getAIHealthAdvice(
      {
        context: { userProfile, recentRecords },
        type: 'weight',
        userId,
        userSubscription,
      },
      adminApiKey,
      adminModel
    );
  }

  // 혈압 데이터가 있으면 분석
  if (recentRecords.some((r) => r.bloodPressure)) {
    result.bloodPressureAnalysis = await getAIHealthAdvice(
      {
        context: { userProfile, recentRecords },
        type: 'bloodPressure',
        userId,
        userSubscription,
      },
      adminApiKey,
      adminModel
    );
  }

  // 혈당 데이터가 있으면 분석
  if (recentRecords.some((r) => r.bloodSugar)) {
    result.bloodSugarAnalysis = await getAIHealthAdvice(
      {
        context: { userProfile, recentRecords },
        type: 'bloodSugar',
        userId,
        userSubscription,
      },
      adminApiKey,
      adminModel
    );
  }

  return result;
}
