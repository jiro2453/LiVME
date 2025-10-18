# LIVME v1.0.0

> ライブ音楽体験共有モバイルWebアプリケーション

![LIVME Logo](https://img.shields.io/badge/LIVME-v1.0.0-78B159?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.39-3ECF8E?style=flat&logo=supabase)

## 🎵 概要

LIVMEは、ライブ音楽イベントの参加記録と体験共有を目的としたモバイルファーストのWebアプリケーションです。

### 主な機能

- 🎤 **ライブイベント管理**: 参加予定・過去のライブイベントを記録
- 👤 **プロフィール管理**: アーティスト画像、自己紹介、SNSリンク
- 🖼️ **ギャラリー機能**: 最大6枚の画像をドラッグ&ドロップで管理
- ✂️ **画像クロップ**: プロフィール画像・ギャラリー画像の編集
- 👥 **フォロー機能**: Instagramライクなフォロー・アンフォロー
- 🔍 **検索機能**: ライブイベント・ユーザー検索
- 📅 **アコーディオン表示**: 年月ごとにグループ化された公演リスト
- 🎨 **自動色判定**: 未来の公演は緑、過去の公演はグレー
- 📱 **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上
- Supabaseアカウント

### 📦 Figma Makeからダウンロードした場合（必読）

**⚠️ 重要**: Figma Makeは隠しファイル（.gitignore等）をダウンロードしません！

**自動修正スクリプトを実行（10秒で完了）:**

```bash
# macOS/Linux:
bash fix-structure.sh

# Windows:
PowerShell -ExecutionPolicy Bypass -File fix-structure.ps1
```

このスクリプトは自動的に：
- ✅ 隠しファイル（.env.example, .gitignore, .eslintrc.cjs, .github/workflows）を生成
- ✅ ファイル構造をsrc/に整理
- ✅ 不要ファイルを削除

**詳細**: `FIGMA_MAKE_DOWNLOAD_GUIDE.md` または `00_READ_ME_FIRST.md` を参照

---

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/livme/livme-app.git
cd livme-app

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してSupabaseの認証情報を設定

# 開発サーバーを起動
npm run dev
```

### 環境変数の設定

`.env`ファイルに以下を設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ENV=development
```

## 🏗️ プロジェクト構造

```
livme-app/
├── public/              # 静的ファイル
│   ├── ads.txt         # AdSense設定
│   └── favicon.svg     # ファビコン
├── src/
│   ├── main.tsx        # アプリケーションエントリーポイント
│   ├── App.tsx         # メインコンポーネント
│   ├── components/     # Reactコンポーネント
│   │   ├── auth/       # 認証関連
│   │   ├── profile/    # プロフィール関連
│   │   ├── ui/         # shadcn/ui コンポーネント
│   │   └── ...
│   ├── contexts/       # Reactコンテキスト
│   ├── hooks/          # カスタムフック
│   ├── lib/            # ユーティリティライブラリ
│   ├── styles/         # グローバルスタイル
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
└── docs/               # ドキュメント
```

## 🛠️ 技術スタック

### フロントエンド
- **React 18.3** - UIライブラリ
- **TypeScript 5.3** - 型安全性
- **Vite 5.4** - ビルドツール
- **Tailwind CSS 3.4** - スタイリング
- **Motion (Framer Motion)** - アニメーション
- **shadcn/ui** - UIコンポーネント

### バックエンド・認証
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL データベース
  - 認証・認可
  - ストレージ (画像アップロード)
  - Row Level Security

### 主要ライブラリ
- **lucide-react** - アイコン
- **react-hook-form** - フォーム管理
- **react-image-crop** - 画像クロップ
- **react-dnd** - ドラッグ&ドロップ
- **sonner** - トースト通知
- **date-fns** - 日付処理

## 📊 データベース構造

### テーブル

#### users
- プロフィール情報
- アバター画像
- ギャラリー画像 (最大6枚)
- SNSリンク

#### lives
- ライブイベント情報
- 日時・場所
- アーティスト情報

#### follows
- フォロー関係管理
- follower_id / following_id

詳細は `docs/livme-complete-database-setup.sql` を参照

## 🎨 デザインシステム

### カラーパレット
- **Primary**: `#78B159` (緑 - メインカラー)
- **Background**: `#f8f9fa` (ライトグレー)
- **Foreground**: `#030213` (ダークグレー)
- **Destructive**: `#d4183d` (赤)

### フォント
- **IBM Plex Sans JP** - 日本語最適化フォント

## 📱 レスポンシブブレークポイント

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🧪 テスト・開発

```bash
# 型チェック
npm run type-check

# リント
npm run lint

# リント修正
npm run lint:fix

# ビルド
npm run build

# プレビュー
npm run preview
```

## 🚢 デプロイ

### Netlifyへのデプロイ

詳細は `DEPLOYMENT.md` を参照

```bash
# ビルド
npm run build

# Netlify CLIでデプロイ
netlify deploy --prod
```

### 環境変数（本番）

Netlifyダッシュボードで以下を設定：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENV=production`

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 👥 コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/livme/livme-app/issues)
- **Email**: support@livme.app
- **Documentation**: [docs/](docs/)

## 🗺️ ロードマップ

- [ ] プッシュ通知機能
- [ ] オフライン対応 (PWA)
- [ ] ソーシャルシェア機能強化
- [ ] チケット管理機能
- [ ] レビュー・評価機能
- [ ] マップ統合

## 📚 ドキュメント

- [デプロイメントガイド](DEPLOYMENT.md)
- [マイグレーション手順](MIGRATION_STEPS.md)
- [データベースセットアップ](docs/livme-complete-database-setup.sql)
- [AdSense設定ガイド](docs/adsense-setup-guide.md)
- [変更履歴](CHANGELOG.md)

## 🙏 謝辞

- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント
- [Supabase](https://supabase.com/) - バックエンド
- [Lucide](https://lucide.dev/) - アイコン
- IBM Plex Sans JP - フォント

---

Made with ❤️ by LIVME Team
