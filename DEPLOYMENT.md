# LIVME デプロイメントガイド

## 📁 GitHubへのアップロード構造

以下の構造でGitHubリポジトリにアップロードしてください：

```
livme-app/
├── .gitignore                    # Git除外ファイル
├── .env.example                  # 環境変数のテンプレート
├── index.html                    # エントリーポイントHTML
├── netlify.toml                  # Netlify設定ファイル
├── package.json                  # 依存関係とスクリプト
├── postcss.config.js             # PostCSS設定
├── tailwind.config.js            # Tailwind CSS設定
├── tsconfig.json                 # TypeScript設定
├── tsconfig.node.json            # TypeScript Node設定
├── vite.config.ts                # Vite設定
├── README.md                     # プロジェクト説明
├── CHANGELOG.md                  # 変更履歴
├── public/                       # 静的ファイル
│   ├── ads.txt                   # AdSense設定
│   └── favicon.svg               # ファビコン
├── src/                          # ソースコード（以下のファイルを移動）
│   ├── main.tsx                  # Reactエントリーポイント
│   ├── App.tsx                   # メインコンポーネント
│   ├── components/               # コンポーネント
│   ├── contexts/                 # Reactコンテキスト
│   ├── hooks/                    # カスタムフック
│   ├── lib/                      # ユーティリティライブラリ
│   ├── styles/                   # スタイル
│   ├── types/                    # TypeScript型定義
│   └── utils/                    # ユーティリティ関数
└── docs/                         # ドキュメント（オプション）
```

## 🔧 必要なファイル移動

現在のファイル構造から以下の移動が必要です：

### ルートから src/ へ移動
- `App.tsx` → `src/App.tsx`
- `components/` → `src/components/`
- `contexts/` → `src/contexts/`
- `hooks/` → `src/hooks/`
- `lib/` → `src/lib/`
- `styles/` → `src/styles/`
- `types/` → `src/types/`
- `utils/` → `src/utils/`

### ルートから public/ へ移動
- `ads.txt` → `public/ads.txt` ✅ (既に作成済み)

### ルートに残すファイル
- `README.md`
- `CHANGELOG.md`
- `Attributions.md`
- `Guidelines.md`
- `RELEASE_SUMMARY.md`
- `docs/` フォルダ

## 🚀 デプロイ手順

### 1. GitHubリポジトリの準備

```bash
# リポジトリを作成
git init
git add .
git commit -m "Initial commit: LIVME v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/livme-app.git
git push -u origin main
```

### 2. Netlifyでのデプロイ

#### オプションA: Netlify UIを使用

1. [Netlify](https://www.netlify.com/) にログイン
2. "Add new site" → "Import an existing project"
3. GitHubリポジトリを選択
4. ビルド設定を確認（自動検出されます）：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`
5. 環境変数を設定：
   - `VITE_SUPABASE_URL`: あなたのSupabaseプロジェクトURL
   - `VITE_SUPABASE_ANON_KEY`: あなたのSupabase匿名キー
   - `VITE_ENV`: `production`
6. "Deploy site" をクリック

#### オプションB: Netlify CLIを使用

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# ログイン
netlify login

# 初期化
netlify init

# デプロイ
netlify deploy --prod
```

### 3. 環境変数の設定

Netlifyのダッシュボードで以下の環境変数を設定：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ENV=production
```

### 4. カスタムドメインの設定（オプション）

1. Netlifyダッシュボードで "Domain settings" を開く
2. "Add custom domain" をクリック
3. ドメイン名を入力（例: livme.app）
4. DNS設定でNetlifyのネームサーバーを設定

### 5. AdSense設定の確認

デプロイ後、以下を確認：

1. `https://your-site.netlify.app/ads.txt` が正しく表示されるか
2. AdSense管理画面でサイトを追加
3. 広告コードが正しく読み込まれているか

## 🔍 デプロイ後のチェックリスト

- [ ] サイトが正常に表示される
- [ ] Supabase接続が機能している
- [ ] ユーザー登録・ログインが動作する
- [ ] ライブイベントの追加・表示が動作する
- [ ] プロフィール編集が動作する
- [ ] 画像アップロードが動作する
- [ ] レスポンシブデザインが正しく表示される
- [ ] ads.txtが正しく配信されている
- [ ] AdSenseタグが正しく読み込まれている

## 🐛 トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドを試す
npm install
npm run build
```

### 環境変数エラー

- Netlifyダッシュボードで環境変数が正しく設定されているか確認
- 変数名が `VITE_` プレフィックスで始まっているか確認

### 404エラー

- `netlify.toml` の redirects 設定が正しいか確認
- SPAのルーティング設定が正しいか確認

### Supabase接続エラー

- SupabaseのURL・APIキーが正しいか確認
- SupabaseのCORS設定でNetlifyのドメインが許可されているか確認

## 📚 参考リンク

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [AdSense Documentation](https://support.google.com/adsense)

## 🎉 デプロイ完了後

デプロイが成功したら：

1. Supabaseダッシュボードで本番環境のURLを設定
2. AdSense管理画面でサイトを追加
3. Google Search Consoleにサイトを登録
4. アナリティクス設定（Google Analytics等）
5. パフォーマンスモニタリング設定

---

**注意**: 本番環境にデプロイする前に、必ずステージング環境でテストしてください。
