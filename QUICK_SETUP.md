# 🚀 LIVME クイックセットアップガイド

## ⚡ 3ステップでデプロイ

### ステップ 1: ファイル構造の整理

現在のFigma Makeプロジェクトから以下のファイルをダウンロード：

**✅ 既に作成済みのファイル（そのまま使用）:**
- ✅ `.gitignore`
- ✅ `.env.example`
- ✅ `index.html`
- ✅ `netlify.toml`
- ✅ `package.json`
- ✅ `postcss.config.js`
- ✅ `tailwind.config.js`
- ✅ `tsconfig.json`
- ✅ `tsconfig.node.json`
- ✅ `vite.config.ts`
- ✅ `README.md`
- ✅ `DEPLOYMENT.md`
- ✅ `public/ads.txt`
- ✅ `public/favicon.svg`
- ✅ `src/main.tsx`

**📦 移動が必要なファイル:**

新しいプロジェクトフォルダを作成し、以下のようにファイルを配置：

```
新しいフォルダ/
├── 上記の「作成済みファイル」を配置
├── src/
│   ├── main.tsx (既に作成済み)
│   ├── App.tsx (現在のルートから移動)
│   ├── components/ (現在のルートから移動)
│   ├── contexts/ (現在のルートから移動)
│   ├── hooks/ (現在のルートから移動)
│   ├── lib/ (現在のルートから移動)
│   ├── styles/ (現在のルートから移動)
│   ├── types/ (現在のルートから移動)
│   └── utils/ (現在のルートから移動)
└── docs/ (オプション - 現在のルートから移動)
```

### ステップ 2: GitHubにプッシュ

```bash
# 新しいフォルダで実行
cd your-livme-project

# Gitの初期化
git init

# ファイルを追加
git add .

# 最初のコミット
git commit -m "Initial commit: LIVME v1.0.0"

# GitHubリポジトリをリモートに追加
git remote add origin https://github.com/YOUR_USERNAME/livme-app.git

# プッシュ
git branch -M main
git push -u origin main
```

### ステップ 3: Netlifyでデプロイ

1. **Netlifyにアクセス**: https://app.netlify.com/
2. **"Add new site"** → **"Import an existing project"**
3. **GitHubを選択**してリポジトリを連携
4. **ビルド設定**（自動検出されるはず）:
   ```
   Build command: npm run build
   Publish directory: dist
   ```
5. **環境変数を追加**:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   VITE_ENV = production
   ```
6. **"Deploy site"** をクリック

## 🔧 必須: Supabaseセットアップ

デプロイ前に、Supabaseでデータベースをセットアップする必要があります：

1. [Supabase](https://supabase.com/)でプロジェクト作成
2. SQL Editorで `docs/livme-complete-database-setup.sql` を実行
3. ストレージバケット作成:
   - `avatars` (public)
   - `gallery-images` (public)
4. 認証設定:
   - Email/Password認証を有効化
   - Site URLにNetlifyのURLを追加

## ✅ デプロイ後のチェックリスト

- [ ] サイトが表示される
- [ ] ユーザー登録ができる
- [ ] ログインができる
- [ ] プロフィール編集ができる
- [ ] 画像アップロードができる
- [ ] ライブイベント追加ができる
- [ ] フォロー機能が動作する
- [ ] 検索機能が動作する

## 🆘 トラブルシューティング

### ビルドエラー

```bash
# ローカルでテスト
npm install
npm run build
```

エラーメッセージを確認し、不足している依存関係をインストール

### 環境変数エラー

Netlify ダッシュボード → Site settings → Environment variables で確認

### 画面が真っ白

1. ブラウザのコンソールでエラーを確認
2. Supabase URLとAPI Keyが正しいか確認
3. ネットワークタブでAPIリクエストを確認

## 📞 さらに詳しく

- 詳細なデプロイ手順: `DEPLOYMENT.md`
- ファイル移行の詳細: `MIGRATION_STEPS.md`
- データベース設定: `docs/livme-complete-database-setup.sql`

---

**🎉 おめでとうございます！** 
LIVMEアプリがオンラインになりました！
