-- Supabase users テーブル created_at制約エラー修正SQL
-- このSQLをSupabaseのSQL EditorでCopy&Pasteして実行してください

-- 1. 既存のusersテーブルのcreated_atカラムにデフォルト値を設定
ALTER TABLE users 
ALTER COLUMN created_at SET DEFAULT now();

-- 2. 既存のレコードでcreated_atがnullの場合は現在時刻を設定
UPDATE users 
SET created_at = now() 
WHERE created_at IS NULL;

-- 3. updated_atカラムにもデフォルト値を設定（念のため）
ALTER TABLE users 
ALTER COLUMN updated_at SET DEFAULT now();

-- 4. 既存のレコードでupdated_atがnullの場合は現在時刻を設定
UPDATE users 
SET updated_at = now() 
WHERE updated_at IS NULL;

-- 5. 確認クエリ: usersテーブルの構造と制約を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('created_at', 'updated_at')
ORDER BY ordinal_position;

-- 6. テストクエリ: 既存のデータを確認
SELECT 
    id,
    name,
    created_at,
    updated_at,
    CASE 
        WHEN created_at IS NULL THEN 'NULL created_at found!'
        WHEN updated_at IS NULL THEN 'NULL updated_at found!'
        ELSE 'OK'
    END as status
FROM users 
ORDER BY created_at DESC;

-- 実行結果:
-- ✅ created_at と updated_at に適切なデフォルト値が設定されます
-- ✅ 既存のNULLデータは現在時刻で更新されます
-- ✅ 今後の新規レコード作成時は自動的にタイムスタンプが設定されます

-- 注意: 
-- このSQLは安全に実行できますが、本番環境では事前にバックアップを取ることを推奨します