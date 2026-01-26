import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSettings {
  openaiApiKey?: string;
  openaiModel?: string;
  maxTokens?: number;
  temperature?: number;
  enableAIFeatures?: boolean;
}

interface AdminStore {
  settings: AdminSettings;
  updateSettings: (settings: Partial<AdminSettings>) => void;
  getOpenAIApiKey: () => string | undefined;
  hasApiKey: () => boolean;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      settings: {
        openaiModel: 'gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.7,
        enableAIFeatures: true, // 기본값 true로 변경
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      getOpenAIApiKey: () => {
        return get().settings.openaiApiKey;
      },

      hasApiKey: () => {
        const key = get().settings.openaiApiKey;
        return !!key && key.length > 0;
      },
    }),
    {
      name: 'health-alpha-admin-settings',
    }
  )
);
