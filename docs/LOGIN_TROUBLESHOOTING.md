# ログインできない問題のトラブルシューティング

## 🔴 エラー1: Error fetching user profile (PGRST116)

```
Error fetching user profile: {code: 'PGRST116', details: 'The result contains 0 rows'}
```

### 原因

**ログイン自体は成功していますが、`public.users`テーブルにユーザープロフィールが存在しません。**

これは、`auth.users`（認証テーブル）にはユーザーが存在するが、`public.users`（プロフィールテーブル）に同期されていないことを意味します。

### 解決方法

#### すぐに実行: ユーザーを同期するSQL

1. Supabase Dashboard → 「**SQL Editor**」を開く
2. 「**New Query**」をクリック
3. `docs/sync-users.sql` の内容をコピー＆ペースト
4. 「**Run**」をクリック

このSQLは、`auth.users`に存在するすべてのユーザーを自動的に`public.users`に同期します。

#### 実行後の確認

SQLを実行すると、以下のようなメッセージが表示されます：

```
INSERT 3
```

（数字は同期されたユーザー数）

その後、再度ログインを試してください。今度は成功するはずです！

---

## 🔴 エラー2: Invalid login credentials

このエラーは以下のいずれかが原因です：

1. **メールアドレスまたはパスワードが間違っている**
2. **メール確認が完了していない** ← 最も可能性が高い
3. **アカウントが削除されている**
4. **Supabase Auth設定の問題**

---

## ✅ 解決手順

### **ステップ1: Supabase Auth設定を確認**

#### 1-1. メール確認を無効化する（最重要！）

1. [Supabase Dashboard](https://app.supabase.com/) を開く
2. プロジェクトを選択
3. 左サイドバー「**Authentication**」をクリック
4. 「**Providers**」タブを開く
5. 「**Email**」の右側の「**Edit**」ボタンをクリック
6. **「Confirm email」トグルを OFF にする** ← これが最重要！
7. 「**Save**」をクリック

**重要**: この設定を変更しても、既に作成されたユーザーのメール確認状態は変わりません。既存ユーザーは別途対応が必要です（ステップ2参照）。

---

### **ステップ2: 既存ユーザーの状態を確認**

#### 2-1. ユーザーの状態を確認するSQLを実行

1. Supabase Dashboard → 「**SQL Editor**」を開く
2. 「**New Query**」をクリック
3. `docs/login-diagnosis.sql` の内容をコピー＆ペースト
4. 「**Run**」をクリック

#### 2-2. 結果を確認

**確認ポイント:**

```
email_status: ❌ メール未確認
```

もし「メール未確認」と表示されている場合、これがログインできない原因です。

---

### **ステップ3: 既存ユーザーのメール確認を強制的に済ませる**

**警告**: この操作は開発環境でのみ実行してください。

#### 方法A: 全ユーザーのメール確認を済ませる

Supabase SQL Editorで以下のSQLを実行：

```sql
-- すべてのユーザーのメール確認を強制的に済ませる
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

実行後、以下のメッセージが表示されます：
```
Success. No rows returned
```

または

```
UPDATE X
```

（Xは更新されたユーザー数）

#### 方法B: 特定のユーザーのみメール確認を済ませる

```sql
-- 特定のメールアドレスのユーザーのみメール確認を済ませる
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';  -- ← 実際のメールアドレスに置き換える
```

---

### **ステップ4: ログインを再試行**

1. https://livme-app.netlify.app/ にアクセス
2. 既存のメールアドレスとパスワードでログイン
3. ブラウザのDevTools（F12）→「Console」タブでログを確認

**成功した場合:**
```
🔐 Attempting login with: { email: 'your-email@example.com' }
✅ Login successful: abc123-def456-...
👤 Fetching user profile for: abc123-def456-...
✅ User profile fetched: { name: 'ユーザー名', user_id: 'user_id' }
```

---

## 🔍 その他の確認事項

### 1. パスワードを忘れた場合

#### パスワードリセット機能を使う

**注意**: メール確認が無効化されていないと、パスワードリセットメールも送信されません。

1. ログイン画面で「パスワードを忘れた場合」をクリック
2. メールアドレスを入力
3. 送信されたメールのリンクをクリック
4. 新しいパスワードを設定

#### または、Supabase Dashboardでパスワードをリセット

1. Supabase Dashboard → 「**Authentication**」→「**Users**」を開く
2. ユーザーを探す
3. 右側の「**...**」メニュー→「**Send password reset email**」をクリック

### 2. ユーザーが存在するか確認

Supabase SQL Editorで以下のSQLを実行：

```sql
-- 特定のメールアドレスでユーザーを検索
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- ← 実際のメールアドレスに置き換える
```

**結果が0件の場合**: ユーザーが存在しません → 新規登録が必要

**結果が1件の場合**: ユーザーが存在します → メール確認状態を確認

### 3. public.usersテーブルにもユーザーが存在するか確認

```sql
-- auth.usersとpublic.usersの同期を確認
SELECT
  au.id,
  au.email,
  pu.name,
  pu.user_id,
  CASE
    WHEN pu.id IS NULL THEN '❌ public.usersに存在しない'
    ELSE '✅ 同期済み'
  END AS sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-email@example.com';  -- ← 実際のメールアドレスに置き換える
```

もし「public.usersに存在しない」と表示された場合、`docs/sync-users.sql`を実行してください。

このSQLは、すべての未同期ユーザーを自動的にpublic.usersに作成します。

---

## 🎯 推奨される確認順序（チェックリスト）

### エラーコード別の対処

#### PGRST116エラーの場合（最優先）
- [ ] **ステップ1**: `docs/sync-users.sql`をSupabase SQL Editorで実行
- [ ] **ステップ2**: 再度ログインを試す

#### Invalid login credentialsエラーの場合
- [ ] **ステップ1**: Supabase Auth「Confirm email」をOFFにする
- [ ] **ステップ2**: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;`を実行
- [ ] **ステップ3**: ログインを再試行

#### その他のエラーの場合
- [ ] **ステップ1**: `docs/login-diagnosis.sql`を実行してユーザー状態を確認
- [ ] **ステップ2**: パスワードを再確認（大文字小文字、スペースなど）
- [ ] **ステップ3**: 新しいアカウントで試してみる

---

## 🐛 よくあるエラーパターン

### エラー1: "Error fetching user profile (PGRST116)" ← **最も多いエラー**

**コンソールエラー:**
```
Error fetching user profile: {code: 'PGRST116', details: 'The result contains 0 rows'}
```

**原因**:
- ログイン自体は成功しているが、`public.users`テーブルにユーザープロフィールが存在しない
- `auth.users`と`public.users`が同期されていない

**解決方法**:
1. **すぐに実行**: `docs/sync-users.sql`をSupabase SQL Editorで実行
2. 再度ログインを試す

**詳細**: 上記の「🔴 エラー1: Error fetching user profile (PGRST116)」セクションを参照

---

### エラー2: "Invalid login credentials"

**原因**:
- メールアドレスまたはパスワードが間違っている
- メール確認が完了していない（2番目に多い）

**解決方法**:
1. Supabase Auth「Confirm email」をOFFにする
2. 既存ユーザーは`UPDATE auth.users SET email_confirmed_at = NOW()`を実行

---

### エラー3: "Email not confirmed"

**原因**:
- Supabase Auth「Confirm email」がONになっている
- ユーザーがメール確認リンクをクリックしていない

**解決方法**:
1. Supabase Auth「Confirm email」をOFFにする
2. 既存ユーザーは`UPDATE auth.users SET email_confirmed_at = NOW()`を実行

---

### エラー4: "User not found"

**原因**:
- 入力したメールアドレスでユーザーが登録されていない

**解決方法**:
1. メールアドレスを再確認
2. 新規登録が必要

---

### エラー5: データベーステーブルが存在しない

**原因**:
- `users`, `lives`, `follows`テーブルが作成されていない

**解決方法**:
1. `docs/database-verification.sql`を実行してテーブルを確認
2. `docs/livme-complete-database-setup.sql`を実行してテーブルを作成

---

## 📞 それでも解決しない場合

1. Supabase Dashboard → 「**Authentication**」→「**Logs**」でエラーログを確認
2. ブラウザのDevTools（F12）→「**Console**」タブで詳細なエラーメッセージを確認
3. 「**Network**」タブで`/auth/v1/token`リクエストのレスポンスを確認

エラーメッセージをコピーして報告してください。
