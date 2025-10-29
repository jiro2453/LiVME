-- live_attendeesテーブルのRLSポリシーを確認
SELECT
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'live_attendees'
ORDER BY policyname;

-- RLSが有効か確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'live_attendees';
