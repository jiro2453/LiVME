# LIVMEアプリ - 認証設定完全ガイド

## 🚨 「Email logins/signups are disabled」エラー解決法

このエラーはSupabaseでメール認証が無効になっているため発生します。

## 🛠️ 即座に解決する手順

### 1. Supabase認証設定にアクセス
[認証設定ページ](https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/auth/settings)を開く

### 2. 必須設定を有効化
以下の設定を **必ず有効** にしてください：

```
✅ Enable email signups     → ON
✅ Enable email logins      → ON
```

### 3. 開発用の追加設定（推奨）
開発を簡単にするため、以下も設定：

```
☐ Enable email confirmations  → OFF (開発用)
```

### 4. 設定保存
「Save」ボタンをクリックして設定を保存

### 5. 確認
アプリを再読み込みして、エラーが解消されているか確認

## 📱 アプリ側の対応

アプリでは以下のエラーハンドリングを実装済み：

### エラーメッセージの日本語化
```
❌ Email logins are disabled
↓
✅ メール認証が無効になっています。データベース設定でメールログインを有効化してください。
```

### 専用エラーUI
- 赤いアラートボックスで明確にエラーを表示
- 設定手順をステップ形式で案内
- 「Supabase認証設定を開く」ボタンで直接リンク

### 自動エラー検出
- サインイン/サインアップ時にエラーを検出
- 適切なUIを自動表示

## 🔧 詳細設定オプション

### Email認証関連
```bash
# 基本設定
Enable email signups: true      # 新規登録を有効
Enable email logins: true       # ログインを有効

# 開発用設定
Enable email confirmations: false  # 確認メールなし
```

### セキュリティ設定（本番用）
```bash
# 本番環境では以下を有効化
Enable email confirmations: true   # 確認メール必須
Rate limiting: true                # レート制限
Captcha protection: true           # キャプチャ保護
```

## 🐛 トラブルシューティング

### 設定したのにエラーが続く場合

1. **ブラウザキャッシュクリア**
   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

2. **設定の再確認**
   - 認証設定ページで設定が保存されているか確認
   - 設定変更後は5-10分待つ

3. **Supabaseプロジェクト状態確認**
   - プロジェクトが一時停止していないか
   - API制限に達していないか

### よくある間違い

❌ **間違い**: 「Enable email confirmations」だけON
✅ **正解**: 「Enable email signups」と「Enable email logins」をON

❌ **間違い**: 設定後すぐにテスト
✅ **正解**: 設定保存後、数分待ってからテスト

## 📊 設定確認チェックリスト

認証設定ページで以下を確認：

- [ ] **Enable email signups**: ✅ ON
- [ ] **Enable email logins**: ✅ ON  
- [ ] **Enable email confirmations**: ☐ OFF (開発用)
- [ ] 設定が保存されている
- [ ] アプリでエラーが解消

## 💡 開発 vs 本番設定

### 開発環境（推奨）
```bash
Enable email signups: true
Enable email logins: true
Enable email confirmations: false  # 簡単テスト用
```

### 本番環境（セキュア）
```bash
Enable email signups: true
Enable email logins: true
Enable email confirmations: true   # セキュリティ重視
```

## 🆘 それでも解決しない場合

1. **アプリのデータベース接続確認**
   - アプリの「データベース接続確認」ボタンをクリック

2. **コンソールログ確認**
   - ブラウザの開発者ツールでエラー詳細を確認

3. **Supabaseプロジェクト再起動**
   - 極端な場合、プロジェクトの一時停止→再開

---

**重要**: この設定は **必須** です。設定しないとアプリの認証機能が一切動作しません。