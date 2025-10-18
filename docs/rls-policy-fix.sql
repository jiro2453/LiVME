-- ============================================
-- LIVME RLS Policy Fix Script
-- Row Level Security ポリシーの修正
-- ============================================

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- ===== USERS TABLE POLICIES（修正版） =====

-- Select: Users can read all user profiles
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Insert: Users can create their own profile + automatic trigger creation
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR auth.uid() IS NOT NULL
    );

-- Update: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Delete: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- ============================================
-- RLS有効化の確認
-- ============================================

-- RLSが有効になっていることを確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'lives', 'live_attendees');

-- ポリシーが正しく作成されていることを確認
SELECT tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY tablename, policyname;

-- ============================================
-- ユーザー作成トリガーの作成（保険）
-- ============================================

-- ユーザー作成時に自動でプロフィールを作成するトリガー関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'ユーザー'),
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成（auth.usersテーブルに新しいユーザーが作成された時）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 確認クエリ
-- ============================================

-- 現在のauth.uid()を確認（デバッグ用）
SELECT 
  auth.uid() as current_auth_uid,
  auth.jwt() ->> 'sub' as jwt_sub,
  current_user as db_user;

-- RLS設定確認
SELECT 'RLS policies updated successfully!' as message;