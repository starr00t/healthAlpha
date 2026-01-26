'use client';

import { useHomeLayoutStore, HomeWidget } from '@/store/homeLayoutStore';
import { useState } from 'react';

const widgetNames: Record<HomeWidget, string> = {
  'schedule': '📅 오늘의 일정',
  'health-status': '📊 오늘의 건강 현황',
  'goals': '🎯 목표 달성률',
  'health-analysis': '📊 건강데이터 분석',
  'ai-advice': '💡 최근 건강 조언',
};

export default function HomeLayoutSettings() {
  const { widgets, toggleWidget, moveWidget, resetLayout } = useHomeLayoutStore();
  const [isOpen, setIsOpen] = useState(false);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* 설정 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg z-40"
        title="홈 화면 설정"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* 설정 모달 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                홈 화면 설정
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                표시할 위젯을 선택하고 순서를 변경하세요
              </p>

              <div className="space-y-2">
                {sortedWidgets.map((widget, index) => (
                  <div
                    key={widget.id}
                    className={`border rounded-lg p-4 ${
                      widget.enabled
                        ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={widget.enabled}
                          onChange={() => toggleWidget(widget.id)}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <span className={`font-medium ${
                          widget.enabled
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {widgetNames[widget.id]}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="위로 이동"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          disabled={index === sortedWidgets.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="아래로 이동"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
              <button
                onClick={resetLayout}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                기본값으로 복원
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-primary-500 text-white hover:bg-primary-600 rounded-lg"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
