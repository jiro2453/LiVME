# Netlify Web UIでのデプロイ手順

## 📝 事前準備

以下が必要です：
- GitHubアカウント（コードは既にプッシュ済み）
- Netlifyアカウント（無料で作成可能）
- Supabaseプロジェクト（環境変数用）

---

## 🚀 デプロイ手順（5-10分）

### ステップ1: Netlifyアカウントの作成

1. [Netlify](https://app.netlify.com/signup)にアクセス
2. 「Sign up with GitHub」をクリック
3. GitHubアカウントで認証

### ステップ2: 新しいサイトの作成

1. Netlifyダッシュボードで「Add new site」→「Import an existing project」をクリック
2. 「Deploy with GitHub」を選択
3. リポジトリ一覧から「livme」を検索して選択
   - リポジトリが見つからない場合：「Configure the Netlify app on GitHub」をクリックして、リポジトリへのアクセスを許可

### ステップ3: ブランチの選択

1. **Branch to deploy**: `claude/livme-v1-initial-setup-011CUTnqUCzxNePmYkgE2KuN` を選択
   - または、メインブランチにマージしてから `main` を選択

### ステップ4: ビルド設定の確認

以下が自動的に設定されているか確認：

```
Build command: npm run build
Publish directory: dist
```

**注意**: `netlify.toml`ファイルが既に存在するため、これらは自動的に読み込まれます。

### ステップ5: 環境変数の設定（重要！）

「Show advanced」→「New variable」をクリックして、以下を追加：

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**Supabaseの値の取得方法:**
1. [Supabase Dashboard](https://app.supabase.com)を開く
2. プロジェクトを選択
3. 「Project Settings」→「API」を開く
4. 以下をコピー：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### ステップ6: デプロイの実行

1. 「Deploy site」をクリック
2. ビルドとデプロイが完了するまで待機（約2-3分）
3. デプロイが成功すると、サイトURLが表示される（例: `https://random-name-123456.netlify.app`）

### ステップ7: カスタムドメインの設定（オプション）

デフォルトのURL（`random-name-123456.netlify.app`）を変更したい場合：

1. 「Site settings」→「Domain management」を開く
2. 「Options」→「Edit site name」をクリック
3. 「livme-app」など、好きな名前に変更
4. 新しいURL: `https://livme-app.netlify.app`

---

## ✅ デプロイ成功の確認

デプロイが成功すると、以下のようになります：

1. **Netlifyダッシュボード**:
   - 「Published」と表示される
   - サイトURLが表示される

2. **ブラウザでアクセス**:
   - `https://livme-app.netlify.app`を開く
   - ログイン画面が表示される

3. **動作確認**:
   - 新規登録ができる
   - ログインができる
   - ライブを追加できる

---

## 🐛 トラブルシューティング

### 問題1: ビルドが失敗する

**エラー**: `Build failed`

**解決方法**:
1. Netlifyの「Deploys」タブを開く
2. 失敗したデプロイをクリック
3. ログを確認
4. 環境変数が設定されているか確認

### 問題2: 画面が真っ白

**原因**: 環境変数が設定されていない

**解決方法**:
1. 「Site settings」→「Environment variables」を開く
2. `VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が設定されているか確認
3. 値が正しいか確認
4. 「Deploys」→「Trigger deploy」→「Clear cache and deploy site」をクリック

### 問題3: 404エラーが表示される

**原因**: `netlify.toml`のリダイレクト設定が機能していない

**解決方法**:
1. `netlify.toml`が正しくコミットされているか確認
2. Netlifyで「Deploy settings」→「Build & deploy」を確認
3. 手動でリダイレクトルールを追加：
   - 「Redirects and rewrites」→「Add redirect rule」
   - From: `/*`
   - To: `/index.html`
   - Status: `200`

### 問題4: Supabase接続エラー

**エラー**: `Failed to fetch` or `Network error`

**解決方法**:
1. Supabaseプロジェクトが起動しているか確認
2. URLとAPIキーが正しいか確認
3. Supabaseのプロジェクト設定で「Pause project」になっていないか確認

---

## 📊 デプロイ後の確認事項

### ✅ チェックリスト

- [ ] サイトURLにアクセスできる
- [ ] ログイン画面が表示される
- [ ] 新規登録ができる
- [ ] ログインができる
- [ ] ライブを追加できる
- [ ] プロフィール編集ができる
- [ ] フォロー機能が動作する

### 🔧 パフォーマンスチェック

1. Chromeで開く
2. DevTools（F12）を開く
3. 「Lighthouse」タブで「Generate report」をクリック
4. 目標スコア:
   - Performance: 90以上
   - Accessibility: 100
   - Best Practices: 95以上
   - SEO: 90以上

---

## 🎯 次のステップ

デプロイが成功したら：

1. **カスタムドメインの設定**（オプション）
   - 独自ドメインを接続
   - HTTPSを有効化

2. **継続的デプロイの確認**
   - GitHubにプッシュすると自動デプロイされる
   - プルリクエストでプレビューが作成される

3. **モニタリングの設定**
   - Netlify Analyticsを有効化
   - エラーログを確認

4. **本番環境の最適化**
   - 画像の最適化
   - キャッシュ設定
   - パフォーマンス改善

---

## 📞 サポート

問題が解決しない場合：
1. Netlifyの[ドキュメント](https://docs.netlify.com)を確認
2. GitHubのIssuesで報告
3. Netlifyサポートに問い合わせ

---

## 🎉 完了！

これで、LIVME v1.0.0が本番環境で動作するようになりました！
