// 걷기 데이터 자동 계산 유틸리티

/**
 * 걸음수로부터 걸은 시간과 칼로리를 자동 계산
 * @param steps 걸음수
 * @param userWeight 사용자 체중 (kg) - 선택사항, 기본값 70kg
 * @returns {walkingTime: 분, calories: kcal}
 */
export function calculateWalkingMetrics(steps: number, userWeight?: number) {
  if (!steps || steps <= 0) {
    return { walkingTime: 0, calories: 0 };
  }

  const weight = userWeight || 70; // 기본 체중 70kg
  
  // 걸은 시간 계산: 평균 분당 100보 기준
  const walkingTime = Math.round(steps / 100);
  
  // 칼로리 계산: 걸음수 × 체중 × 0.0005
  // 이 공식은 평균적인 걷기 운동 강도 기준
  const calories = Math.round(steps * weight * 0.0005);
  
  return { walkingTime, calories };
}

/**
 * 최근 체중 기록에서 체중 가져오기
 * @param records 건강 기록 배열
 * @returns 최근 체중 또는 undefined
 */
export function getRecentWeight(records: any[]): number | undefined {
  const recordsWithWeight = records.filter(r => r.weight && r.weight > 0);
  if (recordsWithWeight.length === 0) return undefined;
  
  // 최신 기록 순으로 정렬되어 있다고 가정
  return recordsWithWeight[0].weight;
}

/**
 * 걸음수와 사용자 건강 기록을 기반으로 자동 계산된 걷기 데이터 생성
 * @param steps 걸음수
 * @param records 기존 건강 기록 (체중 추출용)
 */
export function createWalkingData(steps: number, records: any[] = []) {
  const userWeight = getRecentWeight(records);
  return calculateWalkingMetrics(steps, userWeight);
}
