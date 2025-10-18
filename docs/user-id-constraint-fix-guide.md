# User ID Constraint Error Fix Guide

## 問題の概要
以下のエラーが発生している場合の修正手順です：

```
❌ Failed to create user profile in database: {
  "code": "23502",
  "details": null,
  "hint": null,
  "message": "null value in column \"user_id\" of relation \"users\" violates not-null constraint"
}
```

## 原因
データベースの`users`テーブルに`user_id`カラムがNOT NULL制約付きで存在するが、アプリケーションがNULL値を挿入しようとしているため。

## 修正手順

### 1. データベースの修正
Supabaseのダッシュボードで以下のSQLを実行してください：

```sql
-- user_idカラムのNOT NULL制約を削除
ALTER TABLE users 
ALTER COLUMN user_id DROP NOT NULL;

-- user_idカラムにコメントを追加
COMMENT ON COLUMN users.user_id IS 'Optional unique user ID - can be NULL';
```

### 2. アプリケーションコードの修正
以下のファイルが既に修正されています：

#### `/contexts/AuthContext.tsx`
- ユーザー作成時に`user_id: null`を明示的に設定
- プロフィール更新時にuser_idが未定義の場合はnullを設定

#### `/docs/fix-user-id-constraint.sql`
- データベース修正用のSQLスクリプトを追加

## 修正の確認

### データベース側の確認
```sql
-- user_idカラムの制約を確認
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'user_id';
```

期待される結果：`is_nullable`が`YES`になっていること

### アプリケーション側の確認
1. 新規ユーザー登録を試す
2. エラーが発生しないことを確認
3. プロフィール更新が正常に動作することを確認

## 追加の注意事項

- `user_id`フィールドは現在オプショナル（NULL許可）として設計されています
- 将来的にユーザーID機能を実装する場合は、このフィールドを使用できます
- 既存のユーザーレコードの`user_id`はNULLのままで問題ありません

## トラブルシューティング

### エラーが続く場合
1. ブラウザのキャッシュをクリア
2. アプリケーションを再起動
3. データベース接続を確認

### ローカルストレージのクリア
```javascript
// 開発者コンソールで実行
localStorage.clear();
```

### 強制リセット（開発環境のみ）
```javascript
// 開発者コンソールで実行
if (typeof livmeForceReset === 'function') {
  livmeForceReset();
}
```