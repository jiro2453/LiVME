# 🚀 LIVME v1.0.0 本番環境デプロイガイド

## 📋 デプロイ前チェックリスト

### ✅ 必須確認項目
- [ ] **Supabase本番環境設定完了**
- [ ] **データベーススキーマ適用完了**
- [ ] **RLSポリシー設定完了**
- [ ] **認証設定完了**
- [ ] **環境変数設定完了**
- [ ] **ドメイン設定完了**
- [ ] **SSL証明書設定完了**

## 🔧 本番環境設定

### 1. Supabase設定

#### 環境変数
```bash
# 本番環境用
REACT_APP_SUPABASE_URL=https://fgvmbdxayjasmlwrylup.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[本番用匿名キー]

# セキュリティ設定
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG_MODE=false
```

#### 認証設定
```sql
-- メール確認有効化
UPDATE auth.config SET 
  email_confirm_required = true,
  sign_ups_enabled = true;

-- パスワードポリシー
UPDATE auth.config SET 
  password_min_length = 8,
  password_require_uppercase = true,
  password_require_lowercase = true,
  password_require_numbers = true;
```

### 2. データベース設定

#### 必須テーブル作成
```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ライブテーブル
CREATE TABLE lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 参加者テーブル
CREATE TABLE live_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_id, user_id)
);
```

#### パフォーマンス最適化インデックス
```sql
-- 検索用インデックス
CREATE INDEX idx_lives_artist ON lives USING gin(to_tsvector('english', artist));
CREATE INDEX idx_lives_venue ON lives USING gin(to_tsvector('english', venue));
CREATE INDEX idx_lives_date ON lives(date);
CREATE INDEX idx_live_attendees_user_id ON live_attendees(user_id);
CREATE INDEX idx_live_attendees_live_id ON live_attendees(live_id);
```

#### RLSポリシー
```sql
-- ユーザーテーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ライブテーブルのRLS
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lives" ON lives
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create lives" ON lives
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own lives" ON lives
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own lives" ON lives
  FOR DELETE USING (auth.uid() = created_by);

-- 参加者テーブルのRLS
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attendees" ON live_attendees
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join lives" ON live_attendees
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can remove own attendance" ON live_attendees
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. ビルド設定

#### package.json設定
```json
{
  "name": "livme",
  "version": "1.0.0",
  "scripts": {
    "build": "react-scripts build",
    "build:production": "REACT_APP_ENVIRONMENT=production npm run build",
    "deploy": "npm run build:production && npm run deploy:production"
  }
}
```

#### 最適化設定
```bash
# ビルド最適化
npm run build:production

# ファイルサイズ確認
npm run analyze

# 圧縮確認
gzip -9 -c build/static/js/*.js | wc -c
```

## 🌐 デプロイ手順

### オプション1: Vercel
```bash
# Vercelプロジェクト作成
vercel login
vercel init

# 環境変数設定
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_ANON_KEY

# デプロイ
vercel --prod
```

### オプション2: Netlify
```bash
# ビルド
npm run build:production

# Netlify CLI
netlify deploy --prod --dir=build

# 環境変数設定（Netlify UI）
# Site settings > Environment variables
```

### オプション3: 自サーバー
```bash
# ビルド
npm run build:production

# サーバーアップロード
rsync -avz build/ user@server:/var/www/livme/

# Nginx設定
server {
  listen 443 ssl;
  server_name livme.app;
  
  root /var/www/livme;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # SSL設定
  ssl_certificate /etc/ssl/certs/livme.crt;
  ssl_certificate_key /etc/ssl/private/livme.key;
}
```

## 📊 監視・分析設定

### 1. Supabase Analytics
```sql
-- ダッシュボード用ビュー
CREATE VIEW analytics_users AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d
FROM users;

CREATE VIEW analytics_lives AS
SELECT 
  COUNT(*) as total_lives,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_lives_24h,
  COUNT(*) FILTER (WHERE date > NOW()) as upcoming_lives
FROM lives;
```

### 2. エラー監視
```typescript
// エラー追跡設定
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
  // Sentryやその他の監視サービスに送信
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  // エラー監視サービスに送信
});
```

### 3. パフォーマンス監視
```typescript
// パフォーマンス測定
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart);
    }
  }
});
observer.observe({ entryTypes: ['navigation'] });
```

## 🔒 セキュリティ設定

### 1. CSP設定
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://unpkg.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
">
```

### 2. HTTPS強制
```nginx
# HTTP → HTTPS リダイレクト
server {
  listen 80;
  server_name livme.app;
  return 301 https://$server_name$request_uri;
}
```

### 3. セキュリティヘッダー
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy strict-origin-when-cross-origin;
```

## 📈 パフォーマンス最適化

### 1. CDN設定
```bash
# CloudFlare設定例
# - Auto Minification有効
# - Brotli圧縮有効
# - Browser Cache TTL: 4 hours
# - Edge Cache TTL: 2 days
```

### 2. キャッシュ戦略
```nginx
# 静的ファイルキャッシュ
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# HTMLファイル
location ~* \.html$ {
  expires 1h;
  add_header Cache-Control "public, must-revalidate";
}
```

## 🔧 ヘルスチェック

### 1. 基本ヘルスチェック
```bash
#!/bin/bash
# health-check.sh

# アプリケーション応答確認
response=$(curl -s -o /dev/null -w "%{http_code}" https://livme.app)
if [ $response -eq 200 ]; then
  echo "✅ App is healthy"
else
  echo "❌ App is unhealthy (HTTP $response)"
fi

# Supabase接続確認
db_response=$(curl -s -o /dev/null -w "%{http_code}" "https://fgvmbdxayjasmlwrylup.supabase.co/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY")
if [ $db_response -eq 200 ]; then
  echo "✅ Database is healthy"
else
  echo "❌ Database is unhealthy (HTTP $db_response)"
fi
```

### 2. 自動監視
```bash
# crontab設定
# 5分ごとにヘルスチェック実行
*/5 * * * * /path/to/health-check.sh >> /var/log/livme-health.log 2>&1
```

## 🎊 デプロイ完了チェック

### ✅ 最終確認項目
- [ ] **アプリケーション正常起動**
- [ ] **ユーザー登録機能動作**
- [ ] **ログイン機能動作**
- [ ] **ライブ作成機能動作**
- [ ] **検索機能動作**
- [ ] **プロフィール編集機能動作**
- [ ] **レスポンシブデザイン確認**
- [ ] **SSL証明書確認**
- [ ] **パフォーマンステスト完了**
- [ ] **セキュリティテスト完了**

## 🆘 トラブルシューティング

### よくある問題と解決方法

#### 1. 認証エラー
```bash
# Supabaseキー確認
curl -H "apikey: $SUPABASE_ANON_KEY" https://fgvmbdxayjasmlwrylup.supabase.co/rest/v1/users
```

#### 2. データベース接続エラー
```sql
-- 接続テスト
SELECT version();
SELECT current_user, current_database();
```

#### 3. パフォーマンス問題
```bash
# ネットワーク遅延確認
ping fgvmbdxayjasmlwrylup.supabase.co

# DNS解決確認
nslookup fgvmbdxayjasmlwrylup.supabase.co
```

---

## 🎉 デプロイ成功！

**LIVME v1.0.0が本番環境で正常に動作しています！**

### 🎵 次のステップ
1. **ユーザーフィードバック収集**
2. **パフォーマンス監視**
3. **機能改善計画**
4. **セキュリティ監査**

**素晴らしいライブ音楽体験をユーザーにお届けしましょう！** 🎤🎶