-- LIVME 新規登録時にpublic.usersにデータが追加されない問題の修正SQL
-- このSQLをSupabase SQL Editorで実行してください

-- ================================================
-- 1. 現在のRLSポリシーを確認
-- ================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- ================================================
-- 2. 既存のINSERTポリシーを削除
-- ================================================
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON users;

-- ================================================
-- 3. 新しいINSERTポリシーを作成（より緩和された条件）
-- ================================================
-- 方法1: 認証済みユーザーなら誰でも自分のプロフィールを作成可能
CREATE POLICY "Authenticated users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ================================================
-- 4. 念のため、RLSが有効になっているか確認
-- ================================================
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- もしrowsecurity = falseの場合、以下を実行
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 5. テーブルのDEFAULT値を確認
-- ================================================
SELECT
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ================================================
-- 6. テスト: 手動でユーザーを作成してみる
-- ================================================
-- 以下のSQLは、auth.usersに存在するユーザーの1人を
-- public.usersに手動で作成してテストします

-- まず、auth.usersからユーザーIDを取得
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ORDER BY created_at DESC
LIMIT 1;

-- 上記で取得したIDを使って、以下のSQLを実行（IDを置き換えてください）
-- INSERT INTO public.users (id, user_id, name, bio, images, social_links, created_at, updated_at)
-- VALUES (
--   'ここにauth.usersのIDを入れる',
--   'test_user',
--   'テストユーザー',
--   '未設定',
--   '[]'::jsonb,
--   '{}'::jsonb,
--   NOW(),
--   NOW()
-- );

-- ================================================
-- 完了メッセージ
-- ================================================
SELECT '✅ RLSポリシーを修正しました。再度新規登録を試してください。' AS message;
