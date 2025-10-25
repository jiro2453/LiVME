# LIVME クイックスタートガイド

## 🎯 5分で動作確認する方法

### ステップ1: Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック（GitHubアカウントでサインアップ）
3. 「New Project」をクリック
4. 以下を入力：
   - **Name**: livme-dev
   - **Database Password**: 安全なパスワード（保存しておいてください）
   - **Region**: Northeast Asia (Tokyo)
5. 「Create new project」をクリック
6. プロジェクトが作成されるまで待機（約2分）

### ステップ2: データベースのセットアップ

1. 左サイドバーの「SQL Editor」をクリック
2. 「New Query」をクリック
3. 以下のSQLをコピー＆ペースト：

```sql
-- usersテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '未設定',
  avatar_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);

-- livesテーブル
CREATE TABLE lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  venue TEXT NOT NULL,
  artist_name TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lives_user_id ON lives(user_id);
CREATE INDEX idx_lives_date ON lives(date);

-- followsテーブル
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- usersのRLSポリシー
CREATE POLICY "Anyone can view user profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Authenticated users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- livesのRLSポリシー
CREATE POLICY "Anyone can view lives" ON lives FOR SELECT USING (true);
CREATE POLICY "Users can insert own lives" ON lives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lives" ON lives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lives" ON lives FOR DELETE USING (auth.uid() = user_id);

-- followsのRLSポリシー
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);
```

4. 「Run」をクリック（緑色のボタン）
5. 成功メッセージが表示されることを確認

### ステップ3: APIキーの取得

1. 左サイドバーの「Project Settings」（歯車アイコン）をクリック
2. 「API」をクリック
3. 以下をコピー：
   - **Project URL** (例: `https://xxxxx.supabase.co`)
   - **anon public** キー（長い文字列）

### ステップ4: 環境変数の設定

1. プロジェクトルートの`.env`ファイルを開く
2. 以下のように値を更新：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```

### ステップ5: 開発サーバーを再起動

```bash
# サーバーを停止（Ctrl + C）
# サーバーを再起動
npm run dev
```

### ステップ6: ブラウザで確認

1. ブラウザで http://localhost:5173 を開く
2. 「新規登録」をクリック
3. 以下を入力：
   - 名前: テスト太郎
   - ユーザーID: test_user
   - メールアドレス: test@example.com
   - パスワード: password123
   - パスワード確認: password123
4. 「登録」をクリック

## 🎉 動作確認

登録が成功すると、以下が表示されます：

1. **ホーム画面**
   - ヘッダーにLIVMEロゴ
   - 右上にプロフィールアイコンと設定アイコン
   - 「マイライブ」セクション
   - 「ライブ追加」ボタン

2. **ライブ追加**
   - 「ライブ追加」ボタンをクリック
   - タイトル: 「テストライブ」
   - 日付: 今日の日付を選択
   - 会場: 「渋谷クラブクアトロ」
   - 「追加」をクリック

3. **プロフィール表示**
   - 右上のプロフィールアイコンをクリック
   - プロフィールモーダルが表示される
   - 中央揃えで名前、ユーザーID、自己紹介が表示される
   - フォロワー・フォロー中の数が表示される

## 📱 画面のスクリーンショット

実際の画面は以下のようになります：

### ログイン画面
- シンプルなカードレイアウト
- IBM Plex Sans JPフォント
- 緑色のアクセントカラー

### ホーム画面
- モバイルファースト設計
- レスポンシブレイアウト
- 最大幅768px

### プロフィール画面
- 中央揃えのレイアウト
- 円形のアバター（120×120px）
- ProfileRing（グラデーションリング）
- SNSアイコン（Instagram/X/TikTok）
- 公演リスト（年月でグループ化）

### ライブカード
- 未来のライブ: 緑色の背景（bg-green-50）
- 過去のライブ: グレーの背景（bg-gray-50）
- 日付、時間、会場が表示
- 編集・削除ボタン（自分のライブのみ）

## 🐛 トラブルシューティング

### 問題1: 「VITE_SUPABASE_URL is not defined」エラー

**解決方法:**
- `.env`ファイルが存在するか確認
- 開発サーバーを再起動

### 問題2: 「User creation failed」エラー

**解決方法:**
- Supabase SQLが正しく実行されたか確認
- RLSポリシーが設定されているか確認

### 問題3: 画面が真っ白

**解決方法:**
- ブラウザのコンソールを開く（F12）
- エラーメッセージを確認
- 環境変数が正しく設定されているか確認

## 💡 次のステップ

1. プロフィール編集機能を試す
2. ライブを複数追加して、月別グループ化を確認
3. プロフィール共有URLを試す（`http://localhost:5173/?profile=test_user`）
4. フォロー機能を試す（複数アカウント作成）

## 🚀 本番環境へのデプロイ

準備ができたら、`docs/DEPLOYMENT.md`を参照してNetlifyにデプロイしてください。
