'use client';

import { DiaryEntry, moodEmojis, moodLabels } from '@/types/calendar';
import { useCalendarStore } from '@/store/calendarStore';
import { useState } from 'react';

interface DiaryDetailModalProps {
  diary: DiaryEntry;
  onClose: () => void;
  onEdit: () => void;
}

export default function DiaryDetailModal({ diary, onClose, onEdit }: DiaryDetailModalProps) {
  const deleteDiary = useCalendarStore((state) => state.deleteDiary);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'markdown'>('visual');

  const handleDelete = () => {
    if (confirm('다이어리를 삭제하시겠습니까?')) {
      deleteDiary(diary.id);
      onClose();
    }
  };

  const fontFamilies = {
    default: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    serif: `"Noto Serif KR", Georgia, "Times New Roman", serif`,
    mono: `"Fira Code", "Consolas", "Monaco", "Courier New", monospace`,
    cursive: `"Nanum Pen Script", "Caveat", cursive`,
    gothic: `"Noto Sans KR", "Malgun Gothic", sans-serif`,
    myeongjo: `"Noto Serif KR", "Batang", serif`,
  };

  // 마크다운을 HTML로 변환
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // 제목
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // 굵게
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 기울임
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 취소선
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // 인라인 코드
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // 인용구
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 글머리 기호
    html = html.replace(/^• (.+)$/gm, '<li>$1</li>');
    
    // 번호 매기기
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // 줄바꿈
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  const formattedDate = new Date(diary.date + 'T00:00:00.000Z').toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {formattedDate}
              </h2>
              {diary.mood && (
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{moodEmojis[diary.mood]}</span>
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    {moodLabels[diary.mood]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'visual' ? 'markdown' : 'visual')}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                title={viewMode === 'visual' ? '마크다운 보기' : '일반 보기'}
              >
                {viewMode === 'visual' ? '🔤 마크다운' : '👁️ 일반'}
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ 삭제
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6 space-y-6">
            {/* 다이어리 내용 */}
            {viewMode === 'visual' ? (
              <div 
                className="prose prose-lg dark:prose-invert max-w-none p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                style={{
                  fontSize: diary.fontSize ? `${diary.fontSize}px` : '16px',
                  fontFamily: diary.fontFamily ? fontFamilies[diary.fontFamily as keyof typeof fontFamilies] : fontFamilies.default,
                  lineHeight: '1.8',
                }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(diary.content) }}
              />
            ) : (
              <div 
                className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg font-mono text-sm"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                }}
              >
                {diary.content}
              </div>
            )}

            {/* 사진 갤러리 */}
            {diary.photos && diary.photos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  📷 사진 ({diary.photos.length}장)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {diary.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo}
                        alt={`사진 ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-2xl">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 활동 */}
            {diary.activities && diary.activities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  🏃 활동
                </h3>
                <div className="flex flex-wrap gap-2">
                  {diary.activities.map((activity, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 태그 */}
            {diary.tags && diary.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  🏷️ 태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {diary.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 메타 정보 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>작성: {new Date(diary.createdAt).toLocaleString('ko-KR')}</span>
                {diary.updatedAt !== diary.createdAt && (
                  <span>수정: {new Date(diary.updatedAt).toLocaleString('ko-KR')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사진 확대 모달 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
          >
            ✕
          </button>
          <img
            src={selectedPhoto}
            alt="확대된 사진"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
