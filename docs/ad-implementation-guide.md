# LIVME 広告実装ガイド

## 概要

LIVMEアプリケーションにおける広告枠の設計・実装・運用ガイドラインです。
ユーザー体験を損なわず、レイアウトシフトを回避した広告配置を実現します。

---

## 配置場所と仕様

### 1. アコーディオン内インリスト広告

**配置場所**: 各年の2つ目の「月」セクションの直後

**実装ファイル**: `/App.tsx`

**仕様**:
- バリアント: `banner` (320×100相当)
- 横幅: 100% (レスポンシブ)
- 想定高さ: 100px
- 上下余白: 8px
- slotId: `ad-accordion-{year}`

**配置ルール**:
```typescript
// 各年の2つ目の月（monthIndex === 1）の直後に挿入
if (monthIndex === 1) {
  elements.push(
    <AdSlot
      key={`ad-${year}-${month}`}
      variant="banner"
      enabled={false} // A/Bテスト用
      isModalOpen={!!(selectedLive || showAddLive || showProfile || showUserProfile)}
      slotId={`ad-accordion-${year}`}
    />
  );
}
```

**目的**:
- ユーザーがスクロールしながら自然に目にする位置
- 月セクションが複数ある年にのみ表示（データ量が十分な場合）
- 2つ目の月の後なので、1つ目の月の内容を妨げない

---

### 2. プロフィール画面のライブ一覧末尾

**配置場所**: プロフィールモーダル内の過去の参加公演リスト末尾

**実装ファイル**: `/components/ProfileModal.tsx`

**仕様**:
- バリアント: `native` (ネイティブカード風)
- 横幅: 100% (レスポンシブ)
- 想定高さ: 自動（最小120px）
- 上下余白: 8px
- slotId: `ad-profile-{userId}`

**配置ルール**:
```typescript
// 過去の参加公演アコーディオンの直後
<div className="mt-4">
  <AdSlot
    variant="native"
    enabled={false}
    isModalOpen={false}
    slotId={`ad-profile-${user.id}`}
  />
</div>
```

**目的**:
- プロフィール画面は滞在時間が長く、広告の受容性が高い
- リストの末尾なので、メインコンテンツを妨げない
- ネイティブカード風で、LiveCardと視覚的に調和

---

### 3. 検索結果リスト（未実装・将来の拡張）

**配置場所**: 検索結果の2カード目の後

**仕様**:
- バリアント: `banner` (320×100相当)
- 横幅: 100% (レスポンシブ)
- 想定高さ: 100px
- 上下余白: 8px

**配置ルール**:
検索結果が3件以上ある場合のみ、2件目の後に挿入

**目的**:
- 検索意図を妨げない位置（1件目の直後は避ける）
- 検索結果が少ない場合は表示しない

---

## コンポーネント仕様

### AdSlot コンポーネント

**ファイル**: `/components/AdSlot.tsx`

**Props**:

| プロップ名 | 型 | デフォルト | 説明 |
|-----------|---|-----------|------|
| `variant` | `'banner' \| 'rectangle' \| 'native'` | `'banner'` | 広告枠のサイズバリアント |
| `enabled` | `boolean` | `false` | 広告を有効化するか（A/Bテスト用） |
| `isModalOpen` | `boolean` | `false` | モーダルが開いているか（開いている場合は非表示） |
| `slotId` | `string` | `'ad-slot-default'` | 広告枠の一意なID |
| `className` | `string` | `''` | カスタムクラス名 |

**バリアント定義**:

```typescript
const VARIANT_STYLES = {
  banner: {
    height: '100px',        // 320×100相当
    aspectRatio: '320 / 100',
  },
  rectangle: {
    height: '250px',        // 300×250相当
    aspectRatio: '300 / 250',
  },
  native: {
    height: 'auto',
    minHeight: '120px',     // ネイティブ広告（可変高さ）
  },
};
```

---

### AdLabel コンポーネント

**ファイル**: `/components/AdLabel.tsx`

**仕様**:
- テキスト: "広告"
- 背景色: `#E5E7EB` (gray-200)
- テキスト色: `#6B7280` (gray-500)
- フォントサイズ: 10px
- パディング: 横8px、縦2px
- 角丸: デフォルト

**配置**:
広告枠カードの左上に配置

---

## 実装上の注意事項

### 1. レイアウトシフト回避

**必須事項**:
- 広告枠は固定高さのプレースホルダーを先に描画
- 広告SDKのロードは初回描画後500〜1000ms遅延
- 広告が表示されない場合もスペースを確保
- IntersectionObserverで画面内に入った時のみロード

**実装例**:
```typescript
useEffect(() => {
  if (!enabled || !adRef.current) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          
          // 500ms遅延で広告SDK初期化
          setTimeout(() => {
            // TODO: 広告SDKの初期化処理
            setIsLoaded(true);
          }, 500);
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(adRef.current);
  return () => observer.unobserve(adRef.current);
}, [enabled, isVisible]);
```

---

### 2. モーダル表示中の非表示

**理由**:
- ユーザーの操作を妨げない
- 誤クリックを防止
- モーダルフォーカス時の体験向上

**実装**:
```typescript
// モーダル表示中は非表示
if (isModalOpen) {
  return null;
}
```

---

### 3. A/Bテスト対応

**初期設定**:
- すべての広告枠は `enabled={false}` で無効化
- ステージング環境ではプレースホルダーのみ表示
- 本番環境でもA/Bテストで段階的に有効化

**有効化手順**:
1. 最初は1枠のみ有効化（アコーディオン内）
2. KPIを計測（広告表示率、CTR、ビューアビリティ、離脱率）
3. 問題なければ他の枠も段階的に有効化

---

### 4. パフォーマンス

**最適化手法**:
- IntersectionObserverで遅延ロード
- 広告SDKは非同期ロード
- タイムアウト処理（3秒以内にロードされない場合はプレースホルダー維持）
- エラー時のフォールバック

**ログ・モニタリング**:
```typescript
// エラーハンドリング例
try {
  // 広告SDK初期化
} catch (error) {
  console.error('Ad load failed:', error);
  // プレースホルダーを維持してUXを損なわない
}
```

---

## 広告SDK統合手順

### 1. 広告ネットワーク選定

**推奨**:
- **Google AdSense**: 導入が容易、自動最適化
- **Google Ad Manager (GAM)**: 運用強化、複数ネットワーク管理

### 2. スクリプトタグ追加

`index.html` の `<head>` に広告SDKスクリプトを追加:

```html
<!-- Google AdSense の例 -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

### 3. 広告ユニット作成

- ネットワーク管理画面で広告ユニットを作成
- サイズ: レスポンシブ or 固定サイズ
- フォーマット: ディスプレイ、ネイティブ

### 4. AdSlotコンポーネント内で広告表示

```typescript
useEffect(() => {
  if (isVisible && enabled) {
    setTimeout(() => {
      try {
        // AdSenseの例
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsLoaded(true);
      } catch (error) {
        console.error('Ad initialization failed:', error);
      }
    }, 500);
  }
}, [isVisible, enabled]);
```

### 5. エラーハンドリング

```typescript
// タイムアウト処理
const timeout = setTimeout(() => {
  if (!isLoaded) {
    console.warn('Ad load timeout');
    // プレースホルダーを維持
  }
}, 3000);

return () => clearTimeout(timeout);
```

---

## コンプライアンス

### 1. 広告ラベルの明示

- **必須**: すべての広告枠に「広告」ラベルを表示
- **実装**: AdLabelコンポーネントを使用
- **位置**: 広告枠カードの左上

### 2. プライバシーポリシー

- クッキーの使用を明示
- 広告パーソナライゼーションの説明
- オプトアウト手段の提供

### 3. 同意管理（CMP）

地域により必要に応じて実装:
- EU: GDPR対応（Cookie同意バナー）
- カリフォルニア: CCPA対応

### 4. コンテンツカテゴリ制限

広告ネットワーク側で設定:
- 年齢配慮設定
- 不適切なカテゴリのブロック
- ブランドセーフティ設定

---

## KPI計測

### 計測項目

| KPI | 説明 | 目標 |
|-----|------|------|
| 広告表示率 | 広告が正常に表示された割合 | >95% |
| CTR | クリック率 | 0.5%〜2% |
| ビューアビリティ | 広告が可視領域に表示された割合 | >70% |
| スクロール深度 | ユーザーが広告位置までスクロールした割合 | >60% |
| 離脱率 | 広告表示後の離脱率 | <10%増加 |
| 主要操作率 | 公演追加、プロフィール編集などの操作率 | 変化なし |

### 計測ツール

- Google Analytics 4 (GA4)
- 広告ネットワークのダッシュボード
- カスタムイベントトラッキング

---

## 運用フロー

### フェーズ1: 導入（1週間）

1. ステージング環境でプレースホルダー確認
2. 広告SDK統合とテスト
3. 1枠のみ有効化（アコーディオン内）
4. KPI計測開始

### フェーズ2: 最適化（2〜4週間）

1. KPIレビュー
2. 広告位置の微調整
3. A/Bテストで追加枠の効果検証

### フェーズ3: 拡大（4週間〜）

1. プロフィール末尾広告の有効化
2. 検索結果広告の検討
3. 継続的なモニタリングと最適化

---

## トラブルシューティング

### 広告が表示されない

**確認事項**:
1. `enabled` propが `true` になっているか
2. 広告SDKスクリプトが正しくロードされているか
3. コンソールエラーを確認
4. ネットワーク管理画面で広告ユニットが承認されているか

### レイアウトシフトが発生する

**対策**:
1. プレースホルダーの高さを固定
2. 広告ロード前にスペースを確保
3. `will-change` プロパティを使用

### パフォーマンスが低下する

**対策**:
1. IntersectionObserverで遅延ロード
2. 広告SDK読み込みタイミングを調整
3. 広告枠の数を減らす
4. サーバーサイドレンダリング（SSR）を検討

---

## まとめ

LIVMEの広告実装は、ユーザー体験を最優先に設計されています。

**重要ポイント**:
- レイアウトシフト回避（固定高さプレースホルダー）
- モーダル表示中は非表示
- A/Bテストで段階的導入
- 広告ラベルの明示
- パフォーマンスモニタリング

**次のステップ**:
1. ステージング環境で広告プレースホルダーを確認
2. 広告ネットワークの選定とアカウント作成
3. SDK統合とテスト
4. 本番環境で1枠のみA/Bテスト開始
5. KPI計測と最適化

---

## 参考リンク

- [Google AdSense ヘルプ](https://support.google.com/adsense/)
- [Google Ad Manager ドキュメント](https://support.google.com/admanager/)
- [Web広告のベストプラクティス](https://web.dev/vitals/)
- [GDPR対応ガイド](https://gdpr.eu/)

---

**最終更新**: 2025年10月16日  
**バージョン**: 1.0.0
