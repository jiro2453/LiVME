# LIVME データベースセットアップ手順

## 📋 概要
LIVMEアプリを動作させるためのSupabaseデータベースセットアップ手順です。

## 🚨 重要な前提条件
1. **Supabaseプロジェクトへの管理者アクセス権限**
2. **認証設定の有効化**（最重要！）

## ⚡ クイックセットアップ

### ステップ1: 認証設定を有効化
1. [Supabase認証設定](https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/auth/settings) を開く
2. 以下を有効化:
   - ✅ **Enable email signups**
   - ✅ **Enable email logins**

### ステップ2: SQL実行
1. [SQL Editor](https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new) を開く
2. 以下のSQLをコピー&ペースト
3. 「Run」ボタンをクリック

## 📄 コピー用SQL

```sql
-- LIVME Database Setup SQL - コピー&ペースト用
-- 以下のSQLを全選択してコピーし、SupabaseのSQL Editorで実行してください

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS live_attendees (
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (live_id, user_id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL OR current_setting('role') = 'service_role' OR current_user = 'service_role');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view lives" ON lives;
DROP POLICY IF EXISTS "Authenticated users can create lives" ON lives;
DROP POLICY IF EXISTS "Users can update own lives" ON lives;
DROP POLICY IF EXISTS "Users can delete own lives" ON lives;

CREATE POLICY "Anyone can view lives" ON lives FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create lives" ON lives FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own lives" ON lives FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own lives" ON lives FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Anyone can view live attendees" ON live_attendees;
DROP POLICY IF EXISTS "Users can join lives" ON live_attendees;
DROP POLICY IF EXISTS "Users can leave lives" ON live_attendees;

CREATE POLICY "Anyone can view live attendees" ON live_attendees FOR SELECT USING (true);
CREATE POLICY "Users can join lives" ON live_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave lives" ON live_attendees FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  PERFORM set_config('role', 'service_role', true);
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'ユーザー'),
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID, user_name TEXT DEFAULT NULL, user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  profile_name TEXT;
BEGIN
  profile_name := COALESCE(user_name, split_part(user_email, '@', 1), 'ユーザー');
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (user_id, profile_name, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', '', '{}')
  ON CONFLICT (id) DO NOTHING;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_lives_date ON lives(date);
CREATE INDEX IF NOT EXISTS idx_lives_artist ON lives(artist);
CREATE INDEX IF NOT EXISTS idx_lives_venue ON lives(venue);
CREATE INDEX IF NOT EXISTS idx_lives_created_by ON lives(created_by);
CREATE INDEX IF NOT EXISTS idx_live_attendees_live_id ON live_attendees(live_id);
CREATE INDEX IF NOT EXISTS idx_live_attendees_user_id ON live_attendees(user_id);

SELECT 'LIVME database setup completed successfully! 🎉' as message;
```

## ✅ セットアップ完了の確認
実行後、以下のメッセージが表示されれば成功です:
```
LIVME database setup completed successfully! 🎉
```

## 🔧 トラブルシューティング

### よくあるエラー

#### 1. "permission denied for schema auth"
- **原因**: プロジェクトの管理者権限がない
- **対処**: プロジェクト所有者に権限を依頼

#### 2. "relation 'auth.users' does not exist"
- **原因**: 認証機能が無効
- **対処**: Authentication > Settings で認証を有効化

#### 3. "Email signups are disabled"
- **原因**: メールサインアップが無効
- **対処**: Authentication > Settings で "Enable email signups" をON

#### 4. RLSポリシーエラー
- **原因**: 古いポリシーが残っている
- **対処**: 上記SQLを再実行（自動的にクリーンアップされます）

## 📱 アプリでの確認方法
1. LIVMEアプリを開く
2. 左上のデータベースアイコンをクリック
3. 「再確認」ボタンをクリック
4. 緑色の「接続成功」メッセージが表示されれば完了

## 📞 サポート
問題が解決しない場合は、LIVMEアプリ内の「詳細セットアップガイド」を確認してください。
```

## ⚡ 使用方法

### 方法1: アプリ内ガイド（推奨）
1. LIVMEアプリを開く
2. 黄色い警告バナーの「セットアップ」をクリック
3. ガイドに従って進める

### 方法2: 直接コピー&ペースト
1. 上記のSQLをコピー
2. [SQL Editor](https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new) でペースト
3. 実行

## 📋 セットアップ内容
- ✅ UUID拡張機能
- ✅ usersテーブル（プロフィール情報）
- ✅ livesテーブル（ライブ情報）
- ✅ live_attendeesテーブル（参加者情報）
- ✅ Row Level Security ポリシー
- ✅ 自動プロフィール作成トリガー
- ✅ パフォーマンス最適化インデックス