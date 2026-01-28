import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HealthRecord } from '@/types/health';

interface HealthStore {
  records: HealthRecord[];
  userId: string | null;
  userEmail: string | null;
  syncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  setUserId: (userId: string | null, email?: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  addRecord: (record: Omit<HealthRecord, 'id'>) => void;
  updateRecord: (id: string, record: Partial<HealthRecord>) => void;
  updateOrAddRecord: (date: string, record: Partial<HealthRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByDateRange: (startDate: string, endDate: string) => HealthRecord[];
  exportData: () => string;
  importData: (jsonData: string) => void;
  clearRecords: () => void;
}

// 유저별 데이터를 관리하는 헬퍼 함수
const getUserStorageKey = (userId: string) => `health-storage-${userId}`;

const loadUserRecords = (userId: string | null): HealthRecord[] => {
  if (!userId || typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getUserStorageKey(userId));
  return stored ? JSON.parse(stored) : [];
};

const saveUserRecords = (userId: string | null, records: HealthRecord[]) => {
  if (!userId || typeof window === 'undefined') return;
  localStorage.setItem(getUserStorageKey(userId), JSON.stringify(records));
};

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      records: [],
      userId: null,
      userEmail: null,
      syncEnabled: true, // 기본값: 동기화 활성화
      isSyncing: false,
      lastSyncTime: null,

      setUserId: async (userId, email = null) => {
        const records = loadUserRecords(userId);
        set({ userId, userEmail: email, records });
        
        // 로그인 시 서버에서 데이터 자동 다운로드
        if (userId && email && get().syncEnabled) {
          await get().syncFromServer();
        }
      },

      setSyncEnabled: (enabled) => {
        set({ syncEnabled: enabled });
        if (enabled && get().userEmail) {
          // 동기화 활성화 시 즉시 서버로 업로드
          get().syncToServer();
        }
      },

      // 서버로 데이터 업로드
      syncToServer: async () => {
        const { userEmail, records, syncEnabled, isSyncing } = get();
        if (!syncEnabled || !userEmail || isSyncing) return;

        set({ isSyncing: true });
        try {
          const response = await fetch('/api/health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, records }),
          });

          if (response.ok) {
            set({ lastSyncTime: new Date().toISOString() });
            console.log('✅ 서버 동기화 완료');
          }
        } catch (error) {
          console.error('❌ 서버 동기화 실패:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // 서버에서 데이터 다운로드
      syncFromServer: async () => {
        const { userEmail, syncEnabled, userId } = get();
        if (!syncEnabled || !userEmail) return;

        try {
          const response = await fetch(`/api/health?email=${encodeURIComponent(userEmail)}`);
          
          if (response.ok) {
            const { records: serverRecords } = await response.json();
            
            // 빈 데이터 필터링
            const validRecords = serverRecords.filter((record: HealthRecord) => {
              return record.weight || record.bloodPressure || record.bloodSugar || 
                     (record.steps && record.steps > 0) || 
                     (record.calories && record.calories > 0);
            });
            
            if (validRecords.length > 0) {
              set({ records: validRecords, lastSyncTime: new Date().toISOString() });
              saveUserRecords(userId, validRecords);
              console.log('✅ 서버 데이터 다운로드 완료:', validRecords.length, '개');
              
              // 빈 데이터가 제거된 경우 서버에 다시 동기화
              if (validRecords.length < serverRecords.length) {
                console.log('🧹 빈 데이터', serverRecords.length - validRecords.length, '개 제거됨');
                setTimeout(() => get().syncToServer(), 1000);
              }
            }
          }
        } catch (error) {
          console.error('❌ 서버 데이터 다운로드 실패:', error);
        }
      },

      clearRecords: () => {
        set({ records: [], userId: null, userEmail: null });
      },
      
      addRecord: (record) => {
        const { userId } = get();
        
        // 빈 데이터 검증: 주요 필드 중 하나라도 값이 있어야 함
        const hasData = record.weight || record.bloodPressure || record.bloodSugar || 
                       (record.steps && record.steps > 0) || 
                       (record.calories && record.calories > 0);
        
        if (!hasData) {
          console.warn('⚠️ 빈 건강 기록은 저장되지 않습니다.');
          return;
        }
        
        const newRecord: HealthRecord = {
          ...record,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        const updatedRecords = [...get().records, newRecord].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        set({ records: updatedRecords });
        saveUserRecords(userId, updatedRecords);
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },
      
      updateRecord: (id, updatedData) => {
        const { userId } = get();
        const updatedRecords = get().records.map((record) =>
          record.id === id ? { ...record, ...updatedData } : record
        );
        set({ records: updatedRecords });
        saveUserRecords(userId, updatedRecords);
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },
      
      deleteRecord: (id) => {
        const { userId } = get();
        const updatedRecords = get().records.filter((record) => record.id !== id);
        set({ records: updatedRecords });
        saveUserRecords(userId, updatedRecords);
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },
      
      updateOrAddRecord: (date, updatedData) => {
        const { userId, records } = get();
        
        // 해당 날짜의 기존 기록 찾기 (날짜만 비교)
        const dateStr = date.split('T')[0];
        const existingRecord = records.find(r => r.date.split('T')[0] === dateStr);
        
        if (existingRecord) {
          // 기존 기록 업데이트
          const updatedRecords = records.map((record) =>
            record.id === existingRecord.id ? { ...record, ...updatedData } : record
          );
          set({ records: updatedRecords });
          saveUserRecords(userId, updatedRecords);
          
          console.log('✅ 기존 기록 업데이트:', dateStr, updatedData);
        } else {
          // 새 기록 추가 (빈 데이터 검증)
          const hasData = updatedData.weight || updatedData.bloodPressure || updatedData.bloodSugar || 
                         (updatedData.steps && updatedData.steps > 0) || 
                         (updatedData.calories && updatedData.calories > 0);
          
          if (!hasData) {
            console.warn('⚠️ 빈 건강 기록은 저장되지 않습니다.');
            return;
          }
          
          const newRecord: HealthRecord = {
            ...updatedData,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: date,
          } as HealthRecord;
          
          const updatedRecords = [...records, newRecord].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          set({ records: updatedRecords });
          saveUserRecords(userId, updatedRecords);
          
          console.log('✅ 새 기록 추가:', dateStr, updatedData);
        }
        
        // 자동 동기화
        if (get().syncEnabled) {
          get().syncToServer();
        }
      },
      
      getRecordsByDateRange: (startDate, endDate) => {
        const { records } = get();
        return records.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
      },
      
      exportData: () => {
        const { records } = get();
        return JSON.stringify(records, null, 2);
      },
      
      importData: (jsonData) => {
        const { userId } = get();
        try {
          const importedRecords = JSON.parse(jsonData) as HealthRecord[];
          set({ records: importedRecords });
          saveUserRecords(userId, importedRecords);
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      },
    }),
    {
      name: 'health-storage-state',
      partialize: (state) => ({ 
        userId: state.userId,
        userEmail: state.userEmail,
        syncEnabled: state.syncEnabled,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
