export type EventCategory = 'medical' | 'exercise' | 'personal' | 'work' | 'other';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  isAllDay: boolean;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string; // YYYY-MM-DD 반복 종료일
  repeatGroupId?: string; // 반복 일정 그룹 ID
  tags?: string[];
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  content: string;
  tags?: string[];
  photos?: string[]; // base64 or URLs
  activities?: string[]; // 운동, 외식 등
  fontSize?: number; // 폰트 크기 (px)
  fontFamily?: string; // 폰트 종류
  createdAt: string;
  updatedAt: string;
}

export const categoryColors: Record<EventCategory, { bg: string; text: string; border: string }> = {
  medical: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700'
  },
  exercise: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700'
  },
  personal: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700'
  },
  work: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700'
  },
  other: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600'
  }
};

export const categoryLabels: Record<EventCategory, string> = {
  medical: '병원/건강',
  exercise: '운동',
  personal: '개인',
  work: '업무',
  other: '기타'
};

export const moodEmojis = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  bad: '😔',
  terrible: '😢'
};

export const moodLabels = {
  great: '아주 좋음',
  good: '좋음',
  okay: '보통',
  bad: '나쁨',
  terrible: '매우 나쁨'
};
