# LIVME デプロイメントガイド

## デプロイ前のチェックリスト

- [ ] Supabaseプロジェクトが正しく設定されている
- [ ] データベーステーブルが作成されている
- [ ] RLSポリシーが設定されている
- [ ] Storageバケットが作成されている
- [ ] ローカル環境で正常に動作する
- [ ] ビルドエラーがない（`npm run build`）
- [ ] 環境変数が準備されている

## Netlifyへのデプロイ

### ステップ1: GitHubリポジトリの準備

```bash
# Gitリポジトリの初期化（まだの場合）
git init
git add .
git commit -m "Initial commit: LIVME v1.0.0"

# GitHubリポジトリを作成してプッシュ
git remote add origin https://github.com/yourusername/livme.git
git branch -M main
git push -u origin main
```

### ステップ2: Netlifyプロジェクトの作成

1. [Netlify](https://www.netlify.com/)にログイン
2. 「Add new site」→「Import an existing project」をクリック
3. 「GitHub」を選択
4. リポジトリを選択（`livme`）
5. ブランチを選択（`main`）

### ステップ3: ビルド設定

```
Build command: npm run build
Publish directory: dist
```

### ステップ4: 環境変数の設定

1. 「Site settings」→「Environment variables」を開く
2. 以下の環境変数を追加:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | https://xxxxxxxxxxxxx.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

### ステップ5: デプロイ

1. 「Deploy site」をクリック
2. ビルドとデプロイが完了するまで待機（約2-3分）
3. デプロイ完了後、サイトURLをクリックして確認

## カスタムドメインの設定

### ステップ1: Netlifyでドメインを追加

1. 「Domain settings」を開く
2. 「Add custom domain」をクリック
3. ドメイン名を入力（例: livme.example.com）
4. 「Verify」をクリック

### ステップ2: DNSレコードの設定

#### オプションA: Netlify DNSを使用

1. 「Use Netlify DNS」を選択
2. ドメインレジストラでネームサーバーをNetlifyのものに変更
3. DNS設定が反映されるまで待機（最大48時間）

#### オプションB: 外部DNSを使用

以下のDNSレコードを追加:

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site-name.netlify.app
```

### ステップ3: HTTPSの有効化

1. 「Domain settings」→「HTTPS」を開く
2. 「Verify DNS configuration」をクリック
3. 「Provision certificate」をクリック
4. SSL証明書が発行されるまで待機（約1分）

## 継続的デプロイ（CI/CD）

Netlifyは自動的に継続的デプロイを設定します：

- `main`ブランチへのプッシュ → 本番環境に自動デプロイ
- プルリクエストの作成 → プレビューデプロイの作成

### プレビューデプロイの確認

1. GitHub上でプルリクエストを作成
2. Netlifyが自動的にプレビューデプロイを作成
3. プルリクエストのコメントにプレビューURLが表示される

## 環境別の設定

### 本番環境

```env
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
```

### ステージング環境

```env
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key
```

## パフォーマンス最適化

### 1. ビルド最適化の確認

```bash
npm run build
```

ビルドサイズを確認:
- `dist/assets/index-*.js`: 約450KB以下が理想
- `dist/assets/index-*.css`: 約10KB以下が理想

### 2. Netlifyの最適化設定

1. 「Site settings」→「Build & deploy」→「Post processing」
2. 以下を有効化:
   - Asset optimization
   - Image optimization
   - Bundle analysis

### 3. Lighthouse スコアの確認

1. デプロイされたサイトをChromeで開く
2. DevToolsを開く（F12）
3. 「Lighthouse」タブを開く
4. 「Generate report」をクリック

目標スコア:
- Performance: 90以上
- Accessibility: 100
- Best Practices: 95以上
- SEO: 90以上

## トラブルシューティング

### ビルドエラー

```
Error: Build failed
```

**解決方法:**
1. ローカルで`npm run build`を実行して確認
2. `package.json`の依存関係を確認
3. Node.jsバージョンを確認（Netlify設定で`NODE_VERSION=20`を指定）

### 環境変数エラー

```
Error: VITE_SUPABASE_URL is not defined
```

**解決方法:**
1. Netlifyの「Environment variables」で変数が設定されているか確認
2. 変数名が`VITE_`で始まっているか確認
3. デプロイを再実行

### ルーティングエラー（404）

```
Page not found
```

**解決方法:**
`netlify.toml`が正しく設定されているか確認:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## モニタリング

### Netlify Analytics

1. 「Site settings」→「Analytics」を開く
2. 「Enable analytics」をクリック
3. トラフィック、パフォーマンス、エラーを監視

### Supabase Monitoring

1. Supabase Dashboardを開く
2. 「Database」→「Logs」でデータベースログを確認
3. 「Auth」→「Logs」で認証ログを確認

## バックアップ

### データベースバックアップ

1. Supabase Dashboardを開く
2. 「Database」→「Backups」を開く
3. 「Create backup」をクリック

自動バックアップ:
- Daily backups（過去7日分）
- Weekly backups（過去4週分）

### コードバックアップ

GitHubに定期的にプッシュすることで自動的にバックアップされます。

## ロールバック

### Netlifyでのロールバック

1. 「Deploys」を開く
2. 以前のデプロイを選択
3. 「Publish deploy」をクリック

### データベースのロールバック

1. Supabase Dashboard「Database」→「Backups」を開く
2. バックアップを選択
3. 「Restore」をクリック

## セキュリティ

### 1. 環境変数の保護

- `.env`ファイルは絶対にGitにコミットしない
- `.gitignore`に`.env`が含まれているか確認

### 2. RLSポリシーの確認

すべてのテーブルでRLSが有効になっているか確認:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 3. APIキーの定期的なローテーション

- Supabase ANON KEYは公開されても問題ない
- SERVICE KEYは絶対に公開しない

## まとめ

このガイドに従って、LIVMEアプリケーションを本番環境にデプロイできます。問題が発生した場合は、トラブルシューティングセクションを参照するか、GitHubのIssuesで報告してください。
