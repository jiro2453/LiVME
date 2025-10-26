-- LIVME ログイン問題の診断SQL
-- このSQLをSupabase SQL Editorで実行して、ユーザーの状態を確認してください

-- ================================================
-- 1. すべてのauth.usersを確認
-- ================================================
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  confirmation_token,
  CASE
    WHEN email_confirmed_at IS NULL THEN '❌ メール未確認'
    ELSE '✅ メール確認済み'
  END AS email_status,
  CASE
    WHEN deleted_at IS NOT NULL THEN '❌ 削除済み'
    ELSE '✅ アクティブ'
  END AS account_status
FROM auth.users
ORDER BY created_at DESC;

-- ================================================
-- 2. メール未確認のユーザーを検出
-- ================================================
SELECT
  '⚠️ メール未確認のユーザー' AS issue_type,
  id,
  email,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL;

-- ================================================
-- 3. auth.usersとpublic.usersの同期状態を確認
-- ================================================
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  pu.name,
  pu.user_id,
  CASE
    WHEN pu.id IS NULL THEN '❌ public.usersに存在しない'
    ELSE '✅ 同期済み'
  END AS sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- ================================================
-- 4. 特定のメールアドレスでユーザーを検索
-- ================================================
-- 以下のSQLの 'your-email@example.com' を実際のメールアドレスに置き換えて実行してください

-- SELECT
--   id,
--   email,
--   email_confirmed_at,
--   created_at,
--   last_sign_in_at,
--   confirmation_token,
--   recovery_token
-- FROM auth.users
-- WHERE email = 'your-email@example.com';

-- ================================================
-- 5. メール確認を強制的に済ませる（開発環境のみ）
-- ================================================
-- 警告: これは開発環境でのみ使用してください
-- 本番環境では使用しないでください

-- 全ユーザーのメール確認を強制的に済ませる
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- 特定のユーザーのメール確認を済ませる
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'your-email@example.com';

-- ================================================
-- 6. Authenticationログを確認（最新10件）
-- ================================================
-- Note: auth.audit_log_entries は Supabase の設定によっては利用できない場合があります

SELECT
  created_at,
  payload->>'action' AS action,
  payload->>'actor_id' AS user_id,
  payload->>'error' AS error_message,
  payload
FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- 7. 完了
-- ================================================
SELECT '✅ 診断完了' AS message;
