'use client';

import { useState, useEffect, useRef } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { moodEmojis, moodLabels } from '@/types/calendar';

interface DiaryFormProps {
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}

const fontFamilies = {
  default: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  serif: `"Noto Serif KR", Georgia, "Times New Roman", serif`,
  mono: `"Fira Code", "Consolas", "Monaco", "Courier New", monospace`,
  cursive: `"Nanum Pen Script", "Caveat", cursive`,
  gothic: `"Noto Sans KR", "Malgun Gothic", sans-serif`,
  myeongjo: `"Noto Serif KR", "Batang", serif`,
};

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
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  const [wordCount, setWordCount] = useState(0);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    mood: existingDiary?.mood || '' as any,
    content: existingDiary?.content || '',
    tags: existingDiary?.tags?.join(', ') || '',
    activities: existingDiary?.activities?.join(', ') || '',
    photos: existingDiary?.photos || [] as string[],
    videos: existingDiary?.videos || [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 초기값 저장
  const [initialData] = useState({
    mood: existingDiary?.mood || '',
    content: existingDiary?.content || '',
    tags: existingDiary?.tags?.join(', ') || '',
    activities: existingDiary?.activities?.join(', ') || '',
    photos: existingDiary?.photos || [],
    videos: existingDiary?.videos || [],
  });

  // 글자 수 계산
  useEffect(() => {
    setWordCount(formData.content.length);
  }, [formData.content]);

  // 변경사항 감지
  useEffect(() => {
    const changed = 
      formData.mood !== initialData.mood ||
      formData.content !== initialData.content ||
      formData.tags !== initialData.tags ||
      formData.activities !== initialData.activities ||
      JSON.stringify(formData.photos) !== JSON.stringify(initialData.photos) ||
      JSON.stringify(formData.videos) !== JSON.stringify(initialData.videos);
    
    setHasChanges(changed);
    if (changed && saveSuccess) {
      setSaveSuccess(false);
    }
  }, [formData, initialData, saveSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const diaryData = {
        date: dateStr,
        mood: formData.mood || undefined,
        content: formData.content,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        activities: formData.activities ? formData.activities.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        photos: formData.photos.length > 0 ? formData.photos : undefined,
        videos: formData.videos.length > 0 ? formData.videos : undefined,
        fontSize,
        fontFamily,
      };

      if (existingDiary) {
        updateDiary(existingDiary.id, diaryData);
      } else {
        addDiary(diaryData);
      }

      setSaveSuccess(true);
      setHasChanges(false);
      
      // 초기 데이터 업데이트
      initialData.mood = formData.mood;
      initialData.content = formData.content;
      initialData.tags = formData.tags;
      initialData.activities = formData.activities;
      initialData.photos = [...formData.photos]; // 깊은 복사
      initialData.videos = [...formData.videos]; // 깊은 복사
      
      console.log('다이어리 저장 성공');
      
      // 1초 후 성공 메시지를 보여주고 자동으로 닫지 않음 (사용자가 닫기 버튼 클릭)
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error: any) {
      console.error('다이어리 저장 실패:', error);
      let errorMessage = '다이어리 저장에 실패했습니다.';
      
      if (error.message && error.message.includes('quota')) {
        errorMessage = '저장 공간이 부족합니다. 사진이나 동영상을 줄여주세요.';
      } else if (formData.photos.length > 0 || formData.videos.length > 0) {
        errorMessage = '사진/동영상 파일이 너무 큽니다. 크기를 줄여주세요.';
      }
      
      alert(errorMessage);
      setIsSaving(false);
      setSaveSuccess(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSize = 2 * 1024 * 1024; // 2MB

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        alert(`${file.name}은(는) 너무 큽니다. 2MB 이하의 이미지만 업로드 가능합니다.`);
        return;
      }

      // 이미지 압축
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 최대 크기 제한 (1200px)
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // JPEG 품질 0.7로 압축
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, compressedDataUrl],
          }));
        };
        img.onerror = () => {
          alert('이미지 업로드에 실패했습니다.');
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        alert('이미지 업로드에 실패했습니다.');
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        alert(`${file.name}은(는) 너무 큽니다. 10MB 이하의 동영상만 업로드 가능합니다.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          videos: [...prev.videos, reader.result as string],
        }));
      };
      reader.onerror = () => {
        alert('동영상 업로드에 실패했습니다.');
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  // HTML을 마크다운으로 변환
  const htmlToMarkdown = (html: string): string => {
    let markdown = html;
    
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    markdown = markdown.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');
    markdown = markdown.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');
    markdown = markdown.replace(/<(?:del|s|strike)[^>]*>(.*?)<\/(?:del|s|strike)>/gi, '~~$1~~');
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    markdown = markdown.replace(/<div[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/div>/gi, '');
    markdown = markdown.replace(/<p[^>]*>/gi, '');
    markdown = markdown.replace(/<\/p>/gi, '\n');
    markdown = markdown.replace(/<[^>]+>/g, '');
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&amp;/g, '&');
    
    return markdown.trim();
  };

  // 마크다운을 HTML로 변환
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^• (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  // 비주얼 모드에서 서식 적용
  const applyFormatVisual = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentEditableRef.current) {
      const html = contentEditableRef.current.innerHTML;
      const markdown = htmlToMarkdown(html);
      setFormData({ ...formData, content: markdown });
    }
  };

  // contentEditable 내용이 변경될 때
  const handleContentEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    const markdown = htmlToMarkdown(html);
    
    if (markdown !== formData.content) {
      setFormData({ ...formData, content: markdown });
    }
  };

  // 비주얼 모드로 전환할 때 마크다운을 HTML로 변환
  useEffect(() => {
    if (editorMode === 'visual' && contentEditableRef.current) {
      const currentHtml = contentEditableRef.current.innerHTML;
      const expectedHtml = markdownToHtml(formData.content);
      
      if (document.activeElement !== contentEditableRef.current) {
        contentEditableRef.current.innerHTML = expectedHtml || '';
      }
    }
  }, [editorMode]);
  
  useEffect(() => {
    if (editorMode === 'visual' && contentEditableRef.current && formData.content) {
      const currentHtml = contentEditableRef.current.innerHTML;
      const expectedHtml = markdownToHtml(formData.content);
      
      const isEmpty = !currentHtml || currentHtml === '<br>' || currentHtml.trim() === '';
      
      if (isEmpty && document.activeElement !== contentEditableRef.current) {
        contentEditableRef.current.innerHTML = expectedHtml;
      }
    }
  }, [formData.content, editorMode]);

  const insertText = (before: string, after: string = '', newLine: boolean = false) => {
    if (editorMode === 'visual') {
      if (before === '**') applyFormatVisual('bold');
      else if (before === '*') applyFormatVisual('italic');
      else if (before === '~~') applyFormatVisual('strikeThrough');
      else if (before === '# ') applyFormatVisual('formatBlock', 'h1');
      else if (before === '## ') applyFormatVisual('formatBlock', 'h2');
      else if (before === '### ') applyFormatVisual('formatBlock', 'h3');
      else if (before === '• ') applyFormatVisual('insertUnorderedList');
      else if (before === '1. ') applyFormatVisual('insertOrderedList');
      else if (before === '> ') {
        applyFormatVisual('formatBlock', 'blockquote');
      } else {
        document.execCommand('insertText', false, before + after);
        handleContentEditableInput({ currentTarget: contentEditableRef.current } as any);
      }
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);

    let newText;
    if (newLine && start > 0 && text[start - 1] !== '\n') {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      newText = text.substring(0, lineStart) + before + text.substring(lineStart);
    } else {
      newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    }
    
    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      const newPosition = newLine ? start + before.length : start + before.length;
      textarea.setSelectionRange(newPosition, newPosition + selectedText.length);
    }, 0);
  };

  const insertBulletList = () => insertText('• ', '', true);
  const insertNumberedList = () => insertText('1. ', '', true);
  const insertHeading = (level: number) => insertText('#'.repeat(level) + ' ', '', true);
  const insertQuote = () => insertText('> ', '', true);
  const insertCodeBlock = () => insertText('```\n', '\n```');
  const insertEmoji = (emoji: string) => insertText(emoji);
  const getCurrentDateTime = () => {
    const now = new Date();
    const timeStr = now.toLocaleString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    insertText(`📅 ${timeStr}\n`);
  };
  const clearFormatting = () => {
    if (confirm('모든 서식을 제거하고 일반 텍스트로 변환하시겠습니까?')) {
      const plainText = formData.content.replace(/[*~`#>]/g, '').replace(/\n{3,}/g, '\n\n');
      setFormData({ ...formData, content: plainText });
    }
  };

  return (
    <div className={`${fullScreenMode ? 'fixed inset-0 z-50' : 'relative'} bg-white dark:bg-gray-800 rounded-lg`}>
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-start md:items-center justify-between mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                {existingDiary ? '📔 다이어리 수정' : '📔 새 다이어리'}
              </h2>
              <span className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1 block">
                {wordCount.toLocaleString()}자
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorMode(editorMode === 'visual' ? 'markdown' : 'visual')}
                className="px-4 py-2.5 md:py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 text-sm md:text-base font-medium whitespace-nowrap min-h-[44px] md:min-h-0"
                title={editorMode === 'visual' ? '마크다운 모드로 전환' : '비주얼 모드로 전환'}
              >
                {editorMode === 'visual' ? '📝 MD' : '✨ 일반'}
              </button>
              <button
                type="button"
                onClick={() => setFullScreenMode(!fullScreenMode)}
                className="p-2.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xl md:text-base min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0"
                title={fullScreenMode ? '일반 모드' : '전체화면'}
              >
                {fullScreenMode ? '📉' : '📈'}
              </button>
            </div>
          </div>
        </div>

        {/* 툴바 */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setToolbarExpanded(!toolbarExpanded)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
              >
                <span>{toolbarExpanded ? '▼' : '▶'}</span>
                <span>편집 도구</span>
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">크기:</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                >
                  <option value={12}>12</option>
                  <option value={14}>14</option>
                  <option value={16}>16</option>
                  <option value={18}>18</option>
                  <option value={20}>20</option>
                  <option value={24}>24</option>
                </select>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                >
                  <option value="default">기본</option>
                  <option value="gothic">고딕</option>
                  <option value="myeongjo">명조</option>
                  <option value="mono">고정폭</option>
                </select>
              </div>
            </div>

            {toolbarExpanded && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {/* 텍스트 스타일 */}
                <div className="flex flex-wrap gap-1 items-center">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => insertText('**', '**')} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-sm min-h-[44px] md:min-h-0" title="굵게">B</button>
                    <button type="button" onClick={() => insertText('*', '*')} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 italic text-sm min-h-[44px] md:min-h-0" title="기울임">I</button>
                    <button type="button" onClick={() => insertText('~~', '~~')} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 line-through text-sm min-h-[44px] md:min-h-0" title="취소선">S</button>
                    <button type="button" onClick={() => insertText('`', '`')} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-mono text-sm min-h-[44px] md:min-h-0" title="코드">`</button>
                  </div>

                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                  <div className="flex gap-1">
                    <button type="button" onClick={() => insertHeading(1)} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold min-h-[44px] md:min-h-0" title="제목 1">H1</button>
                    <button type="button" onClick={() => insertHeading(2)} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold min-h-[44px] md:min-h-0" title="제목 2">H2</button>
                    <button type="button" onClick={() => insertHeading(3)} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold min-h-[44px] md:min-h-0" title="제목 3">H3</button>
                  </div>

                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                  <div className="flex gap-1">
                    <button type="button" onClick={insertBulletList} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm min-h-[44px] md:min-h-0" title="글머리">•</button>
                    <button type="button" onClick={insertNumberedList} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm min-h-[44px] md:min-h-0" title="번호">1.</button>
                    <button type="button" onClick={insertQuote} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm min-h-[44px] md:min-h-0" title="인용">&quot;</button>
                    <button type="button" onClick={insertCodeBlock} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-mono min-h-[44px] md:min-h-0" title="코드 블록">&lt;/&gt;</button>
                  </div>

                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                  <button type="button" onClick={getCurrentDateTime} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm min-h-[44px] md:min-h-0" title="현재 시간">🕐</button>
                  <button type="button" onClick={clearFormatting} className="px-2.5 md:px-3 py-2.5 md:py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-sm min-h-[44px] md:min-h-0" title="서식 지우기">🧹</button>
                </div>

                {/* 이모지 팔레트 */}
                <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 hidden sm:inline">빠른 이모지:</span>
                  {['💊', '🏥', '🏃', '🍽️', '💪', '😊', '📝', '✅', '⚠️', '💡', '📅', '⏰', '🎯', '🔔', '📌', '✨'].map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="px-2 py-2.5 md:py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-base md:text-lg min-h-[44px] md:min-h-0" title={`${emoji} 삽입`}>{emoji}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 기분 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              오늘의 기분
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood })}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all min-h-[70px] ${
                    formData.mood === mood
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-105'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={moodLabels[mood]}
                >
                  <span className="text-2xl mb-1">{moodEmojis[mood]}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{moodLabels[mood]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 에디터 영역 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              오늘의 기록 *
            </label>
            {editorMode === 'visual' ? (
              <div className="relative">
                {!formData.content && (
                  <div className="absolute top-4 left-6 text-gray-400 dark:text-gray-500 pointer-events-none" style={{ fontSize: `${fontSize}px` }}>
                    오늘 하루는 어땠나요?<br />
                    <span className="text-sm">💡 상단 도구로 서식을 적용할 수 있어요</span>
                  </div>
                )}
                <div
                  ref={contentEditableRef}
                  contentEditable
                  onInput={handleContentEditableInput}
                  className="w-full min-h-[30vh] p-6 border-2 border-primary-300 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white overflow-auto"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamilies[fontFamily as keyof typeof fontFamilies],
                    lineHeight: '1.8',
                  }}
                  suppressContentEditableWarning
                />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full min-h-[30vh] p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none font-mono"
                placeholder="오늘 하루는 어땠나요?

💡 마크다운 문법:
**굵게**, *기울임*, ~~취소선~~
# 제목1, ## 제목2, ### 제목3
• 글머리 기호
> 인용구
`코드`"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                }}
                required
              />
            )}
          </div>

          {/* 이미지/동영상 업로드 */}
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  <span>📷 이미지 추가</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  <span>🎥 동영상 추가</span>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 이미지 미리보기 */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img src={photo} alt={`업로드 ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
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

            {/* 동영상 미리보기 */}
            {formData.videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.videos.map((video, index) => (
                  <div key={index} className="relative group">
                    <video src={video} controls className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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

        {/* 하단 버튼 */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          {saveSuccess && !hasChanges && (
            <div className="mb-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">저장되었습니다!</span>
            </div>
          )}
          {hasChanges && (
            <div className="mb-3 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">내용이 변경되었습니다</span>
            </div>
          )}
          <div className="flex gap-2 md:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 md:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium min-h-[44px] md:min-h-0"
            >
              {saveSuccess && !hasChanges ? '닫기' : '취소'}
            </button>
            <button
              type="submit"
              disabled={isSaving || (saveSuccess && !hasChanges)}
              className="flex-1 px-4 py-3 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold min-h-[44px] md:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : saveSuccess ? (
                '✅ 저장 완료'
              ) : (
                existingDiary ? '✅ 수정 완료' : '✅ 다이어리 저장'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
