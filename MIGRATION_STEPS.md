# ファイル移行手順

このドキュメントでは、現在のファイル構造からデプロイ可能な構造への移行手順を説明します。

## 📋 手動移行手順

Figma Makeの制限により、以下の手順を**手動で**実行する必要があります：

### ステップ1: ディレクトリ構造の準備

1. プロジェクトのルートに `src` ディレクトリを作成
2. `public` ディレクトリを作成（既に作成済み）

### ステップ2: ファイルの移動

以下のファイル・ディレクトリを移動：

```bash
# App.tsxを移動
App.tsx → src/App.tsx

# ディレクトリを移動
components/ → src/components/
contexts/ → src/contexts/
hooks/ → src/hooks/
lib/ → src/lib/
styles/ → src/styles/
types/ → src/types/
utils/ → src/utils/
```

### ステップ3: インポートパスの確認

`src/App.tsx` 内のインポートパスが正しいか確認：

```typescript
// 正しいインポート例
import { Button } from './components/ui/button';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
```

### ステップ4: 削除するファイル

以下のファイルは不要なため削除可能：
- `/ads.txt` (ルートの方 - publicに移動済み)
- `/toast-analysis.md` (開発用メモ)

### ステップ5: 最終的なディレクトリ構造

```
livme-app/
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT.md
├── Guidelines.md
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
├── public/
│   ├── ads.txt
│   └── favicon.svg
├── src/
│   ├── main.tsx              ← 新規作成済み
│   ├── App.tsx               ← 移動
│   ├── components/           ← 移動
│   │   ├── AdLabel.tsx
│   │   ├── AdSlot.tsx
│   │   ├── AddLiveModal.tsx
│   │   └── ...
│   ├── contexts/             ← 移動
│   │   └── AuthContext.tsx
│   ├── hooks/                ← 移動
│   │   ├── useAllLives.ts
│   │   └── ...
│   ├── lib/                  ← 移動
│   │   ├── api.ts
│   │   ├── environment.ts
│   │   └── supabase.ts
│   ├── styles/               ← 移動
│   │   └── globals.css
│   ├── types/                ← 移動
│   │   └── index.ts
│   └── utils/                ← 移動
│       └── liveGrouping.ts
└── docs/                     ← そのまま
    └── ...
```

## 🔄 自動移行スクリプト（参考）

ローカル環境で実行する場合のスクリプト例：

### Unix/Linux/Mac:

```bash
#!/bin/bash

# src ディレクトリを作成
mkdir -p src

# ファイルを移動
mv App.tsx src/
mv components src/
mv contexts src/
mv hooks src/
mv lib src/
mv styles src/
mv types src/
mv utils src/

# 不要ファイルを削除
rm -f ads.txt toast-analysis.md

echo "✅ ファイル移行完了"
```

### Windows (PowerShell):

```powershell
# src ディレクトリを作成
New-Item -ItemType Directory -Force -Path src

# ファイルを移動
Move-Item -Path App.tsx -Destination src/
Move-Item -Path components -Destination src/
Move-Item -Path contexts -Destination src/
Move-Item -Path hooks -Destination src/
Move-Item -Path lib -Destination src/
Move-Item -Path styles -Destination src/
Move-Item -Path types -Destination src/
Move-Item -Path utils -Destination src/

# 不要ファイルを削除
Remove-Item -Path ads.txt, toast-analysis.md -Force

Write-Host "✅ ファイル移行完了"
```

## ✅ 移行後の確認

移行完了後、以下を確認：

1. **ファイルの存在確認**
   ```bash
   ls src/App.tsx
   ls src/components/
   ls src/main.tsx
   ls public/ads.txt
   ```

2. **ビルドテスト**
   ```bash
   npm install
   npm run build
   ```

3. **ローカルでの動作確認**
   ```bash
   npm run dev
   ```

4. **型チェック**
   ```bash
   npm run type-check
   ```

## 🚨 注意事項

- **バックアップ**: 移行前に必ずプロジェクト全体のバックアップを取ってください
- **Git**: 既にGit管理している場合は、`git mv` コマンドを使用してください
- **パス**: すべてのインポートパスが相対的に正しいことを確認してください
- **環境変数**: `.env` ファイルは `.env.example` をコピーして作成してください

## 📝 次のステップ

移行が完了したら、`DEPLOYMENT.md` を参照してGitHubへのアップロードとNetlifyへのデプロイを行ってください。
