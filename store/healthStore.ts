import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HealthRecord } from '@/types/health';

interface HealthStore {
  records: HealthRecord[];
  userId: string | null;
  setUserId: (userId: string | null) => void;
  addRecord: (record: Omit<HealthRecord, 'id'>) => void;
  updateRecord: (id: string, record: Partial<HealthRecord>) => void;
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

      setUserId: (userId) => {
        const records = loadUserRecords(userId);
        set({ userId, records });
      },

      clearRecords: () => {
        set({ records: [], userId: null });
      },
      
      addRecord: (record) => {
        const { userId } = get();
        const newRecord: HealthRecord = {
          ...record,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        const updatedRecords = [...get().records, newRecord].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        set({ records: updatedRecords });
        saveUserRecords(userId, updatedRecords);
      },
      
      updateRecord: (id, updatedData) => {
        const { userId } = get();
        const updatedRecords = get().records.map((record) =>
          record.id === id ? { ...record, ...updatedData } : record
        );
        set({ records: updatedRecords });
        saveUserRecords(userId, updatedRecords);
      },
      
      deleteRecord: (id) => {
        const { userId } = get();
        const updatedRecords = get().records.filter((record) => record.id !== id);
        set({ records: updatedRecords });
        saveUserRecords(userId, updatedRecords);
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
      partialize: (state) => ({ userId: state.userId }),
    }
  )
);
