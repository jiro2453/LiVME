-- usersテーブルのRLSポリシーを設定
-- すべての認証済みユーザーが他のユーザー情報も読み取れるようにする

-- 既存のポリシーを削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
    END LOOP;
END $$;

-- 読み取り：すべての認証済みユーザーがすべてのユーザー情報を読み取り可能
CREATE POLICY "authenticated_users_select_all_users"
ON users
FOR SELECT
TO authenticated
USING (true);

-- 更新：自分のユーザー情報のみ更新可能
CREATE POLICY "authenticated_users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 作成されたポリシーを確認
SELECT
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
