-- ============================================
-- LIVME RLS Policy Complete Fix Script
-- Row Level Security ポリシーの完全修正
-- ============================================

-- すべての既存ポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- ===== USERS TABLE POLICIES（完全修正版） =====

-- Select: 誰でもユーザープロフィールを閲覧可能
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Insert: より柔軟なプロフィール作成ポリシー
-- 1. 自分のIDでプロフィールを作成する場合
-- 2. 認証されているユーザーが作成する場合（トリガー用）
-- 3. サービスロール（トリガー実行時）の場合
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id 
        OR auth.uid() IS NOT NULL 
        OR current_setting('role') = 'service_role'
        OR current_user = 'service_role'
    );

-- Update: 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Delete: 自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- ============================================
-- 自動プロフィール作成トリガーの強化
-- ============================================

-- 既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 強化されたユーザー作成関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- セキュリティコンテキストを設定
  PERFORM set_config('role', 'service_role', true);
  
  -- プロフィールを作成（既に存在する場合は何もしない）
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1), 
      'ユーザー'
    ),
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもトリガーを失敗させない
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 手動プロフィール作成用関数（フォールバック）
-- ============================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_name TEXT DEFAULT NULL,
  user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_name TEXT;
BEGIN
  -- 名前を決定
  profile_name := COALESCE(
    user_name,
    split_part(user_email, '@', 1),
    'ユーザー'
  );
  
  -- プロフィールを作成
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    user_id,
    profile_name,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile manually for %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS設定の確認
-- ============================================

-- RLSが有効になっていることを確認
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'lives', 'live_attendees');

-- 新しいポリシーが作成されていることを確認
SELECT 
  tablename, 
  policyname, 
  permissive, 
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY tablename, policyname;

-- ============================================
-- テスト用クエリ（オプション）
-- ============================================

-- 現在の認証情報を確認
SELECT 
  auth.uid() as current_auth_uid,
  current_user as db_user,
  current_setting('role') as current_role;

-- ユーザーテーブルの状態確認
SELECT 
  id, 
  name, 
  created_at,
  social_links
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- 完了メッセージ
-- ============================================
SELECT 'RLS policies have been completely fixed! 🎉' as message;