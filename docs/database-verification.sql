-- LIVME データベース検証スクリプト
-- このSQLをSupabase SQL Editorで実行して、データベースの状態を確認してください

-- ================================================
-- 1. テーブルの存在確認
-- ================================================
SELECT 'テーブルの存在確認' AS check_type;

SELECT
  table_name,
  CASE
    WHEN table_name IN ('users', 'lives', 'follows') THEN '✅ OK'
    ELSE '⚠️ 不明なテーブル'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 期待される結果: users, lives, follows が表示されること

-- ================================================
-- 2. usersテーブルの構造確認
-- ================================================
SELECT 'usersテーブルの構造確認' AS check_type;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 期待される結果:
-- id (uuid), user_id (text), name (text), bio (text),
-- avatar (text), images (jsonb), social_links (jsonb),
-- created_at (timestamptz), updated_at (timestamptz)

-- ================================================
-- 3. livesテーブルの構造確認
-- ================================================
SELECT 'livesテーブルの構造確認' AS check_type;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lives'
ORDER BY ordinal_position;

-- 期待される結果:
-- id (uuid), artist (text), date (date), venue (text),
-- description (text), image_url (text), created_by (uuid),
-- created_at (timestamptz), updated_at (timestamptz)

-- ================================================
-- 4. followsテーブルの構造確認
-- ================================================
SELECT 'followsテーブルの構造確認' AS check_type;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'follows'
ORDER BY ordinal_position;

-- 期待される結果:
-- id (uuid), follower_id (uuid), following_id (uuid), created_at (timestamptz)

-- ================================================
-- 5. RLS（Row Level Security）の確認
-- ================================================
SELECT 'RLSの有効化状態' AS check_type;

SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS有効'
    ELSE '❌ RLS無効'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 期待される結果: すべてのテーブルでRLSが有効になっていること

-- ================================================
-- 6. RLSポリシーの確認
-- ================================================
SELECT 'RLSポリシーの確認' AS check_type;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 期待される結果:
-- users: Anyone can view user profiles, Users can update own profile, Authenticated users can insert own profile
-- lives: Anyone can view lives, Authenticated users can insert/update/delete lives
-- follows: Anyone can view follows, Authenticated users can follow, Users can unfollow

-- ================================================
-- 7. インデックスの確認
-- ================================================
SELECT 'インデックスの確認' AS check_type;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 期待される結果:
-- users: idx_users_user_id
-- lives: idx_lives_date
-- follows: idx_follows_follower, idx_follows_following

-- ================================================
-- 8. トリガーの確認
-- ================================================
SELECT 'トリガーの確認' AS check_type;

SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 期待される結果:
-- users: update_users_updated_at (BEFORE UPDATE)
-- lives: update_lives_updated_at (BEFORE UPDATE)

-- ================================================
-- 9. 外部キー制約の確認
-- ================================================
SELECT '外部キー制約の確認' AS check_type;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 期待される結果:
-- users.id → auth.users.id
-- lives.created_by → users.id
-- follows.follower_id → users.id
-- follows.following_id → users.id

-- ================================================
-- 10. データの確認
-- ================================================
SELECT 'データ件数の確認' AS check_type;

SELECT 'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'lives', COUNT(*) FROM lives
UNION ALL
SELECT 'follows', COUNT(*) FROM follows;

-- ================================================
-- 11. auth.usersとpublic.usersの同期確認
-- ================================================
SELECT 'auth.usersとpublic.usersの同期確認' AS check_type;

-- auth.usersに存在するが、public.usersに存在しないユーザー
SELECT
  'auth.usersに存在するが、public.usersに存在しない' AS issue_type,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 期待される結果: レコードが返ってこないこと（すべて同期されている）

-- ================================================
-- 12. サンプルデータの表示
-- ================================================
SELECT 'サンプルユーザーデータ' AS check_type;

SELECT
  u.id,
  u.user_id,
  u.name,
  u.bio,
  u.created_at,
  au.email
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;

-- ================================================
-- 13. 最近のライブデータ
-- ================================================
SELECT '最近のライブデータ' AS check_type;

SELECT
  l.id,
  l.artist,
  l.date,
  l.venue,
  l.description,
  u.name AS created_by_name,
  l.created_at
FROM lives l
LEFT JOIN users u ON l.created_by = u.id
ORDER BY l.created_at DESC
LIMIT 5;

-- ================================================
-- 完了メッセージ
-- ================================================
SELECT '✅ データベース検証完了' AS message;
