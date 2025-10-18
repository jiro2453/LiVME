-- ========================================
-- LIVME v1.0.0 - Add Link Column Migration
-- ========================================
-- 
-- このSQLファイルは、usersテーブルにlinkカラムを追加します。
-- プロフィール編集画面でユーザーが任意のリンクを設定できるようになります。
--
-- 実行手順:
-- 1. Supabaseダッシュボードにログイン
-- 2. 左サイドバーから「SQL Editor」を選択
-- 3. 「New query」をクリック
-- 4. 以下のSQLをコピー＆ペースト
-- 5. 「Run」ボタンをクリックして実行
--
-- ========================================

-- Add the link column to the users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS link TEXT;

-- Add a comment to the column
COMMENT ON COLUMN public.users.link IS 'User profile link (optional) - プロフィールリンク（任意）';

-- ========================================
-- 検証クエリ（実行後に確認）
-- ========================================
-- 以下のコメントを外して実行すると、カラムが正しく追加されたことを確認できます
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'link';

-- ========================================
-- 完了
-- ========================================
-- カラムの追加が完了しました。
-- これでユーザーはプロフィール編集画面でリンクを設定できるようになります。
-- ========================================
