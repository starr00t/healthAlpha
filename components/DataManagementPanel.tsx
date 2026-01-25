'use client';

import { useState } from 'react';
import DataManagement from './DataManagement';
import UnifiedSearch from './UnifiedSearch';

type TabType = 'search' | 'backup';

export default function DataManagementPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('search');

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🔍 통합 검색
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'backup'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            💾 데이터 백업
          </button>
        </div>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'search' && <UnifiedSearch />}
      {activeTab === 'backup' && <DataManagement />}
    </div>
  );
}
