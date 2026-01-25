'use client';

import { useState, useMemo } from 'react';
import { useHealthStore } from '@/store/healthStore';
import { useCalendarStore } from '@/store/calendarStore';
import { HealthRecord } from '@/types/health';
import { DiaryEntry, CalendarEvent } from '@/types/calendar';

type SearchCategory = 'all' | 'health' | 'diary' | 'event';

interface SearchResult {
  type: 'health' | 'diary' | 'event';
  data: HealthRecord | DiaryEntry | CalendarEvent;
  matchedFields: string[];
}

export default function UnifiedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  
  const { records: healthRecords } = useHealthStore();
  const { diaries, events } = useCalendarStore();

  // 검색 로직
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && !dateFilter.start && !dateFilter.end) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // 날짜 필터 체크
    const isInDateRange = (date: string) => {
      if (!dateFilter.start && !dateFilter.end) return true;
      const recordDate = new Date(date);
      if (dateFilter.start && recordDate < new Date(dateFilter.start)) return false;
      if (dateFilter.end && recordDate > new Date(dateFilter.end)) return false;
      return true;
    };

    // 건강 기록 검색
    if (category === 'all' || category === 'health') {
      healthRecords.forEach((record) => {
        if (!isInDateRange(record.date)) return;
        
        const matchedFields: string[] = [];
        
        // 날짜 검색
        if (record.date.includes(query)) matchedFields.push('날짜');
        
        // 체중 검색
        if (record.weight && record.weight.toString().includes(query)) matchedFields.push('체중');
        
        // 혈압 검색
        if (record.bloodPressure) {
          if (record.bloodPressure.systolic.toString().includes(query) ||
              record.bloodPressure.diastolic.toString().includes(query)) {
            matchedFields.push('혈압');
          }
        }
        
        // 혈당 검색
        if (record.bloodSugar && record.bloodSugar.toString().includes(query)) {
          matchedFields.push('혈당');
        }
        
        // 메모 검색
        if (record.notes && record.notes.toLowerCase().includes(query)) {
          matchedFields.push('메모');
        }

        if (matchedFields.length > 0 || (!query && isInDateRange(record.date))) {
          results.push({ type: 'health', data: record, matchedFields });
        }
      });
    }

    // 다이어리 검색
    if (category === 'all' || category === 'diary') {
      diaries.forEach((diary) => {
        if (!isInDateRange(diary.date)) return;
        
        const matchedFields: string[] = [];
        
        // 날짜 검색
        if (diary.date.includes(query)) matchedFields.push('날짜');
        
        // 내용 검색
        if (diary.content.toLowerCase().includes(query)) {
          matchedFields.push('내용');
        }
        
        // 태그 검색
        if (diary.tags && diary.tags.some(tag => tag.toLowerCase().includes(query))) {
          matchedFields.push('태그');
        }
        
        // 활동 검색
        if (diary.activities && diary.activities.some(act => act.toLowerCase().includes(query))) {
          matchedFields.push('활동');
        }

        if (matchedFields.length > 0 || (!query && isInDateRange(diary.date))) {
          results.push({ type: 'diary', data: diary, matchedFields });
        }
      });
    }

    // 일정 검색
    if (category === 'all' || category === 'event') {
      events.forEach((event) => {
        if (!isInDateRange(event.date)) return;
        
        const matchedFields: string[] = [];
        
        // 날짜 검색
        if (event.date.includes(query)) {
          matchedFields.push('날짜');
        }
        
        // 제목 검색
        if (event.title.toLowerCase().includes(query)) {
          matchedFields.push('제목');
        }
        
        // 설명 검색
        if (event.description && event.description.toLowerCase().includes(query)) {
          matchedFields.push('설명');
        }
        
        // 장소 검색 (CalendarEvent에는 location이 없음)
        
        // 카테고리 검색
        if (event.category.toLowerCase().includes(query)) {
          matchedFields.push('카테고리');
        }

        if (matchedFields.length > 0 || (!query && isInDateRange(event.date))) {
          results.push({ type: 'event', data: event, matchedFields });
        }
      });
    }

    // 날짜순 정렬 (최신순)
    return results.sort((a, b) => {
      const dateA = a.data.date;
      const dateB = b.data.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [searchQuery, category, dateFilter, healthRecords, diaries, events]);

  // 하이라이트 텍스트
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark>
        : part
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">🔍 통합 검색</h2>

      {/* 검색 입력 */}
      <div className="space-y-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="키워드로 검색... (날짜, 내용, 태그, 체중, 혈압 등)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: '전체', icon: '🔍' },
            { value: 'health', label: '건강 기록', icon: '💉' },
            { value: 'diary', label: '다이어리', icon: '📔' },
            { value: 'event', label: '일정', icon: '📅' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value as SearchCategory)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                category === cat.value
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* 날짜 필터 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              시작 날짜
            </label>
            <input
              type="date"
              value={dateFilter.start || ''}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              종료 날짜
            </label>
            <input
              type="date"
              value={dateFilter.end || ''}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          {(dateFilter.start || dateFilter.end) && (
            <button
              onClick={() => setDateFilter({})}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all self-end"
            >
              날짜 필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            검색 결과 <span className="text-blue-600 dark:text-blue-400">({searchResults.length})</span>
          </h3>
          {searchResults.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter({});
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              검색 초기화
            </button>
          )}
        </div>

        {/* 결과 표시 */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {searchResults.length === 0 && (searchQuery || dateFilter.start || dateFilter.end) && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">검색 결과가 없습니다</p>
              <p className="text-sm mt-2">다른 키워드나 날짜 범위로 시도해보세요</p>
            </div>
          )}

          {searchResults.length === 0 && !searchQuery && !dateFilter.start && !dateFilter.end && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">💡</div>
              <p className="text-lg">검색어를 입력하거나 날짜를 선택하세요</p>
              <p className="text-sm mt-2">건강 기록, 다이어리, 일정을 통합 검색할 수 있습니다</p>
            </div>
          )}

          {searchResults.map((result, index) => (
            <div
              key={`${result.type}-${index}`}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                hover:shadow-md transition-all bg-white dark:bg-gray-750"
            >
              {/* 건강 기록 */}
              {result.type === 'health' && 'weight' in result.data && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💉</span>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">건강 기록</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {highlightText(result.data.date, searchQuery)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 
                            text-xs rounded-full"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {result.data.weight && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span className="text-gray-600 dark:text-gray-400">체중:</span>{' '}
                        <strong>{highlightText(result.data.weight.toString(), searchQuery)}kg</strong>
                      </div>
                    )}
                    {result.data.bloodPressure && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span className="text-gray-600 dark:text-gray-400">혈압:</span>{' '}
                        <strong>
                          {highlightText(result.data.bloodPressure.systolic.toString(), searchQuery)}/
                          {highlightText(result.data.bloodPressure.diastolic.toString(), searchQuery)}
                        </strong>
                      </div>
                    )}
                    {result.data.bloodSugar && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span className="text-gray-600 dark:text-gray-400">혈당:</span>{' '}
                        <strong>{highlightText(result.data.bloodSugar.toString(), searchQuery)}mg/dL</strong>
                      </div>
                    )}
                  </div>
                  {result.data.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {highlightText(result.data.notes, searchQuery)}
                    </p>
                  )}
                </div>
              )}

              {/* 다이어리 */}
              {result.type === 'diary' && 'content' in result.data && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📔</span>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          다이어리
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {highlightText(result.data.date, searchQuery)}
                          {result.data.mood && ` • ${result.data.mood}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 
                            text-xs rounded-full"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                    {highlightText(result.data.content, searchQuery)}
                  </p>
                  {result.data.tags && result.data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.data.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                            text-xs rounded"
                        >
                          #{highlightText(tag, searchQuery)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 일정 */}
              {result.type === 'event' && 'category' in result.data && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {highlightText(result.data.title, searchQuery)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {highlightText(result.data.date, searchQuery)}
                          {result.data.startTime && ` ${result.data.startTime}`}
                          {result.data.endTime && ` - ${result.data.endTime}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 
                            text-xs rounded-full"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  {result.data.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {highlightText(result.data.description, searchQuery)}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {highlightText(result.data.category, searchQuery)}
                    </span>
                    {result.data.isAllDay && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        📅 종일
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
