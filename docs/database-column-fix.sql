-- ============================================
-- LIVME Database Column Fix Script
-- social_links列が存在しない場合の修正
-- ============================================

-- 既存のsocialLinks列をsocial_links列に変更（もし存在する場合）
-- この操作は、列名が間違っていた場合のみ実行

-- 1. 現在の列名を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('socialLinks', 'social_links', 'sociallinks');

-- 2. もしsocialLinks列が存在し、social_links列が存在しない場合の修正
-- (この操作は必要に応じて実行)
-- ALTER TABLE users RENAME COLUMN "socialLinks" TO social_links;

-- 3. social_links列が存在しない場合は追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- 4. 既存のデータでsocial_linksがNULLの場合のデフォルト値設定
UPDATE users 
SET social_links = '{}' 
WHERE social_links IS NULL;

-- 5. 現在のusersテーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. サンプルデータの確認
SELECT id, name, social_links 
FROM users 
LIMIT 5;

-- ============================================
-- 確認メッセージ
-- ============================================
SELECT 'social_links列の修正が完了しました！' as message;