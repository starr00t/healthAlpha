'use client';

import { useState, useEffect, useRef } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { moodEmojis, moodLabels } from '@/types/calendar';

interface DiaryFormProps {
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DiaryForm({ date, onClose, onSuccess }: DiaryFormProps) {
  const addDiary = useCalendarStore((state) => state.addDiary);
  const updateDiary = useCalendarStore((state) => state.updateDiary);
  const getDiaryByDate = useCalendarStore((state) => state.getDiaryByDate);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const existingDiary = getDiaryByDate(dateStr);

  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [fontSize, setFontSize] = useState(existingDiary?.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(existingDiary?.fontFamily || 'default');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState({
    mood: existingDiary?.mood || '' as any,
    content: existingDiary?.content || '',
    tags: existingDiary?.tags?.join(', ') || '',
    activities: existingDiary?.activities?.join(', ') || '',
    photos: existingDiary?.photos || [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const diaryData = {
      date: dateStr,
      mood: formData.mood || undefined,
      content: formData.content,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      activities: formData.activities ? formData.activities.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      photos: formData.photos.length > 0 ? formData.photos : undefined,
      fontSize,
      fontFamily,
    };

    if (existingDiary) {
      updateDiary(existingDiary.id, diaryData);
    } else {
      addDiary(diaryData);
    }

    onSuccess();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const fontFamilies = {
    default: 'sans-serif',
    serif: 'Georgia, serif',
    mono: 'monospace',
    cursive: 'cursive',
  };

  if (fullScreenMode) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
        {/* 전체화면 헤더 */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 다이어리
            </h2>
            <button
              type="button"
              onClick={() => setFullScreenMode(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ✕ 닫기
            </button>
          </div>

          {/* 도구 모음 */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* 폰트 크기 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">크기:</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
              </select>
            </div>

            {/* 폰트 종류 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">폰트:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="default">기본</option>
                <option value="serif">명조</option>
                <option value="mono">고정폭</option>
                <option value="cursive">필기체</option>
              </select>
            </div>

            {/* 텍스트 스타일 */}
            <div className="flex gap-1 border-l border-gray-300 dark:border-gray-600 pl-2">
              <button
                type="button"
                onClick={() => insertText('**', '**')}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold"
                title="굵게"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertText('*', '*')}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 italic"
                title="기울임"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertText('~~', '~~')}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 line-through"
                title="취소선"
              >
                S
              </button>
            </div>

            {/* 이미지 업로드 */}
            <label className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer text-sm">
              📷 사진 추가
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 기분 선택 */}
            <div className="flex gap-3 justify-center">
              {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood })}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    formData.mood === mood
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-4xl">{moodEmojis[mood]}</span>
                </button>
              ))}
            </div>

            {/* 본문 작성 */}
            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full min-h-[60vh] p-6 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="오늘 하루는 어땠나요? 자유롭게 기록해보세요..."
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: fontFamilies[fontFamily as keyof typeof fontFamilies],
                lineHeight: '1.8',
              }}
            />

            {/* 사진 미리보기 */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`사진 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 활동 & 태그 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  활동
                </label>
                <input
                  type="text"
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="운동, 독서, 외식 (쉼표로 구분)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  태그
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="좋은하루, 행복 (쉼표로 구분)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFullScreenMode(false);
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          오늘의 기분
        </label>
        <button
          type="button"
          onClick={() => setFullScreenMode(true)}
          className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
        >
          🖊️ 전체화면 에디터
        </button>
      </div>

      <div className="flex gap-2 justify-around">
        {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setFormData({ ...formData, mood })}
            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
              formData.mood === mood
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={moodLabels[mood]}
          >
            <span className="text-3xl mb-1">{moodEmojis[mood]}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{moodLabels[mood]}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          오늘의 기록 *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={8}
          placeholder="오늘 하루는 어땠나요? 건강 상태, 식사, 운동, 생각 등을 자유롭게 기록해보세요..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          활동 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={formData.activities}
          onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="예: 운동, 외식, 독서, 산책"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 오늘 한 활동들을 기록해보세요
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="예: #스트레스 #피곤 #행복"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 나중에 검색하기 쉽도록 태그를 추가하세요
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          {existingDiary ? '수정' : '저장'}
        </button>
      </div>
    </form>
  );
}
