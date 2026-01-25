'use client';

import { useHealthStore } from '@/store/healthStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useState, useMemo, useEffect } from 'react';
import { HealthRecord } from '@/types/health';
import { categoryColors, moodEmojis } from '@/types/calendar';
import EventForm from './EventForm';
import DiaryForm from './DiaryForm';
import DiaryDetailModal from './DiaryDetailModal';

type ViewMode = 'month' | 'week';
type ModalType = 'health' | 'event' | 'diary' | null;

export default function HealthCalendar() {
  const records = useHealthStore((state) => state.records);
  const addRecord = useHealthStore((state) => state.addRecord);
  const events = useCalendarStore((state) => state.events);
  const diaries = useCalendarStore((state) => state.diaries);
  const setCalendarUserId = useCalendarStore((state) => state.setUserId);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [viewDiaryId, setViewDiaryId] = useState<string | null>(null);

  // 사용자 ID 동기화
  useEffect(() => {
    const userId = useHealthStore.getState().userId;
    const userEmail = useHealthStore.getState().userEmail;
    if (userId) {
      setCalendarUserId(userId, userEmail);
    }
  }, [setCalendarUserId]);

  // 현재 보기에 따른 날짜들 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    }
    
    // 월별 보기
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, viewMode]);

  // 날짜별 기록 매핑
  const recordsByDate = useMemo(() => {
    const map = new Map<string, HealthRecord[]>();
    records.forEach((record) => {
      const dateKey = record.date.split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(record);
    });
    return map;
  }, [records]);

  // 월별 통계
  const monthlyStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthRecords = records.filter(record => {
      const [recordYear, recordMonth] = record.date.split('-').map(Number);
      return recordYear === year && recordMonth === month + 1;
    });

    if (monthRecords.length === 0) return null;

    const weights = monthRecords.filter(r => r.weight).map(r => r.weight!);
    const systolic = monthRecords.filter(r => r.bloodPressure).map(r => r.bloodPressure!.systolic);
    const diastolic = monthRecords.filter(r => r.bloodPressure).map(r => r.bloodPressure!.diastolic);
    const bloodSugars = monthRecords.filter(r => r.bloodSugar).map(r => r.bloodSugar!);

    return {
      recordCount: monthRecords.length,
      avgWeight: weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : null,
      avgSystolic: systolic.length > 0 ? Math.round(systolic.reduce((a, b) => a + b, 0) / systolic.length) : null,
      avgDiastolic: diastolic.length > 0 ? Math.round(diastolic.reduce((a, b) => a + b, 0) / diastolic.length) : null,
      avgBloodSugar: bloodSugars.length > 0 ? Math.round(bloodSugars.reduce((a, b) => a + b, 0) / bloodSugars.length) : null,
    };
  }, [records, currentDate]);

  // 연속 기록 카운트 (스트릭)
  const streak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedDates = Array.from(recordsByDate.keys())
      .sort()
      .reverse()
      .map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
      });

    let currentStreak = 0;
    let checkDate = new Date(today);

    for (const recordDate of sortedDates) {
      if (recordDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (recordDate.getTime() < checkDate.getTime()) {
        break;
      }
    }

    return currentStreak;
  }, [recordsByDate]);

  const getRecordsForDate = (date: Date): HealthRecord[] => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return recordsByDate.get(dateKey) || [];
  };

  // 건강 상태 색상 (히트맵)
  const getHealthColor = (date: Date): string => {
    const dateRecords = getRecordsForDate(date);
    if (dateRecords.length === 0) return 'bg-gray-50 dark:bg-gray-800';

    let healthScore = 0;
    let count = 0;

    dateRecords.forEach(record => {
      if (record.bloodPressure) {
        const { systolic, diastolic } = record.bloodPressure;
        if (systolic >= 140 || diastolic >= 90) healthScore -= 2;
        else if (systolic >= 130 || diastolic >= 85) healthScore -= 1;
        else healthScore += 2;
        count++;
      }
      if (record.bloodSugar) {
        if (record.bloodSugar >= 126) healthScore -= 2;
        else if (record.bloodSugar >= 110) healthScore -= 1;
        else if (record.bloodSugar >= 70) healthScore += 2;
        count++;
      }
    });

    if (count === 0) return 'bg-blue-100 dark:bg-blue-900/20';

    const avgScore = healthScore / count;
    if (avgScore >= 1.5) return 'bg-green-100 dark:bg-green-900/30';
    if (avgScore >= 0) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const hasRecords = (date: Date): boolean => {
    return getRecordsForDate(date).length > 0;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const previousPeriod = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddHealthRecord = (date: Date) => {
    setModalDate(date);
    setModalType('health');
  };

  const handleAddEvent = (date: Date) => {
    setModalDate(date);
    setModalType('event');
    setEditEventId(null);
  };

  const handleEditEvent = (date: Date, eventId: string) => {
    setModalDate(date);
    setModalType('event');
    setEditEventId(eventId);
  };

  const handleAddDiary = (date: Date) => {
    setModalDate(date);
    setModalType('diary');
  };

  const closeModal = () => {
    setModalType(null);
    setModalDate(null);
    setEditEventId(null);
  };

  const handleModalSuccess = () => {
    closeModal();
    if (modalDate) {
      setSelectedDate(modalDate);
    }
  };

  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return events.filter(event => event.date === dateKey);
  };

  const getDiaryForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return diaries.find(diary => diary.date === dateKey);
  };

  const selectedDateRecords = selectedDate ? getRecordsForDate(selectedDate) : [];
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const selectedDateDiary = selectedDate ? getDiaryForDate(selectedDate) : null;

  const getRecordIndicators = (date: Date) => {
    const dateRecords = getRecordsForDate(date);
    if (dateRecords.length === 0) return null;

    const hasWeight = dateRecords.some(r => r.weight !== undefined);
    const hasBP = dateRecords.some(r => r.bloodPressure !== undefined);
    const hasBS = dateRecords.some(r => r.bloodSugar !== undefined);

    return (
      <div className="flex gap-0.5 justify-center mt-0.5">
        {hasWeight && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
        {hasBP && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
        {hasBS && <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>}
      </div>
    );
  };

  const getPeriodTitle = () => {
    if (viewMode === 'week') {
      const weekStart = calendarDays[0];
      const weekEnd = calendarDays[6];
      return `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
    }
    return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
  };

  return (
    <div className="space-y-6">
      {/* 월별 통계 요약 */}
      {viewMode === 'month' && monthlyStats && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">이달의 건강 요약</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="text-xs opacity-90">연속 기록</div>
                <div className="text-xl font-bold">{streak}일</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs opacity-90 mb-1">기록 횟수</div>
              <div className="text-2xl font-bold">{monthlyStats.recordCount}회</div>
            </div>
            {monthlyStats.avgWeight && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-xs opacity-90 mb-1">평균 체중</div>
                <div className="text-2xl font-bold">{monthlyStats.avgWeight} kg</div>
              </div>
            )}
            {monthlyStats.avgSystolic && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-xs opacity-90 mb-1">평균 혈압</div>
                <div className="text-2xl font-bold">{monthlyStats.avgSystolic}/{monthlyStats.avgDiastolic}</div>
              </div>
            )}
            {monthlyStats.avgBloodSugar && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-xs opacity-90 mb-1">평균 혈당</div>
                <div className="text-2xl font-bold">{monthlyStats.avgBloodSugar} mg/dL</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">건강 캘린더</h2>
          <div className="flex gap-2">
            {/* 보기 모드 전환 */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                월
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                주
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              오늘
            </button>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousPeriod}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            {getPeriodTitle()}
          </h3>
          
          <button
            onClick={nextPeriod}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`text-center font-semibold text-sm py-2 ${
                index === 0 ? 'text-red-600 dark:text-red-400' : 
                index === 6 ? 'text-blue-600 dark:text-blue-400' : 
                'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dateHasRecords = hasRecords(date);
            const dateIsToday = isToday(date);
            const dateIsCurrentMonth = isCurrentMonth(date);
            const dateIsSelected = isSelected(date);
            const healthColor = getHealthColor(date);
            const dateRecords = getRecordsForDate(date);
            const dateEvents = getEventsForDate(date);
            const dateDiary = getDiaryForDate(date);
            
            // 날짜별 최신 기록 가져오기
            const latestRecord = dateRecords.length > 0 ? dateRecords[dateRecords.length - 1] : null;

            return (
              <div
                key={index}
                className="relative group"
              >
                <button
                  onClick={() => handleDateClick(date)}
                  className={`
                    w-full min-h-[120px] p-2 rounded-lg transition-all flex flex-col items-start
                    ${viewMode === 'month' && !dateIsCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                    ${dateIsToday ? 'ring-2 ring-primary-500 font-bold' : ''}
                    ${dateIsSelected ? 'ring-2 ring-primary-600 bg-primary-50 dark:bg-primary-900/20' : healthColor}
                    ${!dateIsSelected ? 'hover:ring-2 hover:ring-gray-300' : ''}
                  `}
                >
                  {/* 날짜 및 기분 (상단 배치) */}
                  <div className="w-full flex justify-between items-start mb-1">
                    <div className={`text-sm ${dateIsToday ? 'font-bold' : 'font-medium'}`}>
                      {date.getDate()}
                    </div>
                    {dateDiary?.mood && (
                      <span className="text-base" title={dateDiary.mood}>
                        {moodEmojis[dateDiary.mood]}
                      </span>
                    )}
                  </div>
                  
                  {/* 건강 데이터 표시 */}
                  {latestRecord && (
                    <div className="w-full space-y-0.5 text-left mb-1">
                      {latestRecord.weight && (
                        <div className="flex items-center gap-1 text-xs truncate">
                          <span className="text-blue-600 dark:text-blue-400">⚖️</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {latestRecord.weight}
                          </span>
                        </div>
                      )}
                      {latestRecord.bloodPressure && (
                        <div className="flex items-center gap-1 text-xs truncate">
                          <span className="text-red-600 dark:text-red-400">🩸</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {latestRecord.bloodPressure.systolic}/{latestRecord.bloodPressure.diastolic}
                          </span>
                        </div>
                      )}
                      {latestRecord.bloodSugar && (
                        <div className="flex items-center gap-1 text-xs truncate">
                          <span className="text-purple-600 dark:text-purple-400">🍬</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {latestRecord.bloodSugar}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 일정 표시 (최대 2개) */}
                  {dateEvents.length > 0 && (
                    <div className="w-full space-y-0.5 mb-1">
                      {dateEvents.slice(0, 2).map((event) => {
                        const colors = categoryColors[event.category];
                        return (
                          <div
                            key={event.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${colors.bg} ${colors.text}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                      {dateEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{dateEvents.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 다중 기록 표시 */}
                  {dateRecords.length > 1 && (
                    <div className="mt-auto text-xs text-gray-500 dark:text-gray-400">
                      건강 +{dateRecords.length - 1}
                    </div>
                  )}
                </button>
                
                {/* 메모 호버 툴팁 */}
                {(dateRecords.some(r => r.notes) || dateDiary) && (
                  <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-56 pointer-events-none">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-lg max-h-32 overflow-y-auto">
                      {dateDiary && (
                        <div className="mb-2 pb-2 border-b border-gray-600">
                          <div className="font-semibold mb-1">📔 다이어리</div>
                          <div className="text-gray-300">{dateDiary.content.substring(0, 100)}...</div>
                        </div>
                      )}
                      {dateRecords.filter(r => r.notes).map((record, i) => (
                        <div key={i} className="mb-1 last:mb-0">
                          📝 {record.notes}
                        </div>
                      ))}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">표시 정보:</span>
              <div className="flex items-center gap-1">
                <span className="text-blue-600 dark:text-blue-400 font-medium">00kg</span>
                <span className="text-gray-600 dark:text-gray-400">체중</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-600 dark:text-red-400 font-medium">000/00</span>
                <span className="text-gray-600 dark:text-gray-400">혈압</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-purple-600 dark:text-purple-400 font-medium">000</span>
                <span className="text-gray-600 dark:text-gray-400">혈당</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">건강 상태:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">양호</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500"></div>
                <span className="text-gray-600 dark:text-gray-400">주의</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">위험</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 날짜를 더블클릭하여 빠르게 기록을 추가할 수 있습니다. 여러 기록이 있는 경우 최신 기록을 표시합니다.
          </p>
        </div>
      </div>

      {/* 선택된 날짜의 상세 정보 */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {selectedDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleAddHealthRecord(selectedDate)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + 건강
              </button>
              <button
                onClick={() => handleAddEvent(selectedDate)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                + 일정
              </button>
              <button
                onClick={() => handleAddDiary(selectedDate)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                + 다이어리
              </button>
            </div>
          </div>

          {/* 다이어리 */}
          {selectedDateDiary && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedDateDiary.mood && moodEmojis[selectedDateDiary.mood]}</span>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white">오늘의 다이어리</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewDiaryId(selectedDateDiary.id)}
                    className="text-sm px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📖 상세보기
                  </button>
                  <button
                    onClick={() => {
                      setModalType('diary');
                      setModalDate(selectedDate);
                    }}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('다이어리를 삭제하시겠습니까?')) {
                        useCalendarStore.getState().deleteDiary(selectedDateDiary.id);
                      }
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div 
                className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 p-3 rounded-lg transition-colors"
                onClick={() => setViewDiaryId(selectedDateDiary.id)}
              >
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3 line-clamp-3">
                  {selectedDateDiary.content}
                </p>
                {selectedDateDiary.photos && selectedDateDiary.photos.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>📷 사진 {selectedDateDiary.photos.length}장</span>
                  </div>
                )}
                {selectedDateDiary.activities && selectedDateDiary.activities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">활동:</span>
                    {selectedDateDiary.activities.map((activity, i) => (
                      <span key={i} className="text-sm px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                        {activity}
                      </span>
                    ))}
                  </div>
                )}
                {selectedDateDiary.tags && selectedDateDiary.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDateDiary.tags.map((tag, i) => (
                      <span key={i} className="text-sm text-purple-600 dark:text-purple-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 일정 목록 */}
          {selectedDateEvents.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-3">일정</h4>
              <div className="space-y-2">
                {selectedDateEvents.map((event) => {
                  const colors = categoryColors[event.category];
                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className={`font-semibold ${colors.text}`}>{event.title}</h5>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.description}
                            </p>
                          )}
                          {!event.isAllDay && event.startTime && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              ⏰ {event.startTime} {event.endTime && `- ${event.endTime}`}
                            </p>
                          )}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.tags.map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-3">
                          {event.repeatGroupId ? (
                            <>
                              <button
                                onClick={() => {
                                  if (confirm('이 일정만 수정하시겠습니까?\n(반복 그룹에서 분리됩니다)')) {
                                    handleEditEvent(selectedDate, event.id);
                                  }
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                단일수정
                              </button>
                              <button
                                onClick={() => {
                                  const repeatLabel = event.repeat === 'daily' ? '매일' : event.repeat === 'weekly' ? '매주' : '매월';
                                  if (confirm(`${repeatLabel} 반복되는 모든 "${event.title}" 일정을 수정하시겠습니까?`)) {
                                    handleEditEvent(selectedDate, event.id);
                                  }
                                }}
                                className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                              >
                                전체수정
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                handleEditEvent(selectedDate, event.id);
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              수정
                            </button>
                          )}
                          {event.repeatGroupId ? (
                            <>
                              <button
                                onClick={() => {
                                  if (confirm('이 일정만 삭제하시겠습니까?')) {
                                    useCalendarStore.getState().deleteEvent(event.id);
                                  }
                                }}
                                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                              >
                                단일삭제
                              </button>
                              <button
                                onClick={() => {
                                  const repeatLabel = event.repeat === 'daily' ? '매일' : event.repeat === 'weekly' ? '매주' : '매월';
                                  if (confirm(`${repeatLabel} 반복되는 "${event.title}" 일정을 모두 삭제하시겠습니까?`)) {
                                    useCalendarStore.getState().deleteRepeatGroup(event.repeatGroupId!);
                                  }
                                }}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                              >
                                전체삭제
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm('일정을 삭제하시겠습니까?')) {
                                  useCalendarStore.getState().deleteEvent(event.id);
                                }
                              }}
                              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 건강 기록 */}
          {/* 건강 기록 */}
          {selectedDateRecords.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-3">건강 기록</h4>
              <div className="space-y-3">
                {selectedDateRecords.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex flex-wrap gap-3">
                      {record.weight && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
                          <div className="text-xs text-gray-600 dark:text-gray-400">체중</div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {record.weight} kg
                          </div>
                        </div>
                      )}

                      {record.bloodPressure && (
                        <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                          <div className="text-xs text-gray-600 dark:text-gray-400">혈압</div>
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                          </div>
                          {record.bloodPressure.heartRate && (
                            <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                              ❤️ {record.bloodPressure.heartRate} bpm
                            </div>
                          )}
                        </div>
                      )}

                      {record.bloodSugar && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded">
                          <div className="text-xs text-gray-600 dark:text-gray-400">혈당</div>
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {record.bloodSugar} mg/dL
                          </div>
                        </div>
                      )}
                    </div>

                    {record.notes && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <strong>메모:</strong> {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 데이터 없을 때 */}
          {selectedDateRecords.length === 0 && selectedDateEvents.length === 0 && !selectedDateDiary && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              이 날짜에 기록된 데이터가 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 모달 */}
      {modalType && modalDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {modalDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })} {modalType === 'health' ? '건강 기록' : modalType === 'event' ? (editEventId ? '일정 수정' : '일정 추가') : '다이어리'} {editEventId ? '' : '추가'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalType === 'health' && <QuickHealthForm date={modalDate} onSuccess={handleModalSuccess} />}
              {modalType === 'event' && <EventForm date={modalDate} onClose={closeModal} onSuccess={handleModalSuccess} eventId={editEventId || undefined} />}
              {modalType === 'diary' && <DiaryForm date={modalDate} onClose={closeModal} onSuccess={handleModalSuccess} />}
            </div>
          </div>
        </div>
      )}

      {/* 다이어리 상세보기 모달 */}
      {viewDiaryId && (() => {
        const diary = diaries.find(d => d.id === viewDiaryId);
        if (!diary) return null;
        return (
          <DiaryDetailModal
            diary={diary}
            onClose={() => setViewDiaryId(null)}
            onEdit={() => {
              setViewDiaryId(null);
              const diaryDate = new Date(diary.date + 'T00:00:00.000Z');
              setModalType('diary');
              setModalDate(diaryDate);
            }}
          />
        );
      })()}
    </div>
  );
}

// 빠른 건강 기록 추가 폼
function QuickHealthForm({ date, onSuccess }: { date: Date; onSuccess: () => void }) {
  const addRecord = useHealthStore((state) => state.addRecord);
  const [formData, setFormData] = useState({
    weight: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
    bloodSugar: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const record: any = {
      date: dateStr + 'T00:00:00.000Z',
      notes: formData.notes || undefined,
    };

    if (formData.weight) {
      record.weight = parseFloat(formData.weight);
    }

    if (formData.systolic && formData.diastolic) {
      record.bloodPressure = {
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
      };
    }

    if (formData.bloodSugar) {
      record.bloodSugar = parseFloat(formData.bloodSugar);
    }

    addRecord(record);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            체중 (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="예: 70.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            혈당 (mg/dL)
          </label>
          <input
            type="number"
            value={formData.bloodSugar}
            onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="예: 95"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            수축기 혈압
          </label>
          <input
            type="number"
            value={formData.systolic}
            onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            이완기 혈압
          </label>
          <input
            type="number"
            value={formData.diastolic}
            onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            심박수 (bpm)
          </label>
          <input
            type="number"
            value={formData.heartRate}
            onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="72"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          메모
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          placeholder="오늘의 건강 메모..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          저장
        </button>
      </div>
    </form>
  );
}
