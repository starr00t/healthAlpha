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
  userEmail: string | null;
  syncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  
  setUserEmail: (email: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
  getOpenAIApiKey: () => string | undefined;
  hasApiKey: () => boolean;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      settings: {
        openaiModel: 'gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.7,
        enableAIFeatures: true,
      },
      
      userEmail: null,
      syncEnabled: true,
      isSyncing: false,
      lastSyncTime: null,

      setUserEmail: async (email) => {
        set({ userEmail: email });
        
        // 로그인 시 서버에서 설정 자동 다운로드
        if (email && get().syncEnabled) {
          await get().syncFromServer();
        }
      },

      setSyncEnabled: (enabled) => {
        set({ syncEnabled: enabled });
        if (enabled && get().userEmail) {
          get().syncToServer();
        }
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        
        // 설정 변경 시 자동 동기화
        if (get().syncEnabled && get().userEmail) {
          get().syncToServer();
        }
      },

      getOpenAIApiKey: () => {
        return get().settings.openaiApiKey;
      },

      hasApiKey: () => {
        const key = get().settings.openaiApiKey;
        return !!key && key.length > 0;
      },

      // 서버로 설정 업로드
      syncToServer: async () => {
        const { userEmail, settings, syncEnabled, isSyncing } = get();
        if (!syncEnabled || !userEmail || isSyncing) return;

        set({ isSyncing: true });
        try {
          const response = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: userEmail, 
              type: 'adminSettings',
              data: { settings }
            }),
          });

          if (response.ok) {
            set({ lastSyncTime: new Date().toISOString() });
            console.log('✅ 관리자 설정 동기화 완료');
          }
        } catch (error) {
          console.error('❌ 관리자 설정 동기화 실패:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // 서버에서 설정 다운로드
      syncFromServer: async () => {
        const { userEmail, syncEnabled } = get();
        if (!syncEnabled || !userEmail) return;

        try {
          const response = await fetch(`/api/preferences?email=${encodeURIComponent(userEmail)}&type=adminSettings`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.preferences?.settings) {
              set({ 
                settings: data.preferences.settings,
                lastSyncTime: new Date().toISOString()
              });
              console.log('✅ 관리자 설정 다운로드 완료');
            }
          }
        } catch (error) {
          console.error('❌ 관리자 설정 다운로드 실패:', error);
        }
      },
    }),
    {
      name: 'health-alpha-admin-settings',
    }
  )
);
