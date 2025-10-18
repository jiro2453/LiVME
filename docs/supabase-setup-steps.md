# Supabase セットアップ完了ガイド

## 手順1: データベーステーブル作成

Supabaseの管理画面で以下のSQLを実行してください：

### 1. SQL Editorでテーブル作成

Supabase Dashboard → SQL Editor → New queryで以下のSQLを実行：

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

-- 全ユーザーアクセス許可ポリシー（開発用）
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on lives" ON lives FOR ALL USING (true);
CREATE POLICY "Allow all operations on live_attendees" ON live_attendees FOR ALL USING (true);
```

### 2. サンプルデータ挿入

続けて以下のSQLも実行：

```sql
-- サンプルユーザー挿入
INSERT INTO users (id, name, avatar, bio, social_links) VALUES
('00000000-0000-0000-0000-000000000001', 'NAME', 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=150&h=150&fit=crop', '音楽が大好きです！特にロックとポップス', '{"twitter": "@taro_music", "instagram": "@taro_yamada", "tiktok": "@taro_tiktok"}'),
('00000000-0000-0000-0000-000000000002', 'Hanako Sato', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop', 'ライブ巡りが趣味です', '{"instagram": "@hanako_live", "tiktok": "@hanako_music"}'),
('00000000-0000-0000-0000-000000000003', 'Kenji Tanaka', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop', 'フェス好き', '{"twitter": "@kenji_fes"}'),
('00000000-0000-0000-0000-000000000004', 'Yuki Suzuki', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=150&h=150&fit=crop', 'バンド系が好き', '{"twitter": "@yuki_band"}'),
('00000000-0000-0000-0000-000000000005', 'Ryo Takahashi', 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=150&h=150&fit=crop', 'フェス参戦記録中', '{"instagram": "@ryo_fes"}');

-- サンプル公演挿入
INSERT INTO lives (id, artist, date, venue, created_by) VALUES
('10000000-0000-0000-0000-000000000001', 'あいみょん', '2024-08-06', '武道館', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002', 'YOASOBI', '2024-08-10', '武道館', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000003', 'King Gnu', '2024-08-15', '東京ドーム', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000004', 'Official髭男dism', '2024-06-14', 'さいたまスーパーアリーナ', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000005', 'Perfume', '2024-05-20', '大阪城ホール', '00000000-0000-0000-0000-000000000002');

-- サンプル参加者挿入
INSERT INTO live_attendees (live_id, user_id) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005');
```

## 手順2: API設定取得

1. Supabase Dashboard → Settings → API
2. 以下の情報をコピー：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (長いキー)

## 手順3: コード内の設定更新

取得した情報で以下のファイルの設定を更新してください。

## 接続テスト

設定完了後：
1. アプリを再読み込み
2. ヘッダーのデータベースアイコン（🗄️）をクリック
3. 接続テストを実行
4. 「接続成功」が表示されれば完了！

## トラブルシューティング

### よくあるエラー

1. **"Failed to fetch"エラー**
   - URL/APIキーが正しいか確認
   - ブラウザの開発者ツールでネットワークエラーを確認

2. **"Invalid API key"エラー**
   - anon keyが正しくコピーされているか確認
   - キーの前後に余分な空白がないか確認

3. **"Table doesn't exist"エラー**
   - SQLが正常に実行されたか確認
   - テーブル名のスペルミスがないか確認

### 確認方法

Supabase Dashboard → Table Editor で以下のテーブルが表示されているか確認：
- ✅ users
- ✅ lives  
- ✅ live_attendees

データが正しく挿入されているか確認：
- users テーブル: 5件のユーザー
- lives テーブル: 5件の公演
- live_attendees テーブル: 12件の参加記録