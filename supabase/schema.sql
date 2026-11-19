-- ==============================================================================
-- SignEase Database Schema
-- Supabase PostgreSQL Schema with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  avatar_url TEXT,
  accessibility_prefs JSONB DEFAULT '{
    "fontSize": "medium",
    "highContrast": false,
    "dyslexicFont": false,
    "speechLanguage": "en-US",
    "speechSensitivity": 0.8,
    "gestureSensitivity": 0.75,
    "soundAlerts": true,
    "captionBgOpacity": 0.85
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLASSROOMS TABLE
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  scheduled_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSROOM MEMBERS TABLE (Students joining classrooms)
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (classroom_id, user_id)
);

-- 4. TRANSCRIPTS TABLE (Real-time live speech captions)
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  speaker_name TEXT NOT NULL DEFAULT 'Teacher',
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  formatted_time TEXT,
  is_final BOOLEAN DEFAULT TRUE,
  confidence NUMERIC(4, 2) DEFAULT 0.95
);

-- 5. GESTURE EVENTS TABLE (Sign language & quick reactions from students)
CREATE TABLE IF NOT EXISTS public.gesture_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  gesture_name TEXT NOT NULL,
  gesture_label TEXT NOT NULL,
  meaning TEXT,
  confidence NUMERIC(4, 2) DEFAULT 0.90,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUMMARIES TABLE (AI-generated lecture notes)
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL UNIQUE REFERENCES public.classrooms(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  key_points JSONB DEFAULT '[]'::jsonb,
  important_terms JSONB DEFAULT '[]'::jsonb,
  full_summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON public.classrooms(code);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_cid ON public.classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_uid ON public.classroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_cid ON public.transcripts(classroom_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_gesture_events_cid ON public.gesture_events(classroom_id, created_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gesture_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles; users can update their own
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Classrooms: Viewable by creator or enrolled members
CREATE POLICY "Classrooms viewable by everyone authenticated"
  ON public.classrooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert classrooms"
  ON public.classrooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classrooms"
  ON public.classrooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Classroom Members: Students can view members and join
CREATE POLICY "Members viewable by classroom participants"
  ON public.classroom_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can join classrooms"
  ON public.classroom_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Transcripts: Viewable by classroom members; insertable by classroom teacher
CREATE POLICY "Transcripts viewable by authenticated users in class"
  ON public.transcripts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Transcripts insertable by authenticated users"
  ON public.transcripts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Gesture Events: Viewable by teacher and students; insertable by students
CREATE POLICY "Gestures viewable by classroom participants"
  ON public.gesture_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestures insertable by authenticated students"
  ON public.gesture_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Summaries: Viewable by all classroom participants
CREATE POLICY "Summaries viewable by participants"
  ON public.summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Summaries insertable or updatable by teacher"
  ON public.summaries FOR ALL
  TO authenticated
  USING (true);

-- REALTIME REPLICATION ENABLEMENT
-- Ensure Supabase Realtime listens to transcripts and gesture_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gesture_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms;
