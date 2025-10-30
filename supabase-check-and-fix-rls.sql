-- Step 1: 現在のRLSポリシーをすべて確認
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'lives';

-- Step 2: すべてのポリシーを削除
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'lives'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lives', r.policyname);
    END LOOP;
END $$;

-- Step 3: 新しいシンプルなポリシーを作成
-- 読み取り：すべての認証済みユーザーがすべてのライブを読み取り可能
CREATE POLICY "authenticated_users_select_all"
ON lives
FOR SELECT
TO authenticated
USING (true);

-- 作成：認証済みユーザーは自分のライブを作成可能
CREATE POLICY "authenticated_users_insert_own"
ON lives
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 更新：自分のライブのみ更新可能
CREATE POLICY "authenticated_users_update_own"
ON lives
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- 削除：自分のライブのみ削除可能
CREATE POLICY "authenticated_users_delete_own"
ON lives
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Step 4: 作成されたポリシーを確認
SELECT
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'lives'
ORDER BY policyname;
