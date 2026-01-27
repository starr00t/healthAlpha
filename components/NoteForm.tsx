'use client';

import { useNoteStore } from '@/store/noteStore';
import { useState } from 'react';

interface NoteFormProps {
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
  noteId?: string;
}

export default function NoteForm({ date, onClose, onSuccess, noteId }: NoteFormProps) {
  const { notes, addNote, updateNote } = useNoteStore();
  const { userId } = useNoteStore.getState();
  
  const existingNote = noteId ? notes.find(n => n.id === noteId) : null;
  
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const dateStr = date.toISOString().split('T')[0] + 'T00:00:00.000Z';

    if (noteId) {
      updateNote(noteId, { title: title.trim(), content: content.trim() });
    } else {
      addNote({
        userId,
        date: dateStr,
        title: title.trim(),
        content: content.trim(),
      });
    }

    onSuccess();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
          placeholder="예: 병원 진료 메모, 약 복용 기록, 운동 일지 등"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white resize-none"
          placeholder="자유롭게 메모를 작성하세요..."
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          {noteId ? '수정' : '추가'}
        </button>
      </div>
    </form>
  );
}
