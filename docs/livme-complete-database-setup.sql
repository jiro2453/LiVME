-- LIVME v1.0.0 Complete Database Setup
-- このSQLファイルをSupabase SQL Editorで実行してください
-- 実際のSupabaseスキーマに完全対応

-- ================================================
-- 1. usersテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '未設定',
  avatar TEXT,
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
  artist TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_lives_date ON lives(date);
CREATE INDEX IF NOT EXISTS idx_lives_created_by ON lives(created_by);

-- ================================================
-- 3. live_attendees テーブル（参加者）
-- ================================================
CREATE TABLE IF NOT EXISTS live_attendees (
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (live_id, user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_live_attendees_live_id ON live_attendees(live_id);
CREATE INDEX IF NOT EXISTS idx_live_attendees_user_id ON live_attendees(user_id);

-- ================================================
-- 4. followsテーブル
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
-- 5. トリガー（updated_at自動更新）
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

-- live_attendees テーブルのトリガー
DROP TRIGGER IF EXISTS update_live_attendees_updated_at ON live_attendees;
CREATE TRIGGER update_live_attendees_updated_at
  BEFORE UPDATE ON live_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. RLS（Row Level Security）ポリシー
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

-- 認証済みユーザーはライブを追加可能
DROP POLICY IF EXISTS "Authenticated users can insert lives" ON lives;
CREATE POLICY "Authenticated users can insert lives"
  ON lives FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 自分が作成したライブのみ更新可能
DROP POLICY IF EXISTS "Users can update own lives" ON lives;
CREATE POLICY "Users can update own lives"
  ON lives FOR UPDATE
  USING (auth.uid() = created_by);

-- 自分が作成したライブのみ削除可能
DROP POLICY IF EXISTS "Users can delete own lives" ON lives;
CREATE POLICY "Users can delete own lives"
  ON lives FOR DELETE
  USING (auth.uid() = created_by);

-- live_attendees テーブルのRLS
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

-- 誰でもライブ参加者を閲覧可能
DROP POLICY IF EXISTS "Anyone can view live attendees" ON live_attendees;
CREATE POLICY "Anyone can view live attendees"
  ON live_attendees FOR SELECT
  USING (true);

-- 認証済みユーザーはライブに参加可能
DROP POLICY IF EXISTS "Authenticated users can join lives" ON live_attendees;
CREATE POLICY "Authenticated users can join lives"
  ON live_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分の参加記録のみ削除可能
DROP POLICY IF EXISTS "Users can leave lives" ON live_attendees;
CREATE POLICY "Users can leave lives"
  ON live_attendees FOR DELETE
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
-- 7. Storageバケット設定
-- ================================================
-- Supabase Dashboard の Storage セクションで以下のバケットを作成してください：
-- バケット名: images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- ================================================
-- 8. 検証クエリ
-- ================================================
-- 以下のクエリを実行して、すべてが正しくセットアップされたか確認できます

-- テーブル一覧
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- RLS有効化確認
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ポリシー一覧
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- 完了！
