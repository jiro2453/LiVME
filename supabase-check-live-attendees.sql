-- live_attendeesテーブルの構造を確認
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'live_attendees'
ORDER BY ordinal_position;

-- 特定のライブ（cf88233c-edb7-423d-a509-a3732e4805fa）の参加者を確認
SELECT
    user_id,
    live_id,
    created_at
FROM live_attendees
WHERE live_id = 'cf88233c-edb7-423d-a509-a3732e4805fa'::uuid;

-- 参加者数を確認
SELECT
    live_id,
    COUNT(*) as attendee_count
FROM live_attendees
WHERE live_id = 'cf88233c-edb7-423d-a509-a3732e4805fa'::uuid
GROUP BY live_id;
