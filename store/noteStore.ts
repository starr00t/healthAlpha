import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note } from '@/types/note';

interface NoteStore {
  notes: Note[];
  userId: string | null;
  userEmail: string | null;
  syncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  
  setUserId: (userId: string | null, email?: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  getNotesByDate: (date: string) => Note[];
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

const saveUserNotes = (userId: string, notes: Note[]) => {
  if (typeof window !== 'undefined') {
    try {
      const dataStr = JSON.stringify(notes);
      const dataSizeMB = dataStr.length / 1024 / 1024;
      
      // 저장 크기 확인 (10MB 제한)
      if (dataStr.length > 10 * 1024 * 1024) {
        console.warn('노트 데이터가 너무 큽니다:', dataSizeMB.toFixed(2), 'MB');
        alert(`저장할 데이터가 너무 큽니다 (${dataSizeMB.toFixed(1)}MB).\n오래된 노트의 사진/영상을 삭제하거나 노트를 줄여주세요.`);
        throw new Error('Data too large');
      }
      
      console.log('노트 저장 크기:', dataSizeMB.toFixed(2), 'MB');
      localStorage.setItem(`health-notes-${userId}`, dataStr);
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        console.error('localStorage quota exceeded');
        alert('저장 공간이 부족합니다.\n브라우저 데이터를 정리하거나 사진/영상을 줄여주세요.');
        throw error;
      }
      throw error;
    }
  }
};

const loadUserNotes = (userId: string): Note[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(`health-notes-${userId}`);
  return data ? JSON.parse(data) : [];
};

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      userId: null,
      userEmail: null,
      syncEnabled: true,
      isSyncing: false,
      lastSyncTime: null,

      setUserId: async (userId, email = null) => {
        const notes = userId ? loadUserNotes(userId) : [];
        set({ userId, userEmail: email, notes });
        
        // 로그인 시 서버에서 데이터 자동 다운로드
        if (userId && email && get().syncEnabled) {
          await get().syncFromServer();
        }
      },

      setSyncEnabled: (enabled) => {
        set({ syncEnabled: enabled });
        if (enabled && get().userEmail) {
          get().syncToServer();
        }
      },

      addNote: (note) => {
        const { userId } = get();
        if (!userId) return;

        const newNote: Note = {
          ...note,
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const previousNotes = get().notes;
        const updatedNotes = [...previousNotes, newNote].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        try {
          // persist custom storage가 자동으로 저장하고 에러 처리
          set({ notes: updatedNotes });
          
          // 자동 동기화
          if (get().syncEnabled) {
            get().syncToServer();
          }
        } catch (error) {
          // 저장 실패 시 state 롤백
          set({ notes: previousNotes });
          console.error('노트 추가 실패:', error);
          throw error;
        }
      },

      updateNote: (id, updates) => {
        const { userId } = get();
        if (!userId) return;

        const previousNotes = get().notes;
        const updatedNotes = previousNotes.map((note) =>
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date().toISOString() } 
            : note
        );
        
        try {
          // persist custom storage가 자동으로 저장하고 에러 처리
          set({ notes: updatedNotes });
          
          // 자동 동기화
          if (get().syncEnabled) {
            get().syncToServer();
          }
        } catch (error) {
          // 저장 실패 시 state 롤백
          set({ notes: previousNotes });
          console.error('노트 수정 실패:', error);
          throw error;
        }
      },

      deleteNote: (id) => {
        const { userId } = get();
        if (!userId) return;

        const updatedNotes = get().notes.filter((note) => note.id !== id);
        set({ notes: updatedNotes });
        saveUserNotes(userId, updatedNotes);
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      getNotesByDate: (date) => {
        const dateStr = date.split('T')[0];
        return get().notes.filter((note) => note.date.startsWith(dateStr));
      },

      // 서버로 데이터 업로드
      syncToServer: async () => {
        const { userEmail, notes, syncEnabled, isSyncing } = get();
        if (!syncEnabled || !userEmail || isSyncing) return;

        set({ isSyncing: true });
        try {
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, notes }),
          });

          if (response.ok) {
            set({ lastSyncTime: new Date().toISOString() });
            console.log('✅ 노트 동기화 완료');
          }
        } catch (error) {
          console.error('❌ 노트 동기화 실패:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // 서버에서 데이터 다운로드
      syncFromServer: async () => {
        const { userEmail, syncEnabled, userId } = get();
        if (!syncEnabled || !userEmail) return;

        try {
          const response = await fetch(`/api/notes?email=${encodeURIComponent(userEmail)}`);
          
          if (response.ok) {
            const { notes: serverNotes } = await response.json();
            
            if (serverNotes && serverNotes.length > 0) {
              set({ notes: serverNotes, lastSyncTime: new Date().toISOString() });
              if (userId) {
                saveUserNotes(userId, serverNotes);
              }
              console.log('✅ 노트 다운로드 완료:', serverNotes.length, '개');
            }
          }
        } catch (error) {
          console.error('❌ 노트 다운로드 실패:', error);
        }
      },
    }),
    {
      name: 'health-notes',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            const stringified = JSON.stringify(value);
            const sizeInBytes = new Blob([stringified]).size;
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
            
            console.log(`💾 노트 저장 시도: ${sizeInMB}MB`);
            
            // 10MB 제한
            if (sizeInBytes > 10 * 1024 * 1024) {
              throw new Error(`저장 용량 초과 (${sizeInMB}MB / 10MB). 사진이나 동영상을 줄여주세요.`);
            }
            
            localStorage.setItem(name, stringified);
            console.log(`✅ 노트 저장 성공: ${sizeInMB}MB`);
          } catch (error) {
            console.error('❌ 노트 저장 실패:', error);
            
            if (error instanceof Error) {
              if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                throw new Error('저장 공간이 부족합니다. 이전 노트나 사진을 삭제해주세요.');
              }
              throw error;
            }
            throw new Error('저장 중 오류가 발생했습니다.');
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
