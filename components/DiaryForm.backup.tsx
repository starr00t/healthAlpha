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
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual'); // 'visual' 또는 'markdown'
  const [wordCount, setWordCount] = useState(0);
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

  // 글자 수 계산
  useEffect(() => {
    setWordCount(formData.content.length);
  }, [formData.content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          videos: [...prev.videos, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
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

  // HTML을 마크다운으로 변환
  const htmlToMarkdown = (html: string): string => {
    let markdown = html;
    
    // 제목
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    
    // 굵게
    markdown = markdown.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');
    
    // 기울임
    markdown = markdown.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');
    
    // 취소선
    markdown = markdown.replace(/<(?:del|s|strike)[^>]*>(.*?)<\/(?:del|s|strike)>/gi, '~~$1~~');
    
    // 인라인 코드
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // 인용구
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
    
    // 목록
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
    
    // 줄바꿈 및 HTML 태그 제거
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    markdown = markdown.replace(/<div[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/div>/gi, '');
    markdown = markdown.replace(/<p[^>]*>/gi, '');
    markdown = markdown.replace(/<\/p>/gi, '\n');
    markdown = markdown.replace(/<[^>]+>/g, '');
    
    // HTML 엔티티 디코딩
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&amp;/g, '&');
    
    return markdown.trim();
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

  // contentEditable 내용이 변경될 때
  const handleContentEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    // 현재 커서 위치 저장
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const cursorOffset = range ? range.startOffset : 0;
    const cursorNode = range ? range.startContainer : null;
    
    const html = e.currentTarget.innerHTML;
    const markdown = htmlToMarkdown(html);
    
    // 마크다운이 실제로 변경되었을 때만 상태 업데이트
    if (markdown !== formData.content) {
      setFormData(prev => ({ ...prev, content: markdown }));
      
      // 커서 위치 복원
      setTimeout(() => {
        if (cursorNode && range && contentEditableRef.current) {
          try {
            const newRange = document.createRange();
            newRange.setStart(cursorNode, Math.min(cursorOffset, cursorNode.textContent?.length || 0));
            newRange.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          } catch (e) {
            // 커서 복원 실패 시 무시
          }
        }
      }, 0);
    }
  };

  // 비주얼 모드로 전환할 때 마크다운을 HTML로 변환
  useEffect(() => {
    if (editorMode === 'visual' && contentEditableRef.current) {
      const currentHtml = contentEditableRef.current.innerHTML;
      const expectedHtml = markdownToHtml(formData.content);
      
      // 현재 포커스가 없을 때만 업데이트
      if (document.activeElement !== contentEditableRef.current) {
        contentEditableRef.current.innerHTML = expectedHtml || '';
      }
    }
  }, [editorMode]); // editorMode 변경 시에만 실행
  
  // formData.content가 변경될 때 비주얼 에디터 업데이트 (초기 로드 포함)
  useEffect(() => {
    if (editorMode === 'visual' && contentEditableRef.current && formData.content) {
      const currentHtml = contentEditableRef.current.innerHTML;
      const expectedHtml = markdownToHtml(formData.content);
      
      // 초기 로드 시에만 업데이트 (비어있을 때)
      const isEmpty = !currentHtml || currentHtml === '<br>' || currentHtml.trim() === '';
      
      if (isEmpty && document.activeElement !== contentEditableRef.current) {
        contentEditableRef.current.innerHTML = expectedHtml;
      }
    }
  }, [formData.content, editorMode]);

  const insertText = (before: string, after: string = '', newLine: boolean = false) => {
    if (editorMode === 'visual') {
      // 비주얼 모드에서는 execCommand 사용
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
        // 기타 텍스트 삽입
        document.execCommand('insertText', false, before + after);
        handleContentEditableInput({ currentTarget: contentEditableRef.current } as any);
      }
      return;
    }

    // 마크다운 모드
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);

    let newText;
    if (newLine && start > 0 && text[start - 1] !== '\n') {
      // 줄 시작에 삽입할 때
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

  const insertBulletList = () => {
    insertText('• ', '', true);
  };

  const insertNumberedList = () => {
    insertText('1. ', '', true);
  };

  const insertHeading = (level: number) => {
    const heading = '#'.repeat(level) + ' ';
    insertText(heading, '', true);
  };

  const insertQuote = () => {
    insertText('> ', '', true);
  };

  const insertCodeBlock = () => {
    insertText('```\n', '\n```');
  };

  const insertLink = () => {
    const url = prompt('URL을 입력하세요:');
    if (url) {
      insertText('[', `](${url})`);
    }
  };

  const insertEmoji = (emoji: string) => {
    insertText(emoji);
  };

  const clearFormatting = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    // 마크다운 문법 제거
    const cleaned = selectedText
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // 굵게
      .replace(/(\*|_)(.*?)\1/g, '$2') // 기울임
      .replace(/~~(.*?)~~/g, '$1') // 취소선
      .replace(/`(.*?)`/g, '$1') // 인라인 코드
      .replace(/^#+\s/gm, '') // 제목
      .replace(/^>\s/gm, '') // 인용
      .replace(/^[-*]\s/gm, '') // 목록
      .replace(/^\d+\.\s/gm, ''); // 번호 목록

    const newText = formData.content.substring(0, start) + cleaned + formData.content.substring(end);
    setFormData({ ...formData, content: newText });
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    insertText(`📅 ${time} - `);
  };

  if (fullScreenMode) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
        {/* 전체화면 헤더 */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start md:items-center mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">
                {date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 다이어리
              </h2>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
                {wordCount.toLocaleString()}자 · {Math.ceil(wordCount / 500)} 페이지
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorMode(editorMode === 'visual' ? 'markdown' : 'visual')}
                className="px-4 py-2.5 md:py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm md:text-base font-medium whitespace-nowrap min-h-[44px] md:min-h-0"
              >
                {editorMode === 'visual' ? '📝 MD' : '✨ 일반'}
              </button>
              <button
                type="button"
                onClick={() => setFullScreenMode(false)}
                className="px-4 py-2.5 md:py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm md:text-base font-medium min-h-[44px] md:min-h-0"
              >
                ✕ 닫기
              </button>
            </div>
          </div>

          {/* 도구 모음 */}
          <div className="space-y-2">
            {/* 첫 번째 줄: 모드 표시 및 폰트 설정 */}
            <div className="flex flex-wrap gap-2 items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-xs md:text-sm font-medium">
                {editorMode === 'visual' ? '✨ 일반 모드 (서식 자동 적용)' : '📝 마크다운 모드 (개발자)'}
              </div>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <label className="text-xs md:text-sm text-gray-600 dark:text-gray-400">크기:</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs md:text-sm"
                  >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                    <option value="22">22px</option>
                    <option value="24">24px</option>
                    <option value="28">28px</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs md:text-sm text-gray-600 dark:text-gray-400">폰트:</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs md:text-sm"
                    style={{ fontFamily: fontFamilies[fontFamily as keyof typeof fontFamilies] }}
                  >
                    <option value="default">기본 (산세리프)</option>
                    <option value="gothic">고딕</option>
                    <option value="myeongjo">명조</option>
                    <option value="mono">고정폭</option>
                    <option value="cursive">손글씨</option>
                  </select>
                </div>
              </div>

              {/* 두 번째 줄: 텍스트 스타일 */}
              <div className="flex flex-wrap gap-1 items-center">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => insertText('**', '**')}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-sm"
                    title="굵게 (Ctrl+B)"
                  >
                    <span className="hidden md:inline">굵게</span>
                    <span className="md:hidden">B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertText('*', '*')}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 italic text-sm"
                    title="기울임 (Ctrl+I)"
                  >
                    <span className="hidden md:inline">기울임</span>
                    <span className="md:hidden">I</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertText('~~', '~~')}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 line-through text-sm"
                    title="취소선"
                  >
                    <span className="hidden md:inline">취소선</span>
                    <span className="md:hidden">S</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertText('`', '`')}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-mono text-sm"
                    title="인라인 코드"
                  >
                    <span className="hidden md:inline">코드</span>
                    <span className="md:hidden">`</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => insertHeading(1)}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold"
                    title="제목 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHeading(2)}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold"
                    title="제목 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHeading(3)}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold"
                    title="제목 3"
                  >
                    H3
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={insertBulletList}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                    title="글머리 기호"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    onClick={insertNumberedList}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                    title="번호 매기기"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    onClick={insertQuote}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                    title="인용"
                  >
                    &quot;
                  </button>
                  <button
                    type="button"
                    onClick={insertCodeBlock}
                    className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-mono"
                    title="코드 블록"
                  >
                    &lt;/&gt;
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                <button
                  type="button"
                  onClick={getCurrentDateTime}
                  className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                  title="현재 시간 삽입"
                >
                  🕐
                </button>

                <button
                  type="button"
                  onClick={clearFormatting}
                  className="px-2 md:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-sm"
                  title="서식 지우기"
                >
                  🧹
                </button>

                <label className="px-2 md:px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer text-sm" title="사진 추가">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <label className="px-2 md:px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer text-sm" title="동영상 추가">
                  🎥
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 이모지 팔레트 */}
              <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">빠른 이모지:</span>
                {['❤️', '😊', '😢', '😡', '🎉', '💪', '🏃', '🍽️', '💊', '😴', '☀️', '🌙', '⭐', '💡', '📚', '🎵'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                    title={`${emoji} 삽입`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 기분 선택 */}
            <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
              {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood })}
                  className={`p-2 md:p-3 rounded-lg border-2 transition-all ${
                    formData.mood === mood
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={moodLabels[mood]}
                >
                  <span className="text-2xl md:text-4xl">{moodEmojis[mood]}</span>
                </button>
              ))}
            </div>

            {/* 본문 작성 - 모드에 따라 다른 에디터 표시 */}
            {editorMode === 'visual' ? (
              <div className="relative">
                {!formData.content && (
                  <div className="absolute top-4 left-6 text-gray-400 dark:text-gray-500 pointer-events-none" style={{ fontSize: `${fontSize}px` }}>
                    오늘 하루는 어땠나요? 자유롭게 기록해보세요...<br />
                    <span className="text-sm">💡 상단 버튼으로 굵게, 기울임, 제목 등을 적용할 수 있어요</span>
                  </div>
                )}
                <div
                  ref={contentEditableRef}
                  contentEditable
                  onInput={handleContentEditableInput}
                  className="w-full min-h-[60vh] p-4 md:p-6 border-2 border-primary-300 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white overflow-auto"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamilies[fontFamily as keyof typeof fontFamilies],
                    lineHeight: '1.8',
                  }}
                  suppressContentEditableWarning
                >
                  {/* 초기 컨텐츠는 useEffect에서 설정 */}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    ✨ 일반 모드
                  </span>
                  <span>서식이 자동으로 적용됩니다. 마크다운 문법이 보이지 않아요!</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full min-h-[60vh] p-4 md:p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none font-mono"
                  placeholder="오늘 하루는 어땠나요? 자유롭게 기록해보세요...

💡 마크다운 문법을 사용할 수 있어요:
**굵게**, *기울임*, ~~취소선~~
# 제목1, ## 제목2, ### 제목3
• 글머리 기호
1. 번호 매기기
> 인용구
`인라인 코드`"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.8',
                  }}
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-mono">
                    📝 마크다운 모드
                  </span>
                  <span>마크다운 문법을 직접 작성할 수 있어요 (개발자용)</span>
                </div>
              </div>
            )}

            {/* 사진 미리보기 */}
            {formData.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📷 사진</h3>
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
              </div>
            )}

            {/* 동영상 미리보기 */}
            {formData.videos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🎥 동영상</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="relative group">
                      <video
                        src={video}
                        controls
                        className="w-full h-48 object-cover rounded-lg bg-black"
                      />
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
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
          오늘의 기분
        </label>
        <button
          type="button"
          onClick={() => setFullScreenMode(true)}
          className="w-full sm:w-auto text-sm md:text-base px-4 py-2.5 md:py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 shadow-sm font-medium min-h-[44px] md:min-h-0"
        >
          🖊️ 전문 에디터로 작성하기
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
        {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setFormData({ ...formData, mood })}
            className={`flex flex-col items-center p-2 md:p-3 rounded-lg border-2 transition-all min-h-[80px] md:min-h-[100px] ${
              formData.mood === mood
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-105'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={moodLabels[mood]}
          >
            <span className="text-2xl md:text-3xl mb-1">{moodEmojis[mood]}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{moodLabels[mood]}</span>
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

      <div className="flex gap-2 md:gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 md:py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium min-h-[44px] md:min-h-0"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-3 md:py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium min-h-[44px] md:min-h-0"
        >
          {existingDiary ? '수정' : '저장'}
        </button>
      </div>
    </form>
  );
}
