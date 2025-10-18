-- ============================================
-- LIVME Database Setup Script (FIXED)
-- Supabase SQL Editor で実行してください
-- ============================================

-- 1. Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LIVES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  venue VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LIVE_ATTENDEES TABLE (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS live_attendees (
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (live_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Lives indexes
CREATE INDEX IF NOT EXISTS idx_lives_date ON lives(date);
CREATE INDEX IF NOT EXISTS idx_lives_artist ON lives(artist);
CREATE INDEX IF NOT EXISTS idx_lives_venue ON lives(venue);
CREATE INDEX IF NOT EXISTS idx_lives_created_by ON lives(created_by);
CREATE INDEX IF NOT EXISTS idx_lives_created_at ON lives(created_at);

-- Live attendees indexes
CREATE INDEX IF NOT EXISTS idx_live_attendees_live_id ON live_attendees(live_id);
CREATE INDEX IF NOT EXISTS idx_live_attendees_user_id ON live_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_live_attendees_joined_at ON live_attendees(joined_at);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lives_updated_at ON lives;
CREATE TRIGGER update_lives_updated_at 
    BEFORE UPDATE ON lives 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view lives" ON lives;
DROP POLICY IF EXISTS "Authenticated users can create lives" ON lives;
DROP POLICY IF EXISTS "Users can update own lives" ON lives;
DROP POLICY IF EXISTS "Users can delete own lives" ON lives;
DROP POLICY IF EXISTS "Anyone can view live attendees" ON live_attendees;
DROP POLICY IF EXISTS "Users can join lives" ON live_attendees;
DROP POLICY IF EXISTS "Users can leave lives" ON live_attendees;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

-- ===== USERS TABLE POLICIES (FIXED) =====

-- Select: Users can read all user profiles
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Insert: Authenticated users can create their own profile
-- Fixed: Allow insertion if the user is authenticated and the ID matches auth.uid()
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

-- Update: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Delete: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- ===== LIVES TABLE POLICIES =====

-- Select: Everyone can view all lives
CREATE POLICY "Anyone can view lives" ON lives
    FOR SELECT USING (true);

-- Insert: Authenticated users can create lives
CREATE POLICY "Authenticated users can create lives" ON lives
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = created_by
    );

-- Update: Users can only update lives they created
CREATE POLICY "Users can update own lives" ON lives
    FOR UPDATE USING (auth.uid() = created_by);

-- Delete: Users can only delete lives they created
CREATE POLICY "Users can delete own lives" ON lives
    FOR DELETE USING (auth.uid() = created_by);

-- ===== LIVE_ATTENDEES TABLE POLICIES =====

-- Select: Everyone can view attendees
CREATE POLICY "Anyone can view live attendees" ON live_attendees
    FOR SELECT USING (true);

-- Insert: Users can join lives (add themselves as attendees)
CREATE POLICY "Users can join lives" ON live_attendees
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

-- Delete: Users can leave lives (remove themselves)
CREATE POLICY "Users can leave lives" ON live_attendees
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- USER CREATION FUNCTION (NEW)
-- ============================================

-- Function to handle new user creation
-- This runs with elevated privileges to bypass RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Note: Sample users will be created automatically when auth users are created
-- But we can insert some test data for development

-- Insert sample lives (only if sample users exist)
DO $$
BEGIN
  -- Check if any users exist before inserting sample data
  IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO lives (id, artist, date, venue, description, image_url, created_by) VALUES 
    (
      '10000000-0000-0000-0000-000000000001',
      'あいみょん',
      '2024-08-06',
      '武道館',
      '待望の武道館公演！チケット完売の大人気ライブです🎤',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      (SELECT id FROM users LIMIT 1)
    ),
    (
      '10000000-0000-0000-0000-000000000002',
      'YOASOBI', 
      '2024-08-10',
      '武道館',
      '夏の特別ライブ！夜に駆けるを生で聴ける貴重な機会です✨',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
      (SELECT id FROM users LIMIT 1)
    ),
    (
      '10000000-0000-0000-0000-000000000003',
      '米津玄師',
      '2024-07-01', 
      '東京ドーム',
      '過去の名演！感動的なパフォーマンスでした🎵',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
      (SELECT id FROM users LIMIT 1)
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table creation
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'lives', 'live_attendees');

-- Check sample data
SELECT 'users' as table_name, count(*) as row_count FROM users
UNION ALL
SELECT 'lives' as table_name, count(*) as row_count FROM lives  
UNION ALL
SELECT 'live_attendees' as table_name, count(*) as row_count FROM live_attendees;

-- Check RLS policies
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'lives', 'live_attendees')
ORDER BY tablename, policyname;

-- Check if the trigger function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- ============================================
-- SETUP COMPLETE MESSAGE
-- ============================================
SELECT 'LIVME データベースセットアップが完了しました！🎉' as message;
SELECT 'ユーザープロフィールの自動作成が有効になりました' as auto_profile_message;