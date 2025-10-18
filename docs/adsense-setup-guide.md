# Google AdSense セットアップガイド

LIVMEアプリケーションでGoogle AdSenseを有効化する手順です。

---

## 前提条件

✅ Google AdSenseアカウントに登録済み  
✅ パブリッシャーID: `ca-pub-9899334610612784`  
✅ AdSenseスクリプトが追加済み（AdSlot.tsxに実装済み）

---

## ステップ1: AdSense管理画面で広告ユニットを作成

### 1.1 AdSense管理画面にログイン

https://www.google.com/adsense/ にアクセスしてログイン

### 1.2 広告ユニットを作成

**広告 > サマリー > 広告ユニットごと**

以下の3つの広告ユニットを作成します：

#### ① アコーディオン内バナー広告

- **名前**: LIVME - アコーディオン内バナー
- **広告タイプ**: ディスプレイ広告
- **広告サイズ**: レスポンシブ
- **推奨サイズ**: 320×100（横長バナー）

**作成後、広告スロットIDをコピー**（例: `1234567890`）

#### ② プロフィール末尾ネイティブ広告

- **名前**: LIVME - プロフィール末尾
- **広告タイプ**: インフィード広告 または ネイティブ広告
- **広告サイズ**: 自動サイズ（fluid）
- **レイアウト**: カード型

**作成後、広告スロットIDをコピー**

#### ③ 検索結果バナー広告（将来の拡張）

- **名前**: LIVME - 検索結果
- **広告タイプ**: ディスプレイ広告
- **広告サイズ**: レスポンシブ
- **推奨サイズ**: 320×100

**作成後、広告スロットIDをコピー**

---

## ステップ2: コードに広告スロットIDを設定

### 2.1 App.tsx - アコーディオン内広告

`/App.tsx` の広告枠設定を編集：

```tsx
// 各年の2つ目の月（インデックス1）の直後に広告を挿入
if (monthIndex === 1) {
  elements.push(
    <AdSlot
      key={`ad-${year}-${month}`}
      variant="banner"
      enabled={true} // ← false を true に変更
      isModalOpen={!!(selectedLive || showAddLive || showProfile || showUserProfile)}
      slotId={`ad-accordion-${year}`}
    />
  );
}
```

### 2.2 ProfileModal.tsx - プロフィール末尾広告

`/components/ProfileModal.tsx` の広告枠設定を編集：

```tsx
<div className="mt-4">
  <AdSlot
    variant="native"
    enabled={true} // ← false を true に変更
    isModalOpen={false}
    slotId={`ad-profile-${user.id}`}
  />
</div>
```

### 2.3 AdSlot.tsx - 広告スロットIDを設定

`/components/AdSlot.tsx` を編集して、AdSense管理画面で取得したスロットIDを設定：

```tsx
<ins
  className="adsbygoogle"
  style={{
    display: 'block',
    width: '100%',
    height: variant === 'native' ? 'auto' : styles.height,
  }}
  data-ad-client={ADSENSE_CLIENT_ID}
  data-ad-slot="1234567890" // ← ここに広告ユニットのスロットIDを設定
  data-ad-format={variant === 'native' ? 'fluid' : 'auto'}
  data-full-width-responsive="true"
/>
```

**重要**: 広告枠ごとに異なるスロットIDを設定する場合は、propsで渡すように実装を修正してください。

---

## ステップ3: 広告スロットIDをpropsで渡す実装（推奨）

複数の広告ユニットを使い分けるため、AdSlotコンポーネントを拡張します。

### 3.1 AdSlot.tsx の修正

```tsx
interface AdSlotProps {
  variant?: AdSlotVariant;
  enabled?: boolean;
  isModalOpen?: boolean;
  slotId?: string;
  adUnitId?: string; // ← 追加: AdSense広告ユニットID
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  variant = 'banner',
  enabled = false,
  isModalOpen = false,
  slotId = 'ad-slot-default',
  adUnitId = '', // ← 追加
  className = '',
}) => {
  // ... 既存のコード ...

  {/* 広告表示 */}
  {isLoaded && adUnitId && (
    <ins
      className="adsbygoogle"
      style={{
        display: 'block',
        width: '100%',
        height: variant === 'native' ? 'auto' : styles.height,
      }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={adUnitId} // ← propsから設定
      data-ad-format={variant === 'native' ? 'fluid' : 'auto'}
      data-full-width-responsive="true"
    />
  )}
}
```

### 3.2 App.tsx での使用例

```tsx
<AdSlot
  key={`ad-${year}-${month}`}
  variant="banner"
  enabled={true}
  isModalOpen={!!(selectedLive || showAddLive || showProfile || showUserProfile)}
  slotId={`ad-accordion-${year}`}
  adUnitId="1234567890" // ← AdSense管理画面で取得したスロットID
/>
```

### 3.3 ProfileModal.tsx での使用例

```tsx
<AdSlot
  variant="native"
  enabled={true}
  isModalOpen={false}
  slotId={`ad-profile-${user.id}`}
  adUnitId="0987654321" // ← AdSense管理画面で取得したスロットID（プロフィール用）
/>
```

---

## ステップ4: A/Bテストと段階的ロールアウト

### 4.1 初期テスト（1週間）

**1枠のみ有効化**:
- アコーディオン内バナー広告のみ `enabled={true}`
- 他の広告は `enabled={false}` のまま

**モニタリング**:
- Google AdSense管理画面で広告表示数、クリック率をチェック
- アプリの離脱率、主要操作率を確認
- ユーザーフィードバックを収集

### 4.2 拡大フェーズ（2週間後）

問題がなければ：
- プロフィール末尾広告を `enabled={true}` に変更
- 引き続きKPIをモニタリング

### 4.3 最適化フェーズ（1ヶ月後）

- 広告配置の調整
- 広告フォーマットの最適化
- 収益とUXのバランスを確認

---

## ステップ5: ads.txtの設定

Google AdSenseからの収益を受け取るために、ads.txtファイルをサイトのルートに配置する必要があります。

### 5.1 ads.txtの内容

AdSense管理画面で指定される内容（例）：

```
google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
```

### 5.2 配置場所

- **Netlify/Vercel**: publicフォルダに `ads.txt` を配置
- **カスタムサーバー**: ルートディレクトリに配置

アクセスURL: `https://yourdomain.com/ads.txt`

---

## ステップ6: プライバシーポリシーとクッキー同意

### 6.1 プライバシーポリシーに広告の記載を追加

**必須項目**:
- Google AdSenseを使用していること
- パーソナライズド広告の使用
- ユーザーのオプトアウト権利
- クッキーの使用

### 6.2 同意管理プラットフォーム（CMP）の導入

**GDPR対応が必要な場合**:
- EUユーザー向けにクッキー同意バナーを表示
- Google Funding Choices（AdSense標準）を使用

**実装例** (App.tsxに追加):

```tsx
useEffect(() => {
  // Google Funding Choices（AdSense標準のCMP）
  if (typeof window !== 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://fundingchoicesmessages.google.com/i/pub-9899334610612784?ers=1';
    script.async = true;
    document.head.appendChild(script);
  }
}, []);
```

---

## トラブルシューティング

### 広告が表示されない

**確認事項**:

1. **AdSenseアカウントが承認されているか**
   - AdSense管理画面でステータスを確認
   - 承認には数日〜2週間かかる場合がある

2. **広告ユニットが正しく設定されているか**
   - data-ad-client: `ca-pub-9899334610612784`
   - data-ad-slot: 正しいスロットID
   - enabled prop: `true`

3. **ブラウザの広告ブロッカーを無効化**
   - AdBlockなどが有効だと広告が表示されない

4. **コンソールエラーを確認**
   - F12で開発者ツールを開いてエラーをチェック
   - "AdSense script loaded successfully" が表示されるか確認

5. **ads.txtが正しく配置されているか**
   - `https://yourdomain.com/ads.txt` にアクセスして確認

### 広告が表示されるが収益が発生しない

**確認事項**:

1. **AdSenseアカウントの収益化が有効か**
   - 支払い情報が登録されているか確認

2. **広告のクリックが有効か**
   - 自分でクリックすると規約違反になるため注意

3. **十分なトラフィックがあるか**
   - AdSenseは一定のトラフィックがないと収益化されにくい

---

## まとめ

LIVMEでGoogle AdSenseを有効化する手順：

1. ✅ AdSense管理画面で広告ユニットを作成
2. ✅ 広告スロットIDをコードに設定
3. ✅ `enabled={true}` で広告を有効化
4. ✅ ads.txtを配置
5. ✅ プライバシーポリシーを更新
6. ✅ A/Bテストで段階的にロールアウト

**次のステップ**:
- 広告表示数とクリック率をモニタリング
- ユーザー体験への影響を確認
- 収益とUXのバランスを最適化

---

**最終更新**: 2025年10月16日  
**バージョン**: 1.0.0  
**パブリッシャーID**: ca-pub-9899334610612784
