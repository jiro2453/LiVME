-- LIVME v1.0.0 Complete Database Setup
-- このSQLファイルをSupabase SQL Editorで実行してください

-- ================================================
-- 1. usersテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '未設定',
  avatar_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- ================================================
-- 2. livesテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  venue TEXT NOT NULL,
  artist_name TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_lives_user_id ON lives(user_id);
CREATE INDEX IF NOT EXISTS idx_lives_date ON lives(date);

-- ================================================
-- 3. followsテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ================================================
-- 4. トリガー（updated_at自動更新）
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users テーブルのトリガー
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- lives テーブルのトリガー
DROP TRIGGER IF EXISTS update_lives_updated_at ON lives;
CREATE TRIGGER update_lives_updated_at
  BEFORE UPDATE ON lives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 5. RLS（Row Level Security）ポリシー
-- ================================================

-- users テーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 誰でも全ユーザー情報を閲覧可能
DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
CREATE POLICY "Anyone can view user profiles"
  ON users FOR SELECT
  USING (true);

-- 自分のプロフィールのみ更新可能
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 新規ユーザー作成（認証済みユーザーのみ）
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON users;
CREATE POLICY "Authenticated users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- lives テーブルのRLS
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;

-- 誰でも全ライブ情報を閲覧可能
DROP POLICY IF EXISTS "Anyone can view lives" ON lives;
CREATE POLICY "Anyone can view lives"
  ON lives FOR SELECT
  USING (true);

-- 自分のライブのみ挿入可能
DROP POLICY IF EXISTS "Users can insert own lives" ON lives;
CREATE POLICY "Users can insert own lives"
  ON lives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のライブのみ更新可能
DROP POLICY IF EXISTS "Users can update own lives" ON lives;
CREATE POLICY "Users can update own lives"
  ON lives FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分のライブのみ削除可能
DROP POLICY IF EXISTS "Users can delete own lives" ON lives;
CREATE POLICY "Users can delete own lives"
  ON lives FOR DELETE
  USING (auth.uid() = user_id);

-- follows テーブルのRLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 誰でもフォロー関係を閲覧可能
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

-- 認証済みユーザーのみフォロー可能
DROP POLICY IF EXISTS "Authenticated users can follow" ON follows;
CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- 自分のフォローのみ削除可能
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ================================================
-- 6. Storageバケット設定
-- ================================================
-- Supabase Dashboard の Storage セクションで以下のバケットを作成してください：
-- バケット名: images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- 完了！
