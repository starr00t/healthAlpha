import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HealthGoal, Reminder } from '@/types/goals';

interface GoalsStore {
  goals: HealthGoal[];
  reminders: Reminder[];
  userId: string | null;
  userEmail: string | null;
  syncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  
  setUserId: (userId: string, email?: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  clearData: () => void;
  addGoal: (goal: Omit<HealthGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<HealthGoal>) => void;
  deleteGoal: (id: string) => void;
  getActiveGoals: (userId: string) => HealthGoal[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  getActiveReminders: (userId: string) => Reminder[];
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: [],
      reminders: [],
      userId: null,
      userEmail: null,
      syncEnabled: true,
      isSyncing: false,
      lastSyncTime: null,

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

      clearData: () => {
        set({ goals: [], reminders: [] });
      },

      addGoal: (goal) => {
        const newGoal: HealthGoal = {
          ...goal,
          id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
        get().syncToServer();
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates } : goal
          ),
        }));
        get().syncToServer();
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
        get().syncToServer();
      },

      getActiveGoals: (userId) => {
        return get().goals.filter((goal) => goal.userId === userId && goal.isActive);
      },

      addReminder: (reminder) => {
        const newReminder: Reminder = {
          ...reminder,
          id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ reminders: [...state.reminders, newReminder] }));
        get().syncToServer();
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...updates } : reminder
          ),
        }));
        get().syncToServer();
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.id !== id),
        }));
        get().syncToServer();
      },

      getActiveReminders: (userId) => {
        return get().reminders.filter(
          (reminder) => reminder.userId === userId && reminder.isActive
        );
      },

      syncToServer: async () => {
        const { userEmail, goals, reminders, syncEnabled, isSyncing } = get();
        if (!syncEnabled || !userEmail || isSyncing) return;

        set({ isSyncing: true });
        try {
          const response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, goals, reminders }),
          });

          if (response.ok) {
            set({ lastSyncTime: new Date().toISOString() });
            console.log('✅ 목표/알림 동기화 완료');
          }
        } catch (error) {
          console.error('❌ 목표/알림 동기화 실패:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncFromServer: async () => {
        const { userEmail, syncEnabled } = get();
        if (!syncEnabled || !userEmail) return;

        try {
          const response = await fetch(`/api/goals?email=${encodeURIComponent(userEmail)}`);

          if (response.ok) {
            const data = await response.json();
            if (data.goals) {
              set({
                goals: data.goals.goals || [],
                reminders: data.goals.reminders || [],
              });
              console.log('✅ 목표/알림 다운로드 완료');
            }
          }
        } catch (error) {
          console.error('❌ 목표/알림 다운로드 실패:', error);
        }
      },
    }),
    {
      name: 'health-goals',
    }
  )
);
