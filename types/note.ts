// 노트 타입 정의

export interface Note {
  id: string;
  userId: string;
  date: string; // ISO 8601 날짜
  title: string;
  content: string;
  fontSize?: number; // 폰트 크기 (px)
  fontFamily?: string; // 폰트 종류
  photos?: string[]; // Base64 인코딩된 이미지들
  videos?: string[]; // Base64 인코딩된 동영상들
  createdAt: string;
  updatedAt: string;
}
