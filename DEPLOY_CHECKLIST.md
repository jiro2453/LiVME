# 📋 LIVME デプロイチェックリスト

## 🎯 GitHubアップロード前の最終確認

### ✅ 必須ファイル（すべて作成済み）

#### ルートディレクトリ
- [x] `.gitignore` - Git除外設定
- [x] `.env.example` - 環境変数テンプレート
- [x] `.eslintrc.cjs` - ESLint設定
- [x] `index.html` - HTMLエントリーポイント
- [x] `netlify.toml` - Netlify設定
- [x] `package.json` - 依存関係・スクリプト
- [x] `postcss.config.js` - PostCSS設定
- [x] `tailwind.config.js` - Tailwind設定
- [x] `tsconfig.json` - TypeScript設定
- [x] `tsconfig.node.json` - TypeScript Node設定
- [x] `vite.config.ts` - Vite設定

#### ドキュメント
- [x] `README.md` - プロジェクト説明
- [x] `DEPLOYMENT.md` - デプロイ詳細ガイド
- [x] `MIGRATION_STEPS.md` - ファイル移行手順
- [x] `QUICK_SETUP.md` - クイックセットアップ
- [x] `DEPLOY_CHECKLIST.md` - このファイル

#### public/ ディレクトリ
- [x] `public/ads.txt` - AdSense設定
- [x] `public/favicon.svg` - ファビコン

#### src/ ディレクトリ
- [x] `src/main.tsx` - Reactエントリーポイント

### 📦 移動が必要なファイル

以下のファイル・ディレクトリを **src/** に移動してください：

```
現在の場所 → 移動先
─────────────────────────────────────
App.tsx → src/App.tsx
components/ → src/components/
contexts/ → src/contexts/
hooks/ → src/hooks/
lib/ → src/lib/
styles/ → src/styles/
types/ → src/types/
utils/ → src/utils/
```

### 🗑️ 削除可能なファイル

- `ads.txt` (ルートにあるもの - public/に移動済み)
- `toast-analysis.md` (開発メモ)
- `Attributions.md` (オプション - 残しても可)

## 📁 最終的なディレクトリ構造

```
livme-app/
├── .eslintrc.cjs
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT.md
├── DEPLOY_CHECKLIST.md
├── Guidelines.md
├── MIGRATION_STEPS.md
├── QUICK_SETUP.md
├── README.md
├── RELEASE_SUMMARY.md
├── index.html
├── netlify.toml
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
│
├── public/
│   ├── ads.txt
│   └── favicon.svg
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── AdLabel.tsx
│   │   ├── AdSlot.tsx
│   │   ├── AddLiveModal.tsx
│   │   ├── auth/
│   │   ├── figma/
│   │   ├── profile/
│   │   ├── ui/
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAllLives.ts
│   │   ├── useLives.ts
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts
│   │   ├── environment.ts
│   │   └── supabase.ts
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── liveGrouping.ts
│
└── docs/ (オプション)
    ├── ad-implementation-guide.md
    ├── adsense-setup-guide.md
    ├── livme-complete-database-setup.sql
    └── ...
```

## 🔧 セットアップ手順

### 1. ローカルでのビルドテスト

```bash
# 依存関係をインストール
npm install

# TypeScriptの型チェック
npm run type-check

# ビルドテスト
npm run build

# ローカルサーバーで確認
npm run dev
```

### 2. 環境変数の準備

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` を編集：
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ENV=development
```

### 3. GitHubリポジトリ作成

```bash
# 初期化
git init

# 全ファイル追加
git add .

# コミット
git commit -m "Initial commit: LIVME v1.0.0"

# リモート追加
git remote add origin https://github.com/YOUR_USERNAME/livme-app.git

# プッシュ
git branch -M main
git push -u origin main
```

### 4. Netlifyセットアップ

#### A. Netlify UI経由
1. https://app.netlify.com/ にログイン
2. "Add new site" → "Import an existing project"
3. GitHubリポジトリを選択
4. ビルド設定を確認（自動検出）
5. 環境変数を追加:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ENV=production`
6. "Deploy site" をクリック

#### B. Netlify CLI経由
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## 🗄️ Supabaseセットアップ

### 1. プロジェクト作成
1. https://supabase.com/ でプロジェクト作成
2. プロジェクトURL・API Keyをコピー

### 2. データベースセットアップ
SQL Editorで以下を実行：
```sql
-- docs/livme-complete-database-setup.sql の内容を実行
```

### 3. ストレージ設定
1. Storage → New bucket
2. `avatars` を作成（public）
3. `gallery-images` を作成（public）

### 4. 認証設定
1. Authentication → Settings
2. Site URLに Netlify URLを追加
3. Email確認を設定（オプション）

## 🎨 AdSenseセットアップ（オプション）

### 1. サイト追加
1. AdSense管理画面でサイトを追加
2. `ads.txt` が正しく配信されているか確認
   - `https://your-site.netlify.app/ads.txt`

### 2. 広告ユニット作成
1. 管理画面で広告ユニットを作成
2. 広告コード（data-ad-slot）を取得
3. 必要に応じてコンポーネントを更新

## ✅ デプロイ後の確認事項

### 機能テスト
- [ ] ユーザー登録ができる
- [ ] ログインができる
- [ ] プロフィール編集ができる
- [ ] アバター画像アップロードができる
- [ ] ギャラリー画像アップロードができる（最大6枚）
- [ ] ドラッグ&ドロップで画像並び替えができる
- [ ] 画像クロップができる
- [ ] ライブイベント追加ができる
- [ ] ライブイベント検索ができる
- [ ] フォロー・アンフォローができる
- [ ] 他ユーザーのプロフィール閲覧ができる
- [ ] アコーディオンでライブ一覧が表示される
- [ ] 未来の公演が緑、過去の公演がグレーで表示される

### 技術的確認
- [ ] HTTPSで配信されている
- [ ] ads.txtが正しく配信されている
- [ ] 画像が正しく表示される
- [ ] モバイルで正しく表示される
- [ ] タブレットで正しく表示される
- [ ] デスクトップで正しく表示される
- [ ] コンソールにエラーがない
- [ ] ページロード速度が良好
- [ ] SEOメタタグが設定されている

### セキュリティ確認
- [ ] HTTPS通信
- [ ] Supabase RLSが有効
- [ ] 環境変数が安全に管理されている
- [ ] APIキーが露出していない

## 🐛 トラブルシューティング

### ビルドエラー
```bash
# キャッシュクリア
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 環境変数が読み込まれない
- `VITE_` プレフィックスがついているか確認
- Netlifyで再デプロイ
- ブラウザキャッシュをクリア

### Supabase接続エラー
- URLとAPI Keyが正しいか確認
- RLSポリシーが正しく設定されているか確認
- ネットワークタブでAPIレスポンスを確認

### 画像アップロードエラー
- Storageバケットが public か確認
- RLSポリシーでアップロード権限があるか確認
- ファイルサイズ制限を確認

## 📞 サポート

問題が解決しない場合：
1. [GitHub Issues](https://github.com/livme/livme-app/issues)
2. `docs/` 内の各種ガイドを参照
3. support@livme.app にお問い合わせ

## 🎉 完了！

すべてのチェックが完了したら、LIVMEアプリの本番運用開始です！

---

**最終更新**: 2025年1月
**バージョン**: v1.0.0
