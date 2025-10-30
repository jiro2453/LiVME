-- livesテーブルのRLSポリシーを修正（text型対応版）
-- すべての認証済みユーザーが他のユーザーのライブも読み取れるようにする

-- 既存の読み取りポリシーを削除
DROP POLICY IF EXISTS "Users can view their own lives" ON lives;
DROP POLICY IF EXISTS "Users can view own lives" ON lives;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON lives;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON lives;

-- 新しい読み取りポリシー：すべての認証済みユーザーがすべてのライブを読み取り可能
CREATE POLICY "Enable read access for all authenticated users"
ON lives
FOR SELECT
TO authenticated
USING (true);

-- 書き込み・更新・削除は自分のライブのみ可能にする（text型対応）
DROP POLICY IF EXISTS "Users can insert their own lives" ON lives;
CREATE POLICY "Users can insert their own lives"
ON lives
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can update their own lives" ON lives;
CREATE POLICY "Users can update their own lives"
ON lives
FOR UPDATE
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can delete their own lives" ON lives;
CREATE POLICY "Users can delete their own lives"
ON lives
FOR DELETE
TO authenticated
USING (auth.uid()::text = created_by);
