import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HealthGoal, Reminder } from '@/types/goals';

interface GoalsStore {
  goals: HealthGoal[];
  reminders: Reminder[];
  addGoal: (goal: Omit<HealthGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<HealthGoal>) => void;
  deleteGoal: (id: string) => void;
  getActiveGoals: (userId: string) => HealthGoal[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  getActiveReminders: (userId: string) => Reminder[];
  syncToServer: (userEmail: string) => Promise<void>;
  loadFromServer: (userEmail: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: [],
      reminders: [],

      addGoal: (goal) => {
        const newGoal: HealthGoal = {
          ...goal,
          id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates } : goal
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
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
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...updates } : reminder
          ),
        }));
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.id !== id),
        }));
      },

      getActiveReminders: (userId) => {
        return get().reminders.filter(
          (reminder) => reminder.userId === userId && reminder.isActive
        );
      },

      syncToServer: async (userEmail: string) => {
        try {
          const { goals, reminders } = get();
          const response = await fetch('/api/goals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': userEmail,
            },
            body: JSON.stringify({ goals, reminders }),
          });

          if (!response.ok) {
            console.error('Failed to sync goals to server');
          }
        } catch (error) {
          console.error('Sync to server error:', error);
        }
      },

      loadFromServer: async (userEmail: string) => {
        try {
          const response = await fetch('/api/goals', {
            headers: {
              'x-user-email': userEmail,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.goals) {
              set({
                goals: data.goals.goals || [],
                reminders: data.goals.reminders || [],
              });
            }
          }
        } catch (error) {
          console.error('Load from server error:', error);
        }
      },
    }),
    {
      name: 'health-goals',
    }
  )
);
