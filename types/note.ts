// 노트 타입 정의

export interface Note {
  id: string;
  userId: string;
  date: string; // ISO 8601 날짜
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
