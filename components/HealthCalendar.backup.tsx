'use client';

import { useHealthStore } from '@/store/healthStore';
import { useState, useMemo } from 'react';
import { HealthRecord } from '@/types/health';

export default function HealthCalendar() {
  const records = useHealthStore((state) => state.records);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 현재 월의 날짜들 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 일요일부터 시작
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    // 6주치 날짜 생성 (42일)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // 날짜별 기록 매핑
  const recordsByDate = useMemo(() => {
    const map = new Map<string, HealthRecord[]>();
    records.forEach((record) => {
      // 시간대 변환 문제를 피하기 위해 날짜 문자열을 직접 사용
      const dateKey = record.date.split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(record);
    });
    return map;
  }, [records]);

  const getRecordsForDate = (date: Date): HealthRecord[] => {
    // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 영향 없이)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return recordsByDate.get(dateKey) || [];
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

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const selectedDateRecords = selectedDate ? getRecordsForDate(selectedDate) : [];

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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">건강 캘린더</h2>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            오늘
          </button>
        </div>

        {/* 월 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          
          <button
            onClick={nextMonth}
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

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  relative aspect-square p-2 rounded-lg transition-all
                  ${dateIsCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                  ${dateIsToday ? 'bg-primary-100 dark:bg-primary-900/30 font-bold' : ''}
                  ${dateIsSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
                  ${!dateIsSelected && dateIsCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                  ${dateHasRecords ? 'font-semibold' : ''}
                `}
              >
                <div className="text-sm">{date.getDate()}</div>
                {getRecordIndicators(date)}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>체중</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>혈압</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span>혈당</span>
            </div>
          </div>
        </div>
      </div>

      {/* 선택된 날짜의 기록 */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            {selectedDate.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </h3>

          {selectedDateRecords.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              이 날짜에 기록된 데이터가 없습니다.
            </p>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
