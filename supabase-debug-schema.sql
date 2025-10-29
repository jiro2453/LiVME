-- livesテーブルのスキーマとRLSポリシーを確認

-- 1. テーブルの構造を確認
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'lives'
ORDER BY ordinal_position;

-- 2. 現在のRLSポリシーを確認
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
WHERE tablename = 'lives';

-- 3. テストクエリ：すべてのSuchmosのライブを取得（RLS無効）
SELECT
    id,
    artist,
    venue,
    date,
    created_by,
    pg_typeof(created_by) as created_by_type
FROM lives
WHERE artist ILIKE '%Suchmos%';
