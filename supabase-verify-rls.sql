-- 現在のRLSポリシーを確認
SELECT
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'lives'
ORDER BY policyname;

-- 現在ログインしているユーザーで見えるライブを確認
-- （これはSupabaseの管理画面ではなく、アプリ側で実行する必要があります）
