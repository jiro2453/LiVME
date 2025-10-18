# 🚀 GitHubアップロード完全ガイド

## 📝 概要

このガイドでは、Figma MakeプロジェクトをGitHubにアップロードし、Netlifyでデプロイする手順を説明します。

## 🎯 準備完了状態

以下のファイルは**すべて作成済み**です：

### ✅ 設定ファイル（そのまま使用可能）
- `.gitignore` - Git除外設定
- `.env.example` - 環境変数テンプレート
- `.eslintrc.cjs` - ESLint設定
- `index.html` - HTMLエントリーポイント
- `netlify.toml` - Netlify自動デプロイ設定
- `package.json` - すべての依存関係
- `postcss.config.js` - PostCSS設定
- `tailwind.config.js` - Tailwindカラー設定
- `tsconfig.json` - TypeScript設定
- `tsconfig.node.json` - TypeScript Node設定
- `vite.config.ts` - Viteビルド設定
- `LICENSE` - MITライセンス

### ✅ ドキュメント
- `README.md` - プロジェクト説明（更新済み）
- `DEPLOYMENT.md` - 詳細デプロイガイド
- `DEPLOY_CHECKLIST.md` - デプロイチェックリスト
- `MIGRATION_STEPS.md` - ファイル移行詳細
- `QUICK_SETUP.md` - クイックスタート
- `GITHUB_UPLOAD_GUIDE.md` - このファイル

### ✅ ソースファイル
- `src/main.tsx` - Reactエントリーポイント
- `public/ads.txt` - AdSense設定
- `public/favicon.svg` - アイコン

### ✅ GitHub Actions
- `.github/workflows/deploy.yml` - CI/CDワークフロー

## 📦 ファイル移行が必要

以下のファイルを**手動で** `src/` ディレクトリに移動してください：

```bash
# 移動が必要なファイル
App.tsx          → src/App.tsx
components/      → src/components/
contexts/        → src/contexts/
hooks/           → src/hooks/
lib/             → src/lib/
styles/          → src/styles/
types/           → src/types/
utils/           → src/utils/
```

## 🔧 手順（3つの方法）

### 方法A: ローカルでファイルを整理してからアップロード（推奨）

#### ステップ 1: ローカルにプロジェクトを準備

1. **新しいフォルダを作成**
   ```bash
   mkdir livme-app
   cd livme-app
   ```

2. **Figma Makeからすべてのファイルをダウンロード**
   - プロジェクト全体をZIPでダウンロード
   - または各ファイルを個別にダウンロード

3. **ファイルを正しい位置に配置**
   ```
   livme-app/
   ├── .gitignore
   ├── .env.example
   ├── index.html
   ├── package.json
   ├── (その他の設定ファイル)
   ├── public/
   │   ├── ads.txt
   │   └── favicon.svg
   └── src/
       ├── main.tsx
       ├── App.tsx (←ここに移動)
       ├── components/ (←ここに移動)
       ├── contexts/ (←ここに移動)
       └── (その他のフォルダ)
   ```

#### ステップ 2: 動作確認

```bash
# 依存関係をインストール
npm install

# .envファイルを作成
cp .env.example .env
# .envを編集してSupabase情報を設定

# ローカルで動作確認
npm run dev

# ビルドテスト
npm run build
```

#### ステップ 3: GitHubにアップロード

```bash
# Gitリポジトリを初期化
git init

# すべてのファイルを追加
git add .

# コミット
git commit -m "Initial commit: LIVME v1.0.0"

# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/livme-app.git

# プッシュ
git branch -M main
git push -u origin main
```

---

### 方法B: GitHub Desktopを使用（初心者向け）

1. **GitHub Desktopをダウンロード**
   - https://desktop.github.com/

2. **ファイルを準備**
   - 方法Aのステップ1と同じ

3. **GitHub Desktopで操作**
   - File → Add Local Repository
   - フォルダを選択
   - "Create a repository" をクリック
   - "Publish repository" をクリック

---

### 方法C: GitHub Web UIで直接アップロード（小規模な場合）

1. **GitHubでリポジトリを作成**
   - https://github.com/new
   - リポジトリ名: `livme-app`

2. **ファイルをアップロード**
   - "uploading an existing file" をクリック
   - ファイルをドラッグ&ドロップ
   - ⚠️ フォルダ構造を保つため、複数回に分けてアップロード

---

## 🌐 Netlifyデプロイ

### 自動デプロイ設定（推奨）

1. **Netlifyにログイン**
   - https://app.netlify.com/

2. **新しいサイトを作成**
   - "Add new site" → "Import an existing project"
   - GitHubを選択
   - `livme-app` リポジトリを選択

3. **ビルド設定を確認**（自動検出）
   ```
   Build command: npm run build
   Publish directory: dist
   Base directory: (空欄)
   ```

4. **環境変数を設定**
   - Site settings → Environment variables → Add a variable
   
   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` |
   | `VITE_ENV` | `production` |

5. **デプロイ開始**
   - "Deploy site" をクリック
   - 数分待つとデプロイ完了

6. **カスタムドメイン設定（オプション）**
   - Domain settings → Add custom domain
   - DNSレコードを設定

---

## 🗄️ Supabaseセットアップ

Netlifyデプロイ前に必ずSupabaseをセットアップしてください。

### 1. Supabaseプロジェクト作成

1. https://supabase.com/ でプロジェクト作成
2. Project Settings → API でURL・Keyを確認

### 2. データベーススキーマ作成

SQL Editorで実行：
```sql
-- docs/livme-complete-database-setup.sql の内容をコピペ
```

### 3. ストレージバケット作成

1. Storage → New bucket
2. `avatars` を作成（public、2MBまで）
3. `gallery-images` を作成（public、2MBまで）

### 4. 認証設定

1. Authentication → Settings → Site URL
2. NetlifyのURL（例：`https://livme.netlify.app`）を追加

### 5. RLSポリシー確認

- usersテーブル: 自分のレコードは読み書き可能
- livesテーブル: 全員読み取り可、所有者のみ書き込み可
- followsテーブル: 全員読み取り可、follower_idが自分なら書き込み可

---

## ✅ 最終確認チェックリスト

### ファイル構成
- [ ] `src/` ディレクトリにすべてのソースコードがある
- [ ] `public/` に ads.txt と favicon.svg がある
- [ ] ルートに設定ファイルがすべてある
- [ ] `.env` ファイルは含まれていない（.gitignore済み）

### ローカルテスト
- [ ] `npm install` が成功する
- [ ] `npm run dev` でアプリが起動する
- [ ] `npm run build` がエラーなく完了する
- [ ] `npm run type-check` がエラーなし

### GitHub
- [ ] リポジトリが作成されている
- [ ] すべてのファイルがプッシュされている
- [ ] .github/workflows/deploy.yml がある（CI/CD）

### Netlify
- [ ] サイトがデプロイされている
- [ ] 環境変数が設定されている
- [ ] ビルドログにエラーがない
- [ ] サイトが正常に表示される

### Supabase
- [ ] データベーススキーマが作成されている
- [ ] ストレージバケットが作成されている
- [ ] RLSポリシーが有効
- [ ] 認証設定でNetlify URLが追加されている

### 動作確認
- [ ] ユーザー登録ができる
- [ ] ログインができる
- [ ] プロフィール編集ができる
- [ ] 画像アップロードができる
- [ ] ライブイベント追加ができる
- [ ] フォロー機能が動作する

---

## 🎓 推奨ワークフロー

### 開発フロー
```
ローカル開発 → テスト → GitHub push → 自動デプロイ
```

### ブランチ戦略
```
main        - 本番環境（Netlify本番デプロイ）
develop     - 開発環境（Netlifyプレビュー）
feature/*   - 機能開発
```

### デプロイフロー
1. ローカルで開発・テスト
2. GitHubにpush
3. Netlifyが自動ビルド・デプロイ
4. デプロイ通知をSlack/Email等で受信

---

## 🐛 よくあるエラーと解決方法

### エラー1: ビルド失敗

**原因**: 依存関係の不足
```bash
# 解決方法
npm install
npm run build
```

### エラー2: 環境変数が読み込まれない

**原因**: `VITE_` プレフィックスがない
```bash
# 正しい例
VITE_SUPABASE_URL=...

# 間違い例
SUPABASE_URL=...
```

### エラー3: 画像が表示されない

**原因**: パスの問題
```tsx
// 正しい例（public/内のファイル）
<img src="/favicon.svg" />

// 正しい例（src/内のファイル）
import logo from './logo.png';
<img src={logo} />
```

### エラー4: Supabase接続エラー

**チェック項目**:
1. 環境変数が正しいか
2. URLが `https://` で始まっているか
3. Supabase RLSポリシーが正しいか

---

## 📞 サポート

### 公式ドキュメント
- **このプロジェクト**: `DEPLOYMENT.md`, `DEPLOY_CHECKLIST.md`
- **Vite**: https://vitejs.dev/
- **Netlify**: https://docs.netlify.com/
- **Supabase**: https://supabase.com/docs

### トラブルシューティング
1. `MIGRATION_STEPS.md` を確認
2. `DEPLOY_CHECKLIST.md` を確認
3. GitHubで Issue を作成
4. support@livme.app にお問い合わせ

---

## 🎉 完了！

すべての手順が完了したら、LIVMEアプリが世界中からアクセス可能になります！

**次のステップ**:
1. カスタムドメイン設定
2. Google Analytics追加
3. SEO最適化
4. パフォーマンス改善
5. 継続的な機能追加

---

**作成日**: 2025年1月
**バージョン**: v1.0.0
**対象**: LIVME モバイルWebアプリケーション
