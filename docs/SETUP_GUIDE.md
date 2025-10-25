# LIVME セットアップガイド

## 目次
1. [環境構築](#環境構築)
2. [Supabaseプロジェクトの作成](#supabaseプロジェクトの作成)
3. [データベースのセットアップ](#データベースのセットアップ)
4. [環境変数の設定](#環境変数の設定)
5. [開発サーバーの起動](#開発サーバーの起動)
6. [デプロイ](#デプロイ)

## 環境構築

### 必要なツール
- Node.js 20以上
- npm または yarn
- Git

### プロジェクトのクローン

```bash
git clone https://github.com/yourusername/livme.git
cd livme
npm install
```

## Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワードを設定
4. リージョンを選択（日本の場合は「Northeast Asia (Tokyo)」を推奨）
5. プロジェクトが作成されるまで待機（約2分）

## データベースのセットアップ

### 1. SQLエディタでテーブルを作成

1. Supabase Dashboardの左サイドバーから「SQL Editor」を選択
2. 「New Query」をクリック
3. `docs/livme-complete-database-setup.sql`の内容をコピー＆ペースト
4. 「Run」をクリックして実行

### 2. Storageバケットの作成

1. 左サイドバーから「Storage」を選択
2. 「Create a new bucket」をクリック
3. バケット名: `images`
4. Public bucket: `ON`にチェック
5. File size limit: `5MB`
6. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`
7. 「Create bucket」をクリック

### 3. Storage Policyの設定

1. 作成した`images`バケットを選択
2. 「Policies」タブを開く
3. 以下のポリシーを追加:

**アップロードポリシー（INSERT）:**
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

**閲覧ポリシー（SELECT）:**
```sql
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

**削除ポリシー（DELETE）:**
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 環境変数の設定

### 1. Supabase APIキーの取得

1. Supabase Dashboardの「Project Settings」→「API」を開く
2. 以下の情報をコピー:
   - `Project URL` (例: https://xxxxxxxxxxxxx.supabase.co)
   - `anon public` キー

### 2. .envファイルの作成

プロジェクトルートに`.env`ファイルを作成し、以下を記述:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

## デプロイ

### Netlifyへのデプロイ

1. [Netlify](https://www.netlify.com/)にサインアップ/ログイン
2. 「Add new site」→「Import an existing project」
3. GitHubリポジトリを接続
4. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 環境変数を設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. 「Deploy site」をクリック

### カスタムドメインの設定（オプション）

1. Netlify Dashboardで「Domain settings」を開く
2. 「Add custom domain」をクリック
3. ドメイン名を入力
4. DNSレコードを設定（Netlify DNSまたは外部DNS）

## トラブルシューティング

### データベース接続エラー

- `.env`ファイルの値が正しいか確認
- Supabase URLとANON KEYが一致しているか確認
- Supabaseプロジェクトが起動しているか確認

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run build -- --force
```

### 画像アップロードエラー

- Storageバケット`images`が作成されているか確認
- Storageポリシーが正しく設定されているか確認
- ファイルサイズが5MB以下か確認

## サポート

問題が発生した場合は、GitHubのIssuesセクションで報告してください。
