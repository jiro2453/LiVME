-- ============================================
-- LIVME Complete Database Setup SQL
-- 
-- このSQLを全選択してコピーし、SupabaseのSQL Editorに貼り付けて実行してください
-- 実行方法: https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new
-- 
-- セットアップ内容:
-- 1. UUID拡張機能の有効化
-- 2. テーブル作成 (users, lives, live_attendees)
-- 3. Row Level Security (RLS) ポリシーの設定
-- 4. 自動プロフィール作成トリガー
-- 5. 手動プロフィール作成関数
-- 6. パフォーマンス向上のためのインデックス
-- ============================================

-- 1. UUID拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. usersテーブルを作成
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. livesテーブルを作成
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  venue VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. live_attendeesテーブルを作成
CREATE TABLE IF NOT EXISTS live_attendees (
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (live_id, user_id)
);

-- 5. Row Level Security (RLS) を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

-- 6. 既存のポリシーを削除（クリーンアップ）
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- 7. usersテーブル用のRLSポリシーを作成
-- 閲覧: 全ユーザーのプロフィールを見ることができる
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- 作成: 自分のプロフィールまたは認証されたユーザーが作成可能
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id 
        OR auth.uid() IS NOT NULL 
        OR current_setting('role') = 'service_role'
        OR current_user = 'service_role'
    );

-- 更新: 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 削除: 自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- 8. livesテーブル用のRLSポリシーを削除（クリーンアップ）
DROP POLICY IF EXISTS "Anyone can view lives" ON lives;
DROP POLICY IF EXISTS "Authenticated users can create lives" ON lives;
DROP POLICY IF EXISTS "Users can update own lives" ON lives;
DROP POLICY IF EXISTS "Users can delete own lives" ON lives;

-- 9. livesテーブル用のRLSポリシーを作成
-- 閲覧: 誰でもライブ情報を閲覧可能
CREATE POLICY "Anyone can view lives" ON lives FOR SELECT USING (true);

-- 作成: 認証されたユーザーが自分名義でライブを作成可能
CREATE POLICY "Authenticated users can create lives" ON lives FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 更新: 自分が作成したライブのみ更新可能
CREATE POLICY "Users can update own lives" ON lives FOR UPDATE USING (auth.uid() = created_by);

-- 削除: 自分が作成したライブのみ削除可能
CREATE POLICY "Users can delete own lives" ON lives FOR DELETE USING (auth.uid() = created_by);

-- 10. live_attendeesテーブル用のRLSポリシーを削除（クリーンアップ）
DROP POLICY IF EXISTS "Anyone can view live attendees" ON live_attendees;
DROP POLICY IF EXISTS "Users can join lives" ON live_attendees;
DROP POLICY IF EXISTS "Users can update own attendance" ON live_attendees;
DROP POLICY IF EXISTS "Users can leave lives" ON live_attendees;

-- 11. live_attendeesテーブル用のRLSポリシーを作成
-- 閲覧: 誰でもライブの参加者を閲覧可能
CREATE POLICY "Anyone can view live attendees" ON live_attendees FOR SELECT USING (true);

-- 参加: 自分名義でライブに参加可能（重複防止付き）
CREATE POLICY "Users can join lives" ON live_attendees FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
        SELECT 1 FROM live_attendees 
        WHERE live_id = live_attendees.live_id 
        AND user_id = auth.uid()
    )
);

-- 更新: 自分の参加記録のみ更新可能
CREATE POLICY "Users can update own attendance" ON live_attendees FOR UPDATE USING (auth.uid() = user_id);

-- 退出: 自分の参加記録のみ削除可能
CREATE POLICY "Users can leave lives" ON live_attendees FOR DELETE USING (auth.uid() = user_id);

-- 12. 既存のトリガーと関数を削除（クリーンアップ）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 13. 自動プロフィール作成関数を作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- サービスロールとして実行してRLSをバイパス
  PERFORM set_config('role', 'service_role', true);
  
  -- 新しいユーザーのプロフィールを自動作成
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1), 
      'ユーザー'
    ),
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもトリガーを失敗させない
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 自動プロフィール作成トリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. 手動プロフィール作成関数を作成（フォールバック用）
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_name TEXT DEFAULT NULL,
  user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_name TEXT;
BEGIN
  -- 表示名を決定
  profile_name := COALESCE(
    user_name,
    split_part(user_email, '@', 1),
    'ユーザー'
  );
  
  -- プロフィールを作成
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    user_id,
    profile_name,
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile manually for %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. パフォーマンス向上のためのインデックスを作成
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_lives_date ON lives(date);
CREATE INDEX IF NOT EXISTS idx_lives_artist ON lives(artist);
CREATE INDEX IF NOT EXISTS idx_lives_venue ON lives(venue);
CREATE INDEX IF NOT EXISTS idx_lives_created_by ON lives(created_by);
CREATE INDEX IF NOT EXISTS idx_live_attendees_live_id ON live_attendees(live_id);
CREATE INDEX IF NOT EXISTS idx_live_attendees_user_id ON live_attendees(user_id);

-- 17. セットアップ完了メッセージ
SELECT 'LIVME database setup completed successfully! 🎉' as message;

-- ============================================
-- セットアップ完了後の確認クエリ（オプション）
-- ============================================

-- テーブルが作成されたことを確認
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'lives', 'live_attendees')
ORDER BY table_name;

-- RLSが有効になっていることを確認
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'lives', 'live_attendees');

-- ポリシーが作成されていることを確認
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- エラーが発生した場合のトラブルシューティング
-- ============================================

/*
よくあるエラーと対処法:

1. "permission denied for schema auth"
   → プロジェクトの管理者権限が必要です

2. "relation 'auth.users' does not exist"  
   → Supabaseの認証機能が有効になっていない可能性があります
   → Authentication > Settings で "Enable email signups" をONにしてください

3. "extension 'uuid-ossp' is not available"
   → 通常は自動的に利用可能です。エラーが出る場合は管理者に相談してください

4. RLSポリシーエラー
   → このSQLを再実行してください。既存のポリシーは自動的に削除されます

5. タイムアウトエラー
   → SQLを小さな部分に分けて実行してください
*/