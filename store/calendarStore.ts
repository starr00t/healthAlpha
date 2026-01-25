import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent, DiaryEntry } from '@/types/calendar';

interface CalendarStore {
  events: CalendarEvent[];
  diaries: DiaryEntry[];
  userId: string | null;
  
  // User management
  setUserId: (userId: string) => void;
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

      setUserId: (userId) => {
        set({ userId });
      },

      clearData: () => {
        set({ events: [], diaries: [] });
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
      },

      updateRepeatGroup: (repeatGroupId, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.repeatGroupId === repeatGroupId
              ? { ...event, ...updates }
              : event
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
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
      },

      updateDiary: (id, updates) => {
        set((state) => ({
          diaries: state.diaries.map((diary) =>
            diary.id === id
              ? { ...diary, ...updates, updatedAt: new Date().toISOString() }
              : diary
          ),
        }));
      },

      deleteDiary: (id) => {
        set((state) => ({
          diaries: state.diaries.filter((diary) => diary.id !== id),
        }));
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
      }),
    }
  )
);
