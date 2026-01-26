// Next.js API Route - 서버 측에서만 실행
// 클라이언트에서 직접 OpenAI API를 호출하지 않고 이 엔드포인트를 통해 요청

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Edge runtime 사용 (빠른 응답)

interface AIRequest {
  userId?: string; // 사용자 ID 추가
  userSubscription?: any; // 구독 정보
  userProfile?: any;
  recentRecords: any[];
  recentDiaries?: any[];
  currentMetrics?: any;
  question?: string;
  type: 'general' | 'weight' | 'bloodPressure' | 'bloodSugar' | 'lifestyle' | 'goal';
}

// 나이 계산
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

// GPT 프롬프트 생성
function buildHealthPrompt(request: AIRequest): string {
  const { userProfile, recentRecords, recentDiaries, currentMetrics, question, type } = request;

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
    if (userProfile.targetWeight) prompt += `- 목표 체중: ${userProfile.targetWeight}kg\n`;
    prompt += '\n';
  }

  // 최근 건강 기록 (개인정보 제외)
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
응답 형식 (JSON):
{
  "advice": "전반적인 건강 조언 (2-3 문장)",
  "recommendations": ["권장사항1", "권장사항2", "권장사항3"],
  "warnings": ["주의사항1", "주의사항2"] (선택),
  "priority": "low|medium|high|urgent"
}

주의: 의학적 진단이나 처방은 하지 말고, 일반적인 건강 관리 조언만 제공하세요.
`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();

    // 요청 검증
    if (!body.type || !Array.isArray(body.recentRecords)) {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

    // 클라이언트로부터 관리자 설정 받기 (관리자가 UI에서 등록한 API 키)
    const adminApiKey = request.headers.get('x-admin-api-key');
    const adminModel = request.headers.get('x-admin-model') || 'gpt-4o-mini';

    // API 키 검증 (환경 변수 우선, 관리자 설정은 보조)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || adminApiKey;
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: '⚠️ 관리자가 OpenAI API 키를 등록하지 않았습니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }

    // 구독 상태 확인
    const subscription = body.userSubscription;
    const userId = body.userId;
    
    // Pro 사용자 확인 (aiRequestsLimit이 -1이거나 undefined인 경우)
    const isProUser = subscription?.tier === 'pro';
    
    // 구독 정보가 없거나 무료 사용자인 경우
    if (!subscription || subscription.tier === 'free') {
      // 무료 사용자는 기본 조언만 제공 (OpenAI 사용 안 함)
      return NextResponse.json({
        advice: '무료 사용자는 기본 건강 조언만 제공됩니다. 프리미엄으로 업그레이드하면 AI 맞춤형 조언을 받을 수 있습니다.',
        recommendations: [
          '규칙적인 운동하기',
          '균형 잡힌 식단 유지',
          '충분한 수면 취하기',
          '스트레스 관리하기',
        ],
        priority: 'medium',
        isPremium: false,
      });
    }

    // Pro가 아닌 경우 구독 만료 확인
    if (!isProUser && subscription) {
      // 구독 만료 확인
      if (subscription.status !== 'active') {
        return NextResponse.json({
          error: '구독이 만료되었습니다. 구독을 갱신해주세요.',
          isPremium: false,
        }, { status: 403 });
      }

      if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
        return NextResponse.json({
          error: '구독 기간이 만료되었습니다.',
          isPremium: false,
        }, { status: 403 });
      }
    }

    // Pro가 아닌 경우 사용 한도 확인
    if (!isProUser && subscription && subscription.tier !== 'pro') {
      const used = subscription.aiRequestsUsed || 0;
      const limit = subscription.aiRequestsLimit || 0;
      
      if (used >= limit) {
        return NextResponse.json({
          error: `이번 달 AI 조언 한도(${limit}회)를 모두 사용했습니다. Pro로 업그레이드하면 무제한으로 사용할 수 있습니다.`,
          isPremium: false,
          usageInfo: {
            used,
            limit,
            remaining: 0,
          },
        }, { status: 429 });
      }
    }

    // Rate limiting (선택적 - 남용 방지)
    // TODO: Redis 등을 사용한 실제 rate limiting 구현 권장

    const prompt = buildHealthPrompt(body);
    
    // 디버깅: 프롬프트 로그
    console.log('=== AI Request Debug ===');
    console.log('Question:', body.question);
    console.log('Type:', body.type);
    console.log('User Subscription:', body.userSubscription?.tier);
    console.log('API Key exists:', !!OPENAI_API_KEY);
    console.log('Model:', adminModel);
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: adminModel, // 관리자가 선택한 모델 사용
        messages: [
          {
            role: 'system',
            content: '당신은 친절하고 전문적인 건강 상담 AI입니다. 한국어로 응답하며, 의학적 조언은 일반적인 건강 관리 수준에서만 제공합니다. 사용자의 질문이나 상황에 따라 맞춤형 답변을 제공하세요. 질문이 다르면 다른 답변을 생성해야 합니다. JSON 형식으로만 응답하세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // 다양성을 위해 temperature 증가
        max_tokens: 1000,
        response_format: { type: 'json_object' }, // JSON 응답 강제
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API Error:', error);
      
      // 에러 유형별 처리
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API 키가 유효하지 않습니다. 관리자가 올바른 API 키를 등록했는지 확인하세요.' },
          { status: 500 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI API 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        );
      } else if (response.status === 402) {
        return NextResponse.json(
          { error: 'OpenAI API 결제 정보를 확인해주세요. 관리자에게 문의하세요.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'AI 조언을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '{}';

    // 디버깅: AI 응답 로그
    console.log('OpenAI Response:', aiResponse.substring(0, 200) + '...');

    // JSON 파싱
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      // JSON 파싱 실패 시 기본 응답
      parsedResponse = {
        advice: aiResponse,
        recommendations: ['정기적인 건강 검진을 받으세요.'],
        priority: 'medium',
      };
    }

    // 응답 검증 및 기본값 설정
    const result = {
      advice: parsedResponse.advice || '건강한 생활 습관을 유지하세요.',
      recommendations: Array.isArray(parsedResponse.recommendations)
        ? parsedResponse.recommendations
        : ['규칙적인 운동', '균형 잡힌 식단', '충분한 수면'],
      warnings: Array.isArray(parsedResponse.warnings) ? parsedResponse.warnings : undefined,
      priority: parsedResponse.priority || 'medium',
      isPremium: true,
      usageInfo: subscription?.tier === 'pro' ? undefined : {
        used: (subscription?.aiRequestsUsed || 0) + 1,
        limit: subscription?.aiRequestsLimit || 0,
        remaining: (subscription?.aiRequestsLimit || 0) - (subscription?.aiRequestsUsed || 0) - 1,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Health Advice Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
