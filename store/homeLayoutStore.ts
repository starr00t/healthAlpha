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
  toggleWidget: (id: HomeWidget) => void;
  moveWidget: (id: HomeWidget, direction: 'up' | 'down') => void;
  resetLayout: () => void;
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
    (set) => ({
      widgets: defaultWidgets,
      
      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),
      
      moveWidget: (id, direction) =>
        set((state) => {
          const widgets = [...state.widgets].sort((a, b) => a.order - b.order);
          const index = widgets.findIndex((w) => w.id === id);
          
          if (index === -1) return state;
          
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          
          if (newIndex < 0 || newIndex >= widgets.length) return state;
          
          // Swap order
          const temp = widgets[index].order;
          widgets[index].order = widgets[newIndex].order;
          widgets[newIndex].order = temp;
          
          return { widgets };
        }),
      
      resetLayout: () => set({ widgets: defaultWidgets }),
    }),
    {
      name: 'health-alpha-home-layout',
    }
  )
);
