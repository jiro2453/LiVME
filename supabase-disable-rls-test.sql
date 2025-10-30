-- ========================================
-- 一時的にRLSを無効化してテスト
-- ========================================

-- 1. 現在の状態を確認
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'lives';

-- 2. RLSを無効化（一時的）
ALTER TABLE lives DISABLE ROW LEVEL SECURITY;

-- 3. 再度確認
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'lives';

-- このあと、アプリからSuchmosのライブをクリックして、
-- 2件取得できるか確認してください

-- 確認後、必ずRLSを再有効化してください：
-- ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
