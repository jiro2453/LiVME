-- live_attendeesテーブルのRLSポリシーを設定
-- すべての認証済みユーザーが他のユーザーの参加登録も読み取れるようにする

-- 既存のポリシーを削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'live_attendees'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON live_attendees', r.policyname);
    END LOOP;
END $$;

-- 読み取り：すべての認証済みユーザーがすべての参加登録を読み取り可能
CREATE POLICY "authenticated_users_select_all_attendees"
ON live_attendees
FOR SELECT
TO authenticated
USING (true);

-- 作成：認証済みユーザーは自分の参加登録を作成可能
CREATE POLICY "authenticated_users_insert_own_attendance"
ON live_attendees
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- 削除：自分の参加登録のみ削除可能
CREATE POLICY "authenticated_users_delete_own_attendance"
ON live_attendees
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- 作成されたポリシーを確認
SELECT
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'live_attendees'
ORDER BY policyname;
