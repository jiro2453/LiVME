# AdSense 確認ステータス

現在の実装状況とAdSense確認の進捗状況です。

---

## ✅ 実装済み

### 1. ads.txt ファイル

**ファイル**: `/ads.txt`

**内容**:
```
google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
```

**ステータス**: ✅ 実装済み

**注意**: Figma Makeのプレビュー環境ではアクセスできません。本番環境へのデプロイが必要です。

---

### 2. HTMLメタタグ（AdSense確認用）

**ファイル**: `/App.tsx`

**実装内容**:
```typescript
useEffect(() => {
  // AdSense確認用のメタタグを追加
  const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
  if (!existingMeta) {
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = 'ca-pub-9899334610612784';
    document.head.appendChild(meta);
    console.log('✅ AdSense verification meta tag added');
  }
}, []);
```

**ステータス**: ✅ 実装済み

**確認方法**:
1. アプリを起動
2. F12で開発者ツールを開く
3. Elementsタブで `<head>` 内に以下が存在することを確認：
   ```html
   <meta name="google-adsense-account" content="ca-pub-9899334610612784">
   ```

---

### 3. AdSenseスクリプト

**ファイル**: `/components/AdSlot.tsx`

**実装内容**:
```typescript
const ADSENSE_CLIENT_ID = 'ca-pub-9899334610612784';
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

// AdSenseスクリプトを動的に読み込む
function loadAdSenseScript(): Promise<void> {
  // ... スクリプト読み込みロジック
}
```

**ステータス**: ✅ 実装済み

**確認方法**:
1. アプリを起動してログイン
2. 参加公演を複数追加（異なる年月）
3. F12 → Consoleタブで以下を確認：
   ```
   ✅ AdSense script loaded successfully
   ```

---

## 🚧 本番環境デプロイが必要

### 現在の状況

- **環境**: Figma Make プレビュー環境
- **URL**: `blob:https://...figmaiframepreview.figma.site/...` （一時的）
- **AdSense確認**: ❌ 不可（本番環境が必要）

### 必要なアクション

1. **本番環境にデプロイ**
   - Netlify、Vercel、またはカスタムサーバー
   - 独自ドメインまたは公開URL

2. **ads.txtの確認**
   - デプロイ後、`https://your-domain.com/ads.txt` にアクセス
   - 内容が正しく表示されることを確認

3. **AdSenseで確認**
   - AdSense管理画面でサイトを追加
   - 確認方法を選択（ads.txt または HTMLタグ）
   - 確認を実行

---

## 📊 確認フロー

```
┌─────────────────────────────────────────────────────────┐
│ 1. 本番環境にデプロイ                                      │
│    ├─ Netlify / Vercel / カスタムサーバー                │
│    └─ 公開URL取得（例: https://your-app.netlify.app）   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. ads.txtの確認                                         │
│    ├─ https://your-domain.com/ads.txt にアクセス        │
│    └─ 内容: google.com, pub-9899334610612784, ...      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. メタタグの確認（オプション）                            │
│    ├─ F12で開発者ツールを開く                            │
│    └─ <meta name="google-adsense-account" ... を確認   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. AdSense管理画面でサイトを追加                          │
│    ├─ サイトURL: https://your-domain.com                │
│    └─ 確認方法: ads.txt または HTMLタグ                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. 確認を実行                                            │
│    ├─ "確認" ボタンをクリック                            │
│    └─ 数時間〜24時間待つ                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. 確認完了 ✅                                           │
│    ├─ ステータス: "確認済み"                             │
│    └─ 広告ユニット作成可能                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 推奨デプロイ先

### Netlify（推奨）

**メリット**:
- ✅ 無料プラン（月100GB帯域幅）
- ✅ GitHubと連携
- ✅ 自動デプロイ
- ✅ カスタムドメイン対応
- ✅ ads.txt自動配置

**デプロイ手順**:
1. https://www.netlify.com/ でアカウント作成
2. GitHubリポジトリを接続
3. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. "Deploy site" をクリック

**デプロイ後**:
- URL: `https://your-app.netlify.app`
- ads.txt: `https://your-app.netlify.app/ads.txt`

---

### Vercel

**メリット**:
- ✅ 無料プラン（月100GB帯域幅）
- ✅ GitHubと連携
- ✅ 自動デプロイ
- ✅ カスタムドメイン対応

**デプロイ手順**:
1. https://vercel.com/ でアカウント作成
2. GitHubリポジトリをインポート
3. "Deploy" をクリック

**デプロイ後**:
- URL: `https://your-app.vercel.app`
- ads.txt: `https://your-app.vercel.app/ads.txt`

---

## 🧪 テスト

### メタタグの確認（開発環境）

1. **ブラウザで確認**
   ```
   F12 → Elements → <head> → 
   <meta name="google-adsense-account" content="ca-pub-9899334610612784">
   ```

2. **コンソールログ**
   ```
   F12 → Console → 
   ✅ AdSense verification meta tag added
   ```

### ads.txtの確認（本番環境のみ）

1. **ブラウザでアクセス**
   ```
   https://your-domain.com/ads.txt
   ```

2. **期待される表示**
   ```
   google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
   ```

3. **HTTPステータス**
   - Status: `200 OK`
   - Content-Type: `text/plain`

---

## 📋 チェックリスト

### 実装

- [x] ads.txtファイルを作成
- [x] ads.txtの内容が正しい
- [x] AdSense確認用メタタグを実装
- [x] AdSenseスクリプトを実装
- [x] 広告枠コンポーネントを実装

### デプロイ前

- [ ] 本番環境にデプロイ
- [ ] ads.txtにアクセスできるか確認
- [ ] メタタグが正しく追加されているか確認
- [ ] AdSenseスクリプトが読み込まれるか確認

### AdSense設定

- [ ] AdSense管理画面でサイトを追加
- [ ] 確認方法を選択
- [ ] 確認を実行
- [ ] 確認完了を待つ（数時間〜24時間）
- [ ] 広告ユニットを作成
- [ ] 広告を有効化

---

## 📞 次のステップ

確認が完了したら：

1. **広告ユニットを作成**
   - AdSense管理画面で広告ユニットを作成
   - 広告スロットIDをコピー

2. **コードを更新**
   - `App.tsx` で `adUnitId="YOUR_SLOT_ID"` を設定
   - `enabled={true}` に変更

3. **デプロイ**
   - 変更をコミット＆プッシュ
   - 自動デプロイを待つ

4. **確認**
   - 本番環境で広告が表示されるか確認
   - AdSense管理画面でインプレッションを確認

---

**最終更新**: 2025年10月16日  
**実装ステータス**: ✅ コード実装完了 / 🚧 本番デプロイ待ち  
**次のマイルストーン**: 本番環境デプロイ → AdSense確認
