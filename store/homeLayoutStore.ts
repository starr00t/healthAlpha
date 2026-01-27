import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HomeWidget = 
  | 'schedule'
  | 'health-status'
  | 'goals'
  | 'health-analysis'
  | 'ai-advice';

interface HomeLayoutState {
  widgets: {
    id: HomeWidget;
    enabled: boolean;
    order: number;
  }[];
  userId: string | null;
  userEmail: string | null;
  syncEnabled: boolean;
  isSyncing: boolean;
  
  setUserId: (userId: string, email?: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  toggleWidget: (id: HomeWidget) => void;
  moveWidget: (id: HomeWidget, direction: 'up' | 'down') => void;
  resetLayout: () => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

const defaultWidgets = [
  { id: 'schedule' as HomeWidget, enabled: true, order: 0 },
  { id: 'health-status' as HomeWidget, enabled: true, order: 1 },
  { id: 'goals' as HomeWidget, enabled: true, order: 2 },
  { id: 'health-analysis' as HomeWidget, enabled: true, order: 3 },
  { id: 'ai-advice' as HomeWidget, enabled: true, order: 4 },
];

export const useHomeLayoutStore = create<HomeLayoutState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      userId: null,
      userEmail: null,
      syncEnabled: true,
      isSyncing: false,
      
      setUserId: async (userId, email = null) => {
        set({ userId, userEmail: email });
        
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
      
      toggleWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        }));
        get().syncToServer();
      },
      
      moveWidget: (id, direction) => {
        set((state) => {
          const widgets = [...state.widgets].sort((a, b) => a.order - b.order);
          const index = widgets.findIndex((w) => w.id === id);
          
          if (index === -1) return state;
          
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          
          if (newIndex < 0 || newIndex >= widgets.length) return state;
          
          const temp = widgets[index].order;
          widgets[index].order = widgets[newIndex].order;
          widgets[newIndex].order = temp;
          
          return { widgets };
        });
        get().syncToServer();
      },
      
      resetLayout: () => {
        set({ widgets: defaultWidgets });
        get().syncToServer();
      },

      syncToServer: async () => {
        const { userEmail, widgets, syncEnabled, isSyncing } = get();
        if (!syncEnabled || !userEmail || isSyncing) return;

        set({ isSyncing: true });
        try {
          await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: userEmail, 
              type: 'homeLayout',
              data: { widgets }
            }),
          });
        } catch (error) {
          console.error('❌ 홈 레이아웃 동기화 실패:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncFromServer: async () => {
        const { userEmail, syncEnabled } = get();
        if (!syncEnabled || !userEmail) return;

        try {
          const response = await fetch(`/api/preferences?email=${encodeURIComponent(userEmail)}&type=homeLayout`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.preferences?.widgets) {
              set({ widgets: data.preferences.widgets });
            }
          }
        } catch (error) {
          console.error('❌ 홈 레이아웃 다운로드 실패:', error);
        }
      },
    }),
    {
      name: 'health-alpha-home-layout',
    }
  )
);
