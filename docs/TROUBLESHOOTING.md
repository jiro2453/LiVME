# LIVME トラブルシューティングガイド

## 🔴 認証エラー: 400 Bad Request

### 症状

```
POST https://fgvmbdxayjasmlwrylup.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

ログイン画面は表示されるが、ログインまたは新規登録ができない。

---

## ✅ 解決方法

### ステップ1: Supabase Auth設定の確認

#### 1.1 メール確認を無効化する

1. [Supabase Dashboard](https://app.supabase.com/) を開く
2. プロジェクトを選択（`livme-dev`）
3. 左サイドバーの「**Authentication**」をクリック
4. 「**Providers**」タブを開く
5. 「**Email**」プロバイダーを見つける
6. 「**Edit**」ボタンをクリック
7. 「**Confirm email**」トグルを**OFF**に変更
8. 「**Save**」をクリック

**重要**: `Confirm email` が ON の場合、ユーザーはメールで確認リンクをクリックする必要があります。開発環境では OFF にすることをお勧めします。

#### 1.2 Email Providerが有効になっているか確認

```
✅ Email Provider: Enabled
```

もし無効になっている場合は、有効化してください。

---

### ステップ2: データベーステーブルの確認

#### 2.1 テーブルが存在するか確認

Supabase SQL Editorで以下のSQLを実行:

```sql
-- テーブルの存在確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**期待される結果**:
```
follows
lives
users
```

#### 2.2 usersテーブルの構造を確認

```sql
-- usersテーブルのカラム確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**期待される結果**:
```
id          | uuid        | NO
user_id     | text        | NO
name        | text        | NO
bio         | text        | YES
avatar      | text        | YES
images      | jsonb       | YES
social_links| jsonb       | YES
created_at  | timestamptz | YES
updated_at  | timestamptz | YES
```

#### 2.3 RLSポリシーの確認

```sql
-- RLSが有効になっているか確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**期待される結果**:
```
users   | true
lives   | true
follows | true
```

---

### ステップ3: テーブルが存在しない場合

もしテーブルが存在しない場合は、`docs/livme-complete-database-setup.sql` を実行してください。

1. Supabase Dashboard → 「SQL Editor」を開く
2. 「New Query」をクリック
3. `docs/livme-complete-database-setup.sql` の内容をコピー＆ペースト
4. 「Run」をクリック

---

### ステップ4: 既存ユーザーの確認

#### 4.1 auth.usersテーブルを確認

```sql
-- 認証ユーザーの存在確認
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

#### 4.2 public.usersテーブルとの同期確認

```sql
-- auth.usersに存在するが、public.usersに存在しないユーザーを検出
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

もし結果が返ってきた場合、これらのユーザーはauth.usersには存在しますが、public.usersには存在しません。

---

### ステップ5: テストユーザーの作成

#### 5.1 新規ユーザーで試す

1. ブラウザのシークレットモード/プライベートブラウジングで開く
2. https://livme-app.netlify.app/ にアクセス
3. 「新規登録」をクリック
4. 以下の情報を入力:
   - **名前**: テスト太郎
   - **ユーザーID**: test_user_001
   - **メールアドレス**: test001@example.com
   - **パスワード**: Test1234!
   - **パスワード確認**: Test1234!
5. 「登録」をクリック

#### 5.2 エラーメッセージを確認

ブラウザのDevTools（F12）を開いて、「Console」タブでエラーメッセージを確認してください。

---

## 🐛 その他のよくあるエラー

### エラー1: "User already registered"

**症状**: 同じメールアドレスで再度登録しようとした

**解決方法**:
- 別のメールアドレスを使用
- または、Supabase Dashboard → Authentication → Users で既存ユーザーを削除

### エラー2: "Invalid login credentials"

**症状**: ログイン時にメールアドレスまたはパスワードが間違っている

**解決方法**:
- メールアドレスとパスワードを再確認
- パスワードは**6文字以上**必要

### エラー3: "Email not confirmed"

**症状**: メール確認が必要だが、確認していない

**解決方法**:
- Supabase Dashboard → Authentication → Providers → Email → "Confirm email" を OFF にする
- または、メールボックスで確認リンクをクリック

### エラー4: "Failed to fetch"

**症状**: ネットワークエラーまたはSupabaseプロジェクトが停止している

**解決方法**:
1. Supabase Dashboard でプロジェクトのステータスを確認
2. プロジェクトが「Paused」の場合、「Restore」をクリック
3. 環境変数が正しく設定されているか確認

---

## 📊 デバッグ用SQLクエリ

### すべてのユーザーを表示

```sql
SELECT
  u.id,
  u.user_id,
  u.name,
  u.bio,
  u.created_at,
  au.email
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;
```

### すべてのライブを表示

```sql
SELECT
  l.id,
  l.artist,
  l.date,
  l.venue,
  l.description,
  u.name AS created_by_name
FROM lives l
LEFT JOIN users u ON l.created_by = u.id
ORDER BY l.date DESC;
```

### フォロー関係を表示

```sql
SELECT
  f.id,
  follower.name AS follower_name,
  following.name AS following_name,
  f.created_at
FROM follows f
JOIN users follower ON f.follower_id = follower.id
JOIN users following ON f.following_id = following.id
ORDER BY f.created_at DESC;
```

---

## 🔧 最終手段: データベースのリセット

### 警告
以下の操作は**すべてのデータを削除**します。本番環境では実行しないでください。

```sql
-- すべてのデータを削除
TRUNCATE TABLE follows CASCADE;
TRUNCATE TABLE lives CASCADE;
TRUNCATE TABLE users CASCADE;

-- auth.usersのユーザーも削除したい場合は、Supabase Dashboard → Authentication → Users で手動削除
```

その後、`docs/livme-complete-database-setup.sql` を再実行してください。

---

## 📞 サポート

上記の手順で解決しない場合:
1. Supabase Dashboardのログを確認（Database → Logs）
2. GitHubのIssuesで報告
3. Supabaseサポートに問い合わせ

---

## ✅ チェックリスト

デプロイ前の確認事項:

- [ ] Supabase Auth「Confirm email」がOFFになっている
- [ ] Email Providerが有効になっている
- [ ] usersテーブルが存在する
- [ ] livesテーブルが存在する
- [ ] followsテーブルが存在する
- [ ] RLSが有効になっている
- [ ] 環境変数が正しく設定されている（Netlify）
- [ ] テストユーザーでログインできる
