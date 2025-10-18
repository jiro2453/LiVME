# AdSense サイト所有権確認ガイド

「お客様のサイトは確認できませんでした」エラーの解決方法です。

---

## 問題の原因

Figma Makeのプレビュー環境では、以下の理由でAdSenseの自動確認が失敗します：

1. **ads.txtへのアクセス不可**
   - Figma Makeのプレビュー環境では、ルートディレクトリの`ads.txt`にGoogleクローラーがアクセスできない
   - `https://preview.figma.com/ads.txt` などの一時的なURLではAdSenseの確認ができない

2. **本番環境へのデプロイが必要**
   - AdSenseの確認には、独自ドメインまたは公開URLが必要
   - Netlify、Vercel、またはカスタムサーバーにデプロイする必要がある

---

## ✅ 解決方法1: 本番環境にデプロイ（推奨）

### ステップ1: 本番環境にデプロイ

#### Netlifyの場合

1. **Netlifyアカウントを作成**
   - https://www.netlify.com/ にアクセス
   - GitHubアカウントでサインアップ

2. **リポジトリを接続**
   - "Add new site" → "Import an existing project"
   - GitHubリポジトリを選択

3. **ビルド設定**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **デプロイ**
   - "Deploy site" をクリック
   - デプロイが完了するまで待つ（通常2〜3分）

5. **URLを確認**
   - デプロイ後のURL（例: `https://your-app.netlify.app`）をコピー

#### Vercelの場合

1. **Vercelアカウントを作成**
   - https://vercel.com/ にアクセス
   - GitHubアカウントでサインアップ

2. **プロジェクトをインポート**
   - "Add New" → "Project"
   - GitHubリポジトリを選択

3. **デプロイ**
   - デフォルト設定のまま "Deploy" をクリック
   - デプロイが完了するまで待つ

4. **URLを確認**
   - デプロイ後のURL（例: `https://your-app.vercel.app`）をコピー

### ステップ2: ads.txtが正しく配置されているか確認

ブラウザで以下のURLにアクセス：

```
https://your-app.netlify.app/ads.txt
```

**期待される表示**:
```
google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
```

### ステップ3: AdSenseでサイトを確認

1. **AdSense管理画面にアクセス**
   - https://www.google.com/adsense/

2. **サイトを追加**
   - "サイト" → "サイトを追加"
   - デプロイ後のURL（例: `https://your-app.netlify.app`）を入力

3. **確認方法を選択**
   - 「ads.txt ファイル」を選択

4. **確認を実行**
   - "確認" をクリック
   - 数分〜数時間で確認が完了

---

## ✅ 解決方法2: HTMLタグによる確認（既に実装済み）

本番環境にデプロイできない場合、HTMLタグ方式で確認できます。

### 実装済みの内容

`/App.tsx` に以下のコードが追加されています：

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

### AdSenseでの設定手順

1. **AdSense管理画面にアクセス**
   - https://www.google.com/adsense/

2. **確認方法を変更**
   - "サイト" → 該当サイトの "詳細を表示"
   - "別の方法を試す" をクリック

3. **HTMLタグを選択**
   - "HTMLタグ" を選択
   - 以下のタグが表示される：
     ```html
     <meta name="google-adsense-account" content="ca-pub-9899334610612784">
     ```

4. **確認を実行**
   - このタグは既にアプリに実装済み
   - "確認" をクリック

5. **確認ステータスを待つ**
   - 数分〜数時間で確認が完了
   - "確認済み" になったらOK

---

## 🔍 確認方法

### メタタグが正しく追加されているか確認

1. **ブラウザで開発者ツールを開く**
   - F12キーを押す

2. **Elementsタブを開く**
   - `<head>` タグを展開

3. **メタタグを確認**
   - 以下のタグが存在することを確認：
     ```html
     <meta name="google-adsense-account" content="ca-pub-9899334610612784">
     ```

4. **コンソールログを確認**
   - Consoleタブを開く
   - 以下のログが表示されることを確認：
     ```
     ✅ AdSense verification meta tag added
     ```

### ads.txtが正しいか確認（本番環境のみ）

ブラウザで以下のURLにアクセス：

```
https://your-domain.com/ads.txt
```

**期待される内容**:
```
google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
```

---

## ⏰ 確認にかかる時間

- **最短**: 数分
- **通常**: 数時間〜24時間
- **最長**: 数日（トラフィックが少ない場合）

**注意**: Googleのクローラーがサイトにアクセスするまで時間がかかることがあります。

---

## ❓ よくある質問

### Q1: 「サイトの所有権を確認できませんでした」エラーが出る

**A1**: 以下を確認してください：

1. ✅ 本番環境にデプロイされているか
2. ✅ ads.txtが正しく配置されているか
3. ✅ メタタグが正しく追加されているか
4. ✅ サイトがGoogleクローラーにアクセス可能か

### Q2: Figma Makeのプレビュー環境で確認できますか？

**A2**: いいえ、できません。

- Figma Makeのプレビュー環境は一時的なURLです
- Googleクローラーがアクセスできません
- 本番環境へのデプロイが必要です

### Q3: 無料でデプロイできますか？

**A3**: はい、できます。

- **Netlify**: 無料プラン（月100GB帯域幅）
- **Vercel**: 無料プラン（月100GB帯域幅）
- **GitHub Pages**: 無料（静的サイトのみ）

### Q4: 確認が完了したら何をすればいいですか？

**A4**: 以下のステップに進んでください：

1. ✅ 広告ユニットを作成
2. ✅ `AdSlot` コンポーネントに広告ユニットIDを設定
3. ✅ `enabled={true}` で広告を有効化
4. ✅ デプロイして広告が表示されるか確認

詳細は `/docs/adsense-quick-start.md` を参照してください。

### Q5: 「ads.txtファイルに問題があります」と表示される

**A5**: 以下を確認してください：

1. **ads.txtの内容が正しいか**
   ```
   google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0
   ```

2. **ads.txtがルートディレクトリにあるか**
   - URL: `https://your-domain.com/ads.txt`
   - パス: `/ads.txt`

3. **改行や空白が余計にないか**
   - テキストエディタで確認
   - UTF-8エンコーディング

4. **24時間待つ**
   - Googleのクローラーが定期的にチェック
   - 即座には反映されない

---

## 📝 チェックリスト

### デプロイ前

- [ ] `ads.txt` ファイルが `/ads.txt` に存在する
- [ ] 内容が `google.com, pub-9899334610612784, DIRECT, f08c47fec0942fa0` と一致
- [ ] `App.tsx` にメタタグが追加されている（既に実装済み）

### デプロイ後

- [ ] 本番環境にデプロイ完了
- [ ] `https://your-domain.com/ads.txt` にアクセスできる
- [ ] ads.txtの内容が正しく表示される
- [ ] メタタグが `<head>` 内に存在する

### AdSense設定

- [ ] AdSense管理画面でサイトを追加
- [ ] 確認方法を選択（ads.txt または HTMLタグ）
- [ ] 確認を実行
- [ ] 確認完了まで待つ（数時間〜24時間）

---

## 🚀 次のステップ

確認が完了したら：

1. **広告ユニットを作成**
   - `/docs/adsense-quick-start.md` を参照

2. **広告を有効化**
   - `App.tsx` と `ProfileModal.tsx` で `enabled={true}` に設定

3. **テスト**
   - 本番環境で広告が表示されるか確認

4. **モニタリング**
   - AdSense管理画面でインプレッション数を確認

---

## 📞 サポート

### 参考ドキュメント

- `/docs/adsense-setup-guide.md` - 詳細なセットアップガイド
- `/docs/adsense-quick-start.md` - クイックスタートガイド
- `/docs/adsense-deployment-checklist.md` - デプロイチェックリスト

### Google AdSense ヘルプ

- サイトの所有権確認: https://support.google.com/adsense/answer/76270
- ads.txtガイド: https://support.google.com/adsense/answer/7532444

---

**最終更新**: 2025年10月16日  
**所要時間**: 15分（デプロイ含む）  
**必要条件**: 本番環境へのデプロイ
