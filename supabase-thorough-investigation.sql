-- ========================================
-- RLS問題の徹底調査
-- ========================================

-- 1. RLSが有効になっているか確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'lives';

-- 2. 現在のRLSポリシーをすべて表示
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
WHERE tablename = 'lives'
ORDER BY policyname;

-- 3. RLSを無視して、Suchmosのライブを直接確認（管理者権限が必要）
-- これはSupabase管理画面のSQL Editorでのみ実行可能
SELECT
    id,
    artist,
    venue,
    date,
    created_by,
    created_at
FROM lives
WHERE artist ILIKE '%Suchmos%'
ORDER BY created_at;

-- 4. すべてのライブ数を確認
SELECT COUNT(*) as total_lives FROM lives;

-- 5. Suchmosのライブ数を確認
SELECT COUNT(*) as suchmos_lives
FROM lives
WHERE artist ILIKE '%Suchmos%';

-- 6. created_by別のライブ数
SELECT
    created_by,
    COUNT(*) as live_count
FROM lives
GROUP BY created_by
ORDER BY live_count DESC;

-- 7. もしRLSが無効なら、有効にする
-- ALTER TABLE lives ENABLE ROW LEVEL SECURITY;

-- 8. もしRLSが原因でなければ、すべてのポリシーを削除して再作成
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN
--         SELECT policyname
--         FROM pg_policies
--         WHERE tablename = 'lives'
--     LOOP
--         EXECUTE format('DROP POLICY IF EXISTS %I ON lives', r.policyname);
--     END LOOP;
-- END $$;

-- 再作成用のポリシー（コメントを外して実行）
-- CREATE POLICY "allow_all_select"
-- ON lives
-- FOR SELECT
-- TO authenticated
-- USING (true);
