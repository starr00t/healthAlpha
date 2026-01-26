// 모바일 걸음수 센서 연동 유틸리티

/**
 * 안드로이드/iOS 기기에서 걸음수 센서 데이터에 접근하는 Hook
 * Generic Sensor API를 사용 (Chrome, Edge 등 지원)
 */

export interface StepCounterData {
  steps: number;
  timestamp: Date;
}

export interface StepCounterError {
  message: string;
  code: 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | 'SENSOR_ERROR';
}

/**
 * 걸음수 센서 지원 여부 확인
 */
export function isStepCounterSupported(): boolean {
  return 'Accelerometer' in window || 'StepCounter' in window;
}

/**
 * 걸음수 센서 권한 요청
 */
export async function requestStepCounterPermission(): Promise<boolean> {
  try {
    // Generic Sensor API 권한 요청
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'accelerometer' as PermissionName });
      return result.state === 'granted';
    }
    return false;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

/**
 * 모바일 기기에서 걸음수 데이터 가져오기
 * 
 * 참고: 현재 웹 브라우저에서는 직접적인 걸음수 카운터 접근이 제한적입니다.
 * 실제 구현을 위해서는:
 * 1. PWA + Web Share Target API
 * 2. Google Fit API 연동 (OAuth 필요)
 * 3. Health Connect API (Android 14+)
 * 4. React Native/Flutter 앱 개발
 * 
 * 이 함수는 기본 구조만 제공하며, 실제로는 백엔드 API를 통한 연동이 필요합니다.
 */
export async function getStepsFromDevice(): Promise<StepCounterData | StepCounterError> {
  // 브라우저 지원 확인
  if (!isStepCounterSupported()) {
    return {
      message: '이 브라우저는 걸음수 센서를 지원하지 않습니다.',
      code: 'NOT_SUPPORTED'
    };
  }

  // 권한 확인
  const hasPermission = await requestStepCounterPermission();
  if (!hasPermission) {
    return {
      message: '걸음수 센서 접근 권한이 필요합니다.',
      code: 'PERMISSION_DENIED'
    };
  }

  // TODO: 실제 센서 데이터 읽기 구현
  // 현재는 더미 데이터 반환
  return {
    message: '웹 브라우저에서는 직접적인 걸음수 데이터 접근이 제한됩니다. 수동 입력을 사용해주세요.',
    code: 'NOT_SUPPORTED'
  };
}

/**
 * Google Fit API를 통한 걸음수 데이터 가져오기
 * (백엔드 API 필요)
 */
export async function getStepsFromGoogleFit(accessToken: string, date: Date): Promise<number | null> {
  try {
    // TODO: Google Fit API 호출 구현
    // 이는 백엔드 API를 통해 처리되어야 합니다.
    console.warn('Google Fit API 연동은 아직 구현되지 않았습니다.');
    return null;
  } catch (error) {
    console.error('Failed to fetch steps from Google Fit:', error);
    return null;
  }
}

/**
 * Health Connect API를 통한 걸음수 데이터 가져오기
 * (Android 14+ 전용, PWA 필요)
 */
export async function getStepsFromHealthConnect(date: Date): Promise<number | null> {
  try {
    // TODO: Health Connect API 호출 구현
    console.warn('Health Connect API 연동은 아직 구현되지 않았습니다.');
    return null;
  } catch (error) {
    console.error('Failed to fetch steps from Health Connect:', error);
    return null;
  }
}

/**
 * 사용 가능한 걸음수 데이터 소스 확인
 */
export function getAvailableStepCounterSources(): string[] {
  const sources: string[] = ['manual']; // 수동 입력은 항상 가능

  if (isStepCounterSupported()) {
    sources.push('device_sensor');
  }

  // 추가 소스 확인
  // TODO: Google Fit, Health Connect 등의 가용성 확인

  return sources;
}
