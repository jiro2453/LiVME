-- LIVME 既存ユーザーをpublic.usersに同期するSQL
-- このSQLをSupabase SQL Editorで実行してください

-- ================================================
-- 1. 現在の同期状態を確認
-- ================================================
SELECT
  '現在の同期状態' AS check_type,
  COUNT(*) FILTER (WHERE pu.id IS NULL) AS missing_in_public_users,
  COUNT(*) FILTER (WHERE pu.id IS NOT NULL) AS synced_users,
  COUNT(*) AS total_auth_users
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;

-- ================================================
-- 2. auth.usersに存在するが、public.usersに存在しないユーザーを表示
-- ================================================
SELECT
  '⚠️ public.usersに存在しないユーザー' AS issue_type,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- ================================================
-- 3. 既存のauth.usersユーザーをpublic.usersに同期
-- ================================================
-- このSQLは、auth.usersに存在するがpublic.usersに存在しないユーザーを
-- 自動的にpublic.usersに作成します

INSERT INTO public.users (
  id,
  user_id,
  name,
  bio,
  avatar,
  images,
  social_links,
  created_at,
  updated_at
)
SELECT
  au.id,
  -- user_idを生成（メールの@前部分 + ランダム4桁）
  LOWER(REGEXP_REPLACE(
    SPLIT_PART(au.email, '@', 1),
    '[^a-zA-Z0-9]',
    '',
    'g'
  )) || '_' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') AS user_id,
  -- nameを生成（メールの@前部分）
  COALESCE(
    SPLIT_PART(au.email, '@', 1),
    'ユーザー'
  ) AS name,
  '未設定' AS bio,
  NULL AS avatar,
  '[]'::jsonb AS images,
  '{}'::jsonb AS social_links,
  au.created_at,
  NOW() AS updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users pu
  WHERE pu.id = au.id
);

-- ================================================
-- 4. 同期後の状態を確認
-- ================================================
SELECT
  '✅ 同期後の状態' AS check_type,
  COUNT(*) FILTER (WHERE pu.id IS NULL) AS missing_in_public_users,
  COUNT(*) FILTER (WHERE pu.id IS NOT NULL) AS synced_users,
  COUNT(*) AS total_auth_users
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;

-- ================================================
-- 5. 同期されたユーザーの一覧を表示
-- ================================================
SELECT
  u.id,
  u.user_id,
  u.name,
  u.bio,
  au.email,
  u.created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- ================================================
-- 完了メッセージ
-- ================================================
SELECT '✅ ユーザー同期完了！これでログインできるようになります。' AS message;
