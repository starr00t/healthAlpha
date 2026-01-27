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
    localStorage.setItem(`health-notes-${userId}`, JSON.stringify(notes));
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

        const updatedNotes = [...get().notes, newNote].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        set({ notes: updatedNotes });
        saveUserNotes(userId, updatedNotes);
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      updateNote: (id, updates) => {
        const { userId } = get();
        if (!userId) return;

        const updatedNotes = get().notes.map((note) =>
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date().toISOString() } 
            : note
        );
        
        set({ notes: updatedNotes });
        saveUserNotes(userId, updatedNotes);
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
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
    }
  )
);
