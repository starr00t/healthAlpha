-- Health Alpha Database Schema for Supabase

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 건강 기록 테이블
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bloodPressure', 'bloodSugar', 'weight', 'exercise', 'sleep', 'steps', 'water', 'medication', 'other')),
  
  -- 혈압
  systolic INTEGER,
  diastolic INTEGER,
  
  -- 혈당
  blood_sugar INTEGER,
  
  -- 체중
  weight DECIMAL(5,2),
  
  -- 운동
  exercise_type TEXT,
  duration INTEGER,
  calories INTEGER,
  
  -- 수면
  sleep_hours DECIMAL(4,2),
  sleep_quality TEXT CHECK (sleep_quality IN ('good', 'fair', 'poor')),
  
  -- 걸음수
  steps INTEGER,
  
  -- 물 섭취
  water_ml INTEGER,
  
  -- 약물
  medication TEXT,
  dosage TEXT,
  
  -- 기타
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 노트 테이블
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  font_size TEXT DEFAULT 'medium',
  font_family TEXT DEFAULT 'sans-serif',
  photos TEXT[], -- Storage URL 배열
  videos TEXT[], -- Storage URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 캘린더 일정 테이블
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT,
  end_time TEXT,
  repeat TEXT CHECK (repeat IN ('none', 'daily', 'weekly', 'monthly')),
  repeat_end_date DATE,
  repeat_group_id UUID,
  category TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 다이어리 테이블
CREATE TABLE IF NOT EXISTS diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('verygood', 'good', 'neutral', 'bad', 'verybad')),
  weather TEXT CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'snowy')),
  tags TEXT[],
  photos TEXT[], -- Storage URL 배열
  videos TEXT[], -- Storage URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 목표 테이블
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'failed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_health_records_user_date ON health_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON diaries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, date);
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (사용자는 자신의 데이터만 접근 가능)
-- 참고: Supabase Auth를 사용하지 않고 커스텀 인증을 사용하므로,
-- 서버 사이드에서 user_id를 검증하고 service_role 키를 사용합니다.
-- 따라서 RLS는 추가 보안 계층으로만 작동합니다.

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diaries_updated_at BEFORE UPDATE ON diaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
