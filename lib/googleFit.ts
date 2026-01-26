// Google Fit API 연동 유틸리티

export interface GoogleFitCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface StepsData {
  date: string;
  steps: number;
  source: string;
  timestamp: number;
}

/**
 * Google OAuth 로그인 URL 생성
 */
export function getGoogleAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  // Vercel 프로덕션 URL 고정 사용
  const redirectUri = 'https://health-alpha-nu.vercel.app/api/auth/google/callback';
  
  const scope = 'https://www.googleapis.com/auth/fitness.activity.read';
  
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * OAuth 코드로 액세스 토큰 교환
 */
export async function exchangeCodeForToken(code: string): Promise<GoogleFitCredentials> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'https://health-alpha-nu.vercel.app/api/auth/google/callback';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId || '',
      client_secret: clientSecret || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
}

/**
 * 리프레시 토큰으로 새 액세스 토큰 받기
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleFitCredentials> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
}

/**
 * Google Fit에서 오늘의 걸음수 가져오기
 */
export async function getTodaySteps(accessToken: string): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const response = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis: startOfDay.getTime(),
        endTimeMillis: endOfDay.getTime(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch steps from Google Fit');
  }

  const data = await response.json();
  
  if (!data.bucket || data.bucket.length === 0) {
    return 0;
  }

  const bucket = data.bucket[0];
  if (!bucket.dataset || bucket.dataset.length === 0) {
    return 0;
  }

  const dataset = bucket.dataset[0];
  if (!dataset.point || dataset.point.length === 0) {
    return 0;
  }

  const totalSteps = dataset.point.reduce((sum: number, point: any) => {
    const steps = point.value && point.value[0] ? point.value[0].intVal : 0;
    return sum + steps;
  }, 0);

  return totalSteps;
}

/**
 * Google Fit에서 특정 날짜의 걸음수 가져오기
 */
export async function getStepsForDate(accessToken: string, date: Date): Promise<StepsData> {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const response = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startOfDay.getTime(),
        endTimeMillis: endOfDay.getTime(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch steps from Google Fit');
  }

  const data = await response.json();
  
  let totalSteps = 0;
  if (data.bucket && data.bucket.length > 0) {
    const bucket = data.bucket[0];
    if (bucket.dataset && bucket.dataset.length > 0) {
      const dataset = bucket.dataset[0];
      if (dataset.point && dataset.point.length > 0) {
        totalSteps = dataset.point.reduce((sum: number, point: any) => {
          const steps = point.value && point.value[0] ? point.value[0].intVal : 0;
          return sum + steps;
        }, 0);
      }
    }
  }

  return {
    date: startOfDay.toISOString().split('T')[0],
    steps: totalSteps,
    source: 'google_fit',
    timestamp: Date.now(),
  };
}

/**
 * Subscriptions 설정 (Webhook)
 */
export async function createSubscription(accessToken: string): Promise<void> {
  const response = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataStreamId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        dataTypeName: 'com.google.step_count.delta',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }
}
