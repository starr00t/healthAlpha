'use client';

import { useHealthStore } from '@/store/healthStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

interface BackupData {
  version: string;
  exportDate: string;
  userId: string;
  userData: {
    email: string;
    name: string;
    profile?: any;
  };
  healthRecords: any[];
  diaries: any[];
  events: any[];
  notes: any[];
}

export default function DataManagement() {
  const { records: healthRecords } = useHealthStore();
  const { diaries, events } = useCalendarStore();
  const { notes } = useNoteStore();
  const { user } = useAuthStore();
  const [importStatus, setImportStatus] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // 전체 데이터 내보내기 (건강기록 + 다이어리 + 일정 + 노트 + 프로필)
  const handleExportAll = () => {
    if (!user) return;

    const backupData: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: user.id,
      userData: {
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
      healthRecords,
      diaries,
      events,
      notes,
    };

    const jsonData = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-alpha-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportStatus('✅ 전체 데이터를 성공적으로 내보냈습니다!');
    setTimeout(() => setImportStatus(''), 3000);
  };

  // 건강 기록만 내보내기
  const handleExport = () => {
    const jsonData = JSON.stringify(healthRecords, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportStatus('✅ 건강 기록을 성공적으로 내보냈습니다!');
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const data = JSON.parse(jsonData);

        // 백업 파일 형식 확인
        if (data.version && data.healthRecords && data.diaries && data.events) {
          // 전체 백업 복원
          if (window.confirm('⚠️ 전체 데이터를 복원하시겠습니까? 현재 데이터가 모두 대체됩니다.')) {
            useHealthStore.getState().importData(JSON.stringify(data.healthRecords));
            // 다이어리, 이벤트, 노트는 store에 직접 설정
            useCalendarStore.setState({ 
              diaries: data.diaries,
              events: data.events,
            });
            if (data.notes) {
              useNoteStore.setState({ notes: data.notes });
            }
            setImportStatus('✅ 전체 데이터를 성공적으로 복원했습니다!');
          }
        } else if (Array.isArray(data)) {
          // 건강 기록만 복원
          if (window.confirm('⚠️ 건강 기록을 복원하시겠습니까? 현재 기록이 모두 대체됩니다.')) {
            useHealthStore.getState().importData(jsonData);
            setImportStatus('✅ 건강 기록을 성공적으로 복원했습니다!');
          }
        } else {
          throw new Error('잘못된 백업 파일 형식입니다.');
        }
        
        setTimeout(() => setImportStatus(''), 3000);
      } catch (error) {
        setImportStatus('❌ 데이터 복원에 실패했습니다. 파일을 확인해주세요.');
        setTimeout(() => setImportStatus(''), 3000);
      }
    };
    reader.readAsText(file);
    // 파일 입력 초기화
    e.target.value = '';
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert('이 브라우저는 공유 기능을 지원하지 않습니다.');
      return;
    }

    if (!user) return;

    const backupData: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: user.id,
      userData: {
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
      healthRecords,
      diaries,
      events,
      notes,
    };

    const jsonData = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const file = new File([blob], `health-alpha-backup-${new Date().toISOString().split('T')[0]}.json`, {
      type: 'application/json',
    });

    try {
      await navigator.share({
        title: 'Health Alpha 백업 데이터',
        text: '내 건강 관리 데이터를 공유합니다',
        files: [file],
      });
      setImportStatus('✅ 데이터를 공유했습니다!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  const handleCopyToClipboard = () => {
    if (!user) return;

    const backupData: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: user.id,
      userData: {
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
      healthRecords,
      diaries,
      events,
      notes,
    };

    const jsonData = JSON.stringify(backupData, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
      setImportStatus('✅ 전체 데이터를 클립보드에 복사했습니다!');
      setTimeout(() => setImportStatus(''), 3000);
    });
  };

  // 데이터 통계
  const totalRecords = healthRecords.length + diaries.length + events.length + notes.length;
  const dataSize = new Blob([JSON.stringify({ healthRecords, diaries, events, notes })]).size;
  const dataSizeKB = (dataSize / 1024).toFixed(2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">💾 데이터 관리</h2>

      {/* 데이터 통계 */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-300 font-medium">건강 기록</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-100">{healthRecords.length}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-300 font-medium">다이어리</div>
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-100">{diaries.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-300 font-medium">일정</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-100">{events.length}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 p-4 rounded-lg">
          <div className="text-sm text-amber-600 dark:text-amber-300 font-medium">노트</div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-100">{notes.length}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg">
          <div className="text-sm text-orange-600 dark:text-orange-300 font-medium">데이터 크기</div>
          <div className="text-2xl font-bold text-orange-800 dark:text-orange-100">{dataSizeKB}KB</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* 전체 백업 */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            전체 백업 (권장)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            건강 기록, 다이어리, 일정, 노트를 모두 포함한 완전한 백업 파일을 생성합니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportAll}
              disabled={totalRecords === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-md"
            >
              📦 전체 백업 다운로드
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              disabled={totalRecords === 0}
              className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            >
              👁️ 미리보기
            </button>
          </div>
        </div>

        {/* 미리보기 */}
        {showPreview && user && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">백업 미리보기</h4>
            <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-60 overflow-y-auto">
              {JSON.stringify({
                version: '1.0',
                exportDate: new Date().toISOString(),
                userId: user.id,
                userData: { email: user.email, name: user.name },
                healthRecords: `${healthRecords.length}개 항목`,
                diaries: `${diaries.length}개 항목`,
                events: `${events.length}개 항목`,
                notes: `${notes.length}개 항목`,
              }, null, 2)}
            </pre>
          </div>
        )}

        {/* 건강 기록만 백업 */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-xl">📊</span>
            건강 기록만 백업
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            건강 기록(체중, 혈압, 혈당)만 JSON 파일로 다운로드합니다.
          </p>
          <button
            onClick={handleExport}
            disabled={healthRecords.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
          >
            💉 건강 기록 다운로드
          </button>
        </div>

        {/* 데이터 복원 */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-xl">📥</span>
            데이터 복원
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            이전에 백업한 JSON 파일을 업로드하여 데이터를 복원합니다.
            <br />
            <span className="text-red-600 dark:text-red-400 font-medium">⚠️ 현재 데이터가 모두 대체됩니다!</span>
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
              file:text-sm file:font-semibold file:bg-green-600 file:text-white 
              hover:file:bg-green-700 file:cursor-pointer cursor-pointer
              bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        {/* 데이터 공유 */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-xl">🔗</span>
            데이터 공유
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            백업 데이터를 다른 앱이나 사람과 공유합니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShare}
              disabled={totalRecords === 0}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
            >
              📤 파일 공유
            </button>
            <button
              onClick={handleCopyToClipboard}
              disabled={totalRecords === 0}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
            >
              📋 클립보드에 복사
            </button>
          </div>
        </div>

        {/* 상태 메시지 */}
        {importStatus && (
          <div className={`p-4 rounded-lg text-center font-medium border ${
            importStatus.includes('✅') 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          }`}>
            {importStatus}
          </div>
        )}

        {/* 주의사항 */}
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            주의사항
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• 데이터는 브라우저의 로컬 스토리지에 저장됩니다</li>
            <li>• 브라우저 데이터를 삭제하면 기록이 영구적으로 사라집니다</li>
            <li>• <strong>최소 주 1회 백업</strong>을 권장합니다</li>
            <li>• 백업 파일은 안전한 곳(클라우드, 외장하드)에 보관하세요</li>
            <li>• 다른 기기에서 복원할 때는 같은 이메일로 로그인 후 복원하세요</li>
          </ul>
        </div>

        {/* 자동 백업 안내 */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span>
            자동 백업 팁
          </h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            매주 일요일 저녁에 백업 다운로드 알림을 설정하는 것을 권장합니다.
            <br />
            구글 드라이브나 드롭박스에 자동 업로드하면 더욱 안전합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
