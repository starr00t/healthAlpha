import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent, DiaryEntry } from '@/types/calendar';

interface CalendarStore {
  events: CalendarEvent[];
  diaries: DiaryEntry[];
  userId: string | null;
  userEmail: string | null;
  syncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  
  // User management
  setUserId: (userId: string, email?: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  clearData: () => void;
  
  // Events
  addEvent: (event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  updateRepeatGroup: (repeatGroupId: string, updates: Partial<CalendarEvent>) => void; // 반복 일정 전체 수정
  deleteEvent: (id: string) => void;
  deleteRepeatGroup: (repeatGroupId: string) => void; // 반복 일정 일괄 삭제
  getEventsByDate: (date: string) => CalendarEvent[];
  getEventsByDateRange: (startDate: string, endDate: string) => CalendarEvent[];
  
  // Diaries
  addDiary: (diary: Omit<DiaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateDiary: (id: string, updates: Partial<DiaryEntry>) => void;
  deleteDiary: (id: string) => void;
  getDiaryByDate: (date: string) => DiaryEntry | null;
  searchDiaries: (query: string) => DiaryEntry[];
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      events: [],
      diaries: [],
      userId: null,
      userEmail: null,
      syncEnabled: true,
      isSyncing: false,
      lastSyncTime: null,

      setUserId: async (userId, email = null) => {
        set({ userId, userEmail: email });
        
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

      // 서버로 데이터 업로드
      syncToServer: async () => {
        const { userEmail, events, diaries, syncEnabled, isSyncing } = get();
        if (!syncEnabled || !userEmail || isSyncing) return;

        set({ isSyncing: true });
        try {
          const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, events, diaries }),
          });

          if (response.ok) {
            set({ lastSyncTime: new Date().toISOString() });
            console.log('✅ 캘린더 동기화 완료');
          }
        } catch (error) {
          console.error('❌ 캘린더 동기화 실패:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // 서버에서 데이터 다운로드
      syncFromServer: async () => {
        const { userEmail, syncEnabled } = get();
        if (!syncEnabled || !userEmail) return;

        try {
          const response = await fetch(`/api/calendar?email=${encodeURIComponent(userEmail)}`);
          
          if (response.ok) {
            const { events: serverEvents, diaries: serverDiaries } = await response.json();
            if (serverEvents || serverDiaries) {
              set({ 
                events: serverEvents || [],
                diaries: serverDiaries || [],
                lastSyncTime: new Date().toISOString()
              });
              console.log('✅ 캘린더 데이터 다운로드 완료');
            }
          }
        } catch (error) {
          console.error('❌ 캘린더 데이터 다운로드 실패:', error);
        }
      },

      clearData: () => {
        set({ events: [], diaries: [], userEmail: null });
      },

      // Events
      addEvent: (eventData) => {
        const { userId } = get();
        if (!userId) return;

        const repeatGroupId = eventData.repeat && eventData.repeat !== 'none' 
          ? `repeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          : undefined;

        const baseEvent: CalendarEvent = {
          ...eventData,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          createdAt: new Date().toISOString(),
          repeatGroupId,
        };

        const eventsToAdd: CalendarEvent[] = [baseEvent];

        // 반복 일정 생성
        if (eventData.repeat && eventData.repeat !== 'none') {
          const startDate = new Date(eventData.date);
          
          // 종료일 설정 (사용자 지정 또는 기본 3개월)
          const endDate = eventData.repeatEndDate 
            ? new Date(eventData.repeatEndDate)
            : (() => {
                const defaultEnd = new Date(startDate);
                defaultEnd.setMonth(defaultEnd.getMonth() + 3);
                return defaultEnd;
              })();

          let currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            if (eventData.repeat === 'daily') {
              currentDate.setDate(currentDate.getDate() + 1);
            } else if (eventData.repeat === 'weekly') {
              currentDate.setDate(currentDate.getDate() + 7);
            } else if (eventData.repeat === 'monthly') {
              currentDate.setMonth(currentDate.getMonth() + 1);
            }

            if (currentDate <= endDate) {
              const year = currentDate.getFullYear();
              const month = String(currentDate.getMonth() + 1).padStart(2, '0');
              const day = String(currentDate.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;

              eventsToAdd.push({
                ...baseEvent,
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: dateStr,
                repeatGroupId,
              });
            }
          }
        }

        set((state) => ({
          events: [...state.events, ...eventsToAdd],
        }));
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id 
              ? { 
                  ...event, 
                  ...updates,
                  // 수정 시 반복 그룹에서 분리
                  repeatGroupId: undefined,
                  repeat: 'none'
                } 
              : event
          ),
        }));
        
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      updateRepeatGroup: (repeatGroupId, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.repeatGroupId === repeatGroupId
              ? { ...event, ...updates }
              : event
          ),
        }));
        
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
        
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      deleteRepeatGroup: (repeatGroupId) => {
        set((state) => ({
          events: state.events.filter((event) => event.repeatGroupId !== repeatGroupId),
        }));
      },

      getEventsByDate: (date) => {
        const { events, userId } = get();
        return events.filter(
          (event) => event.userId === userId && event.date === date
        );
      },

      getEventsByDateRange: (startDate, endDate) => {
        const { events, userId } = get();
        return events.filter(
          (event) =>
            event.userId === userId &&
            event.date >= startDate &&
            event.date <= endDate
        );
      },

      // Diaries
      addDiary: (diaryData) => {
        const { userId } = get();
        if (!userId) return;

        const now = new Date().toISOString();
        const newDiary: DiaryEntry = {
          ...diaryData,
          id: `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          diaries: [...state.diaries, newDiary],
        }));
        
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      updateDiary: (id, updates) => {
        set((state) => ({
          diaries: state.diaries.map((diary) =>
            diary.id === id
              ? { ...diary, ...updates, updatedAt: new Date().toISOString() }
              : diary
          ),
        }));
        
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      deleteDiary: (id) => {
        set((state) => ({
          diaries: state.diaries.filter((diary) => diary.id !== id),
        }));
        
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },

      getDiaryByDate: (date) => {
        const { diaries, userId } = get();
        return diaries.find(
          (diary) => diary.userId === userId && diary.date === date
        ) || null;
      },

      searchDiaries: (query) => {
        const { diaries, userId } = get();
        const lowerQuery = query.toLowerCase();
        
        return diaries.filter(
          (diary) =>
            diary.userId === userId &&
            (diary.content.toLowerCase().includes(lowerQuery) ||
              diary.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)))
        );
      },
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        events: state.events,
        diaries: state.diaries,
        userEmail: state.userEmail,
        syncEnabled: state.syncEnabled,
        lastSyncTime: state.lastSyncTime,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            const str = JSON.stringify(value);
            // 저장 크기 확인 (약 5MB 제한)
            if (str.length > 5 * 1024 * 1024) {
              console.warn('캘린더 데이터가 너무 큽니다:', Math.round(str.length / 1024 / 1024), 'MB');
              alert('저장할 데이터가 너무 큽니다. 다이어리의 사진/영상을 줄여주세요.');
              throw new Error('Data too large');
            }
            localStorage.setItem(name, str);
          } catch (error: any) {
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              console.error('localStorage quota exceeded for calendar');
              alert('저장 공간이 부족합니다. 다이어리의 사진이나 동영상을 줄여주세요.');
              throw error;
            }
            throw error;
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
      // 상태 변경 시 자동 동기화
      onRehydrateStorage: () => (state) => {
        if (state?.syncEnabled && state?.userEmail) {
          // 초기 로드 시 동기화
          state.syncFromServer();
        }
      },
    }
  )
);
