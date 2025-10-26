# 新規登録時にpublic.usersにデータが追加されない問題の修正

## 🔴 症状

- 新規登録すると、Supabase Authentication（auth.users）にはユーザーが作成される
- しかし、public.usersテーブルにはデータが追加されない
- ログインしようとすると「Error fetching user profile (PGRST116)」エラーが発生

---

## 🔍 原因

この問題は、**RLS（Row Level Security）ポリシー**が原因です。

`public.users`テーブルのINSERTポリシーが正しく設定されていないため、新規ユーザーが自分のプロフィールを作成できません。

---

## ✅ 解決方法

### **ステップ1: RLSポリシーを修正する**

1. [Supabase Dashboard](https://app.supabase.com/) を開く
2. プロジェクトを選択
3. 左サイドバー「**SQL Editor**」をクリック
4. 「**New Query**」をクリック
5. 以下のSQLをコピー＆ペースト:

```sql
-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON users;

-- 新しいINSERTポリシーを作成
CREATE POLICY "Authenticated users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

6. 「**Run**」をクリック

**実行結果:**
```
DROP POLICY
CREATE POLICY
```

と表示されれば成功です。

---

### **ステップ2: 新規登録を再試行**

1. https://livme-app.netlify.app/ にアクセス
2. 「**新規登録**」をクリック
3. 以下の情報を入力:
   - **名前**: テスト太郎
   - **ユーザーID**: test_user_new
   - **メールアドレス**: testnew@example.com
   - **パスワード**: Test1234!
4. 「**登録**」をクリック

**成功した場合:**
ブラウザのDevTools（F12）→「Console」タブで以下のログが表示されます：

```
📝 Attempting signup with: { email: 'testnew@example.com', name: 'テスト太郎', userId: 'test_user_new' }
✅ Auth user created: abc123-def456-...
📝 Creating user profile in database...
✅ User profile created successfully
👤 Fetching user profile for: abc123-def456-...
✅ User profile fetched: { name: 'テスト太郎', user_id: 'test_user_new' }
```

---

### **ステップ3: データベースで確認**

Supabase SQL Editorで以下のSQLを実行して、ユーザーが正しく作成されたか確認:

```sql
-- 最新のユーザーを確認
SELECT
  u.id,
  u.user_id,
  u.name,
  au.email,
  u.created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;
```

新しく作成したユーザーが表示されていれば成功です！

---

## 🐛 まだエラーが出る場合

### エラー1: RLS Policy Error

**コンソールエラー:**
```
❌ Profile creation error: {...}
🔒 RLS Policy Error detected!
Please run: docs/fix-signup-rls.sql in Supabase SQL Editor
```

**解決方法:**
1. `docs/fix-signup-rls.sql` を開く
2. 全内容をコピー
3. Supabase SQL Editorで実行

---

### エラー2: Duplicate key error

**コンソールエラー:**
```
このユーザーIDは既に使用されています
```

**解決方法:**
- 別のユーザーIDを使用してください

---

### エラー3: Email already registered

**コンソールエラー:**
```
このメールアドレスは既に登録されています
```

**解決方法:**
- 別のメールアドレスを使用してください
- または、Supabase Dashboard → Authentication → Users で既存ユーザーを削除

---

## 🔧 詳細な診断

### RLSポリシーの状態を確認

```sql
-- 現在のRLSポリシーを確認
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';
```

**期待される結果:**
```
policyname: "Authenticated users can insert own profile"
cmd: INSERT
roles: {authenticated}
```

---

### RLSが有効になっているか確認

```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

**期待される結果:**
```
rowsecurity: true
```

もし`false`の場合、以下を実行:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## 📋 既存ユーザーの同期

もし以前に作成したユーザーが`public.users`に存在しない場合は、`docs/sync-users.sql`を実行してください。

これにより、`auth.users`に存在するすべてのユーザーが`public.users`に同期されます。

---

## ✅ チェックリスト

- [ ] `docs/fix-signup-rls.sql`（または上記のSQL）を実行した
- [ ] 新規登録を再試行した
- [ ] ブラウザのConsoleで成功ログを確認した
- [ ] Supabase SQL Editorでユーザーが作成されたか確認した
- [ ] 既存ユーザーは`docs/sync-users.sql`で同期した

---

これで新規登録が正常に動作するはずです！
