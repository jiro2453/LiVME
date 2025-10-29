-- live_attendeesテーブルとusersテーブルのデータ不整合を確認

-- 1. live_attendees テーブルのデータを確認
SELECT
    live_id,
    user_id,
    updated_at
FROM live_attendees
WHERE live_id = 'cf88233c-edb7-423d-a509-a3732e4805fa'::uuid;

-- 2. users テーブルに該当するuser_idが存在するか確認
SELECT
    user_id,
    name,
    email
FROM users
WHERE user_id IN ('uta', '0a2e6774-f198-434a-8193-28c9afecfa41', 'cefcb35f-29f1-4540-a383-0d9f219cd9cd');

-- 3. users テーブルの全データを確認（id と user_id の違いを確認）
SELECT
    id,
    user_id,
    name,
    email
FROM users
ORDER BY id
LIMIT 10;

-- 4. live_attendees.user_id と users.user_id の型を確認
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'live_attendees' AND column_name = 'user_id'
UNION ALL
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'user_id';
