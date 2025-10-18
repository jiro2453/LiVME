# LIVMEアプリ - サーバー統合ガイド

## 現在の状況
- Figma Make環境では自分のサーバーを起動できない
- 外部APIサービスを利用することで実際のデータベースと連携可能
- モックAPIから実際のAPIへの切り替えが簡単

## 推奨オプション

### 1. Supabase（最も簡単・推奨）

#### セットアップ手順
1. [Supabase](https://supabase.com)でアカウント作成
2. 新しいプロジェクト作成
3. データベーステーブル作成（SQL Editor使用）:

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公演テーブル
CREATE TABLE lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公演参加者テーブル
CREATE TABLE live_attendees (
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (live_id, user_id)
);

-- Row Level Security (RLS) 設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（全てのユーザーが読み書き可能）
CREATE POLICY "Public users" ON users FOR ALL USING (true);
CREATE POLICY "Public lives" ON lives FOR ALL USING (true);
CREATE POLICY "Public live_attendees" ON live_attendees FOR ALL USING (true);
```

4. サンプルデータ挿入:

```sql
-- サンプルユーザー挿入
INSERT INTO users (id, name, avatar, bio, social_links) VALUES
('00000000-0000-0000-0000-000000000001', 'NAME', 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=150&h=150&fit=crop', '音楽が大好きです！', '{"twitter": "@taro_music", "instagram": "@taro_yamada"}'),
('00000000-0000-0000-0000-000000000002', 'Hanako Sato', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop', 'ライブ巡りが趣味です', '{"instagram": "@hanako_live"}'),
('00000000-0000-0000-0000-000000000003', 'Kenji Tanaka', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop', 'フェス好き', '{"twitter": "@kenji_fes"}');

-- サンプル公演挿入
INSERT INTO lives (id, artist, date, venue, created_by) VALUES
('10000000-0000-0000-0000-000000000001', 'あいみょん', '2024-08-06', '武道館', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002', 'YOASOBI', '2024-08-10', '武道館', '00000000-0000-0000-0000-000000000002');

-- サンプル参加者挿入
INSERT INTO live_attendees (live_id, user_id) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
```

5. プロジェクトの設定から「API」タブでURL・KEYを取得
6. `/lib/supabase.ts`のURL・KEYを更新
7. `/lib/api.ts`の`USE_SUPABASE`を`true`に変更

#### 費用
- 無料プランあり（500MB DB、50MB ファイルストレージ）
- 有料プラン: $25/月〜

### 2. Firebase/Firestore

#### セットアップ手順
1. [Firebase Console](https://console.firebase.google.com)でプロジェクト作成
2. Firestore Database作成
3. Authentication設定（オプション）
4. Web SDKを追加
5. 設定情報をアプリに追加

#### 費用
- 無料プランあり（1GB ストレージ、50,000 読み取り/日）
- 従量課金制

### 3. PlanetScale (MySQL)

#### セットアップ手順
1. [PlanetScale](https://planetscale.com)でアカウント作成
2. データベース作成
3. 接続文字列取得
4. Prisma ORM設定

#### 費用
- 無料プランあり（1GB ストレージ）
- 有料プラン: $29/月〜

### 4. Railway (PostgreSQL)

#### セットアップ手順
1. [Railway](https://railway.app)でアカウント作成
2. PostgreSQL データベース作成
3. 接続文字列取得
4. Prisma ORM設定

#### 費用
- 無料プランあり（1GB RAM、1GB ストレージ）
- 従量課金制

## 認証の追加

### Supabase Auth
```javascript
// ログイン
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// サインアップ
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// ログアウト
const { error } = await supabase.auth.signOut();
```

### Firebase Auth
```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// ログイン
await signInWithEmailAndPassword(auth, email, password);

// サインアップ
await createUserWithEmailAndPassword(auth, email, password);

// ログアウト
await signOut(auth);
```

## デプロイオプション

### Vercel（推奨）
1. GitHubにコードをプッシュ
2. Vercelアカウントでリポジトリを連携
3. 環境変数を設定
4. デプロイ

### Netlify
1. GitHubにコードをプッシュ
2. Netlifyアカウントでリポジトリを連携
3. ビルド設定: `npm run build`
4. 公開ディレクトリ: `dist`

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 本番環境への移行チェックリスト

- [ ] Supabaseプロジェクト作成・設定
- [ ] データベーステーブル作成
- [ ] サンプルデータ挿入
- [ ] API接続テスト
- [ ] 認証機能追加
- [ ] 環境変数設定
- [ ] エラーハンドリング確認
- [ ] パフォーマンス最適化
- [ ] セキュリティ設定（RLS）
- [ ] バックアップ設定
- [ ] モニタリング設定

## トラブルシューティング

### CORS エラー
- Supabaseの場合は通常自動で設定済み
- 他のAPIの場合はCORS設定が必要

### 認証エラー
- API Key、URLが正しいか確認
- 権限設定（RLS）を確認

### パフォーマンス問題
- インデックス作成
- クエリ最適化
- キャッシュ実装

## サポートが必要な場合
1. Supabase Discord
2. Firebase コミュニティ
3. GitHub Issues
4. Stack Overflow