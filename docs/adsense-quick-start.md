# AdSense クイックスタート

最短5分でLIVMEに広告を表示する手順です。

---

## 📋 準備するもの

- ✅ Google AdSenseアカウント（既に登録済み）
- ✅ パブリッシャーID: `ca-pub-9899334610612784`

---

## 🚀 クイックセットアップ（5ステップ）

### ステップ1: AdSense管理画面で広告ユニットを作成

1. https://www.google.com/adsense/ にログイン
2. **広告 > 広告ユニットごと > ディスプレイ広告**
3. 以下の設定で作成：
   - 名前: `LIVME - アコーディオン内バナー`
   - 広告サイズ: **レスポンシブ**
4. **作成** をクリック
5. **広告スロットID**（数字のみ、例: `1234567890`）をコピー

---

### ステップ2: 広告を有効化

#### 2.1 App.tsx を編集

`/App.tsx` の約640行目あたりを探して編集：

**変更前**:
```tsx
<AdSlot
  key={`ad-${year}-${month}`}
  variant="banner"
  enabled={false} // ← これを変更
  isModalOpen={!!(selectedLive || showAddLive || showProfile || showUserProfile)}
  slotId={`ad-accordion-${year}`}
/>
```

**変更後**:
```tsx
<AdSlot
  key={`ad-${year}-${month}`}
  variant="banner"
  enabled={true} // ← true に変更
  isModalOpen={!!(selectedLive || showAddLive || showProfile || showUserProfile)}
  slotId={`ad-accordion-${year}`}
  adUnitId="1234567890" // ← ステップ1でコピーしたスロットIDを貼り付け
/>
```

---

### ステップ3: ads.txt を配置

#### 3.1 ads.txt ファイルを作成

AdSense管理画面の指示に従って、以下の内容で `ads.txt` を作成：

```
google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
```

#### 3.2 配置場所

- **Netlifyの場合**: `public/ads.txt` に配置
- **Vercelの場合**: `public/ads.txt` に配置
- **カスタムサーバー**: ルートディレクトリに配置

確認URL: `https://yourdomain.com/ads.txt`

---

### ステップ4: デプロイして確認

1. コードをコミット＆プッシュ
2. 本番環境にデプロイ
3. ブラウザで確認（広告ブロッカーをオフにする）

**確認方法**:
- 参加公演リストで2つ目の月の後にカード型の枠が表示される
- 「広告」ラベルが左上に表示される
- F12で開発者ツールを開き、コンソールで以下を確認：
  ```
  ✅ AdSense script loaded successfully
  ✅ AdSense ad initialized for slot: ad-accordion-2025
  ```

---

### ステップ5: モニタリング

AdSense管理画面で以下を確認：

- **広告リクエスト数**: 広告が正しくリクエストされているか
- **表示回数**: 広告が実際に表示されているか
- **インプレッション**: 有効な広告表示数

**注意**: 広告が実際に表示されるまで数時間〜24時間かかる場合があります。

---

## 🎯 次のステップ（オプション）

### プロフィール末尾の広告も有効化

`/components/ProfileModal.tsx` の約1327行目あたり：

**変更前**:
```tsx
<AdSlot
  variant="native"
  enabled={false} // ← これを変更
  isModalOpen={false}
  slotId={`ad-profile-${user.id}`}
/>
```

**変更後**:
```tsx
<AdSlot
  variant="native"
  enabled={true} // ← true に変更
  isModalOpen={false}
  slotId={`ad-profile-${user.id}`}
  adUnitId="0987654321" // ← 新しい広告ユニットIDを設定
/>
```

**推奨**: まずは1枠のみ有効化し、1週間程度モニタリングしてから追加枠を有効化してください。

---

## ❓ トラブルシューティング

### 広告が表示されない

1. **AdSenseアカウントが承認されているか確認**
   - AdSense管理画面でステータスをチェック
   - 承認には数日かかる場合がある

2. **ブラウザの広告ブロッカーを無効化**
   - AdBlock、uBlock Originなどをオフにする

3. **コンソールエラーを確認**
   - F12で開発者ツールを開く
   - Consoleタブでエラーがないか確認

4. **設定を再確認**
   - `enabled={true}` になっているか
   - `adUnitId` が正しく設定されているか
   - パブリッシャーIDが `ca-pub-9899334610612784` か

### 「広告枠」のみ表示される

これは正常です。以下の理由が考えられます：

- AdSenseの審査中
- トラフィックが少ない
- 広告在庫がない
- デバイスやロケーションの問題

**対処法**: 24時間待ってから再確認してください。

---

## 📞 サポート

詳細なガイド: `/docs/adsense-setup-guide.md`

Google AdSenseヘルプ: https://support.google.com/adsense/

---

**最終更新**: 2025年10月16日  
**所要時間**: 約5分  
**難易度**: ★☆☆☆☆（簡単）
