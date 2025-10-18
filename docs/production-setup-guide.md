# LIVME 本番環境セットアップガイド

## 🚀 本番環境への切り替え完了

現在のLIVMEアプリケーションは**既に本番環境用に設定済み**です！

### ✅ 現在の設定状況

#### 1. **Supabase接続設定** ✅ 完了
- **プロジェクトURL**: `https://fgvmbdxayjasmlwrylup.supabase.co`
- **Anon Key**: 設定済み
- **認証システム**: 完全実装済み

#### 2. **データベーススキーマ** ✅ 完了
以下のテーブルが設定済みです：
- `users` - ユーザー情報
- `lives` - ライブ情報
- `live_attendees` - 参加者管理

#### 3. **API実装** ✅ 完了
- **ユーザー管理**: 登録、ログイン、プロフィール更新
- **ライブ管理**: 作成、参加、削除、検索
- **認証フロー**: 完全実装

## 🎯 使用開始手順

### ステップ1: データベース設定の確認
```sql
-- Supabaseダッシュボードで以下のテーブルが存在することを確認
-- 1. users テーブル
-- 2. lives テーブル  
-- 3. live_attendees テーブル
```

### ステップ2: RLS（Row Level Security）ポリシーの確認
```sql
-- 以下のポリシーが設定されていることを確認
-- users テーブル: 全ユーザーアクセス許可
-- lives テーブル: 全ユーザーアクセス許可
-- live_attendees テーブル: 全ユーザーアクセス許可
```

### ステップ3: 認証設定の確認
Supabaseダッシュボードの「Authentication」タブで：
- ✅ **Email確認**: 有効化推奨
- ✅ **パスワードリセット**: 有効化済み
- ✅ **自動確認**: お好みで設定

## 🔧 高度な設定（オプション）

### ストレージ設定（画像アップロード用）
```sql
-- ライブ画像用バケット作成
INSERT INTO storage.buckets (id, name, public) VALUES 
('live-images', 'live-images', true);

-- ストレージポリシー設定
CREATE POLICY "Anyone can view live images" ON storage.objects FOR SELECT USING (bucket_id = 'live-images');
CREATE POLICY "Authenticated users can upload live images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'live-images' AND auth.role() = 'authenticated');
```

### メール設定
1. **カスタムドメイン**: `auth.yoursite.com`
2. **SMTP設定**: カスタムメールプロバイダー設定
3. **メールテンプレート**: カスタマイズ

## 📱 本番環境での動作確認

### 1. **ユーザー登録テスト**
```javascript
// 新規ユーザー登録
1. アプリにアクセス
2. 「新規登録」をクリック
3. メールアドレス・パスワード・名前を入力
4. 確認メールをチェック（必要に応じて）
5. ログイン完了
```

### 2. **ライブ管理テスト**
```javascript
// ライブ作成・参加
1. 「+」ボタンでライブ作成
2. アーティスト名・日程・会場を入力
3. 作成完了後、ライブリストに表示確認
4. 他のユーザーでライブ参加テスト
```

### 3. **検索機能テスト**
```javascript
// 検索機能
1. 検索バーにアーティスト名入力
2. リアルタイム検索結果表示確認
3. 会場名での検索も確認
```

## 🛡️ セキュリティ設定

### 本番環境推奨設定
```javascript
// Supabaseダッシュボード設定
1. API設定 > Rate limiting: 有効化
2. Auth設定 > Session timeout: 24時間
3. Database設定 > Connection pooling: 有効化
4. Security設定 > Domain restrictions: 本番ドメイン設定
```

### 環境変数設定（推奨）
```javascript
// .env.local ファイル作成
NEXT_PUBLIC_SUPABASE_URL=https://fgvmbdxayjasmlwrylup.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 パフォーマンス最適化

### 1. **インデックス作成**
```sql
-- 検索パフォーマンス向上
CREATE INDEX idx_lives_artist ON lives(artist);
CREATE INDEX idx_lives_venue ON lives(venue);
CREATE INDEX idx_lives_date ON lives(date);
CREATE INDEX idx_live_attendees_user_id ON live_attendees(user_id);
```

### 2. **キャッシュ設定**
```javascript
// ブラウザキャッシュ最適化
// - 静的アセット: 1年間キャッシュ
// - API レスポンス: 適切なキャッシュヘッダー設定
```

## 📊 監視・分析

### Supabaseダッシュボード監視項目
1. **Database**: 接続数、クエリパフォーマンス
2. **Auth**: 登録・ログイン数
3. **Storage**: 使用量（画像アップロード時）
4. **Edge Functions**: レスポンス時間（必要に応じて）

### 推奨監視ツール
- **Supabase Analytics**: 標準搭載
- **Google Analytics**: ユーザー行動分析
- **Sentry**: エラー監視（オプション）

## 🎉 本番環境完了チェックリスト

- [x] **Supabase接続**: 設定完了
- [x] **認証システム**: 実装完了
- [x] **データベース**: スキーマ設定完了
- [x] **API機能**: 全機能実装完了
- [x] **UI/UX**: モバイル対応完了
- [x] **エラーハンドリング**: 実装完了
- [ ] **独自ドメイン**: 設定（オプション）
- [ ] **SSL証明書**: 設定（オプション）
- [ ] **カスタムメール**: 設定（オプション）

## 🆘 トラブルシューティング

### よくある問題と解決方法

#### 1. **認証エラー**
```
問題: ログインできない
解決: 1. メール確認チェック
     2. RLSポリシー確認
     3. Supabaseダッシュボードでユーザー状態確認
```

#### 2. **データベース接続エラー**
```
問題: データが表示されない
解決: 1. ネットワーク接続確認
     2. Supabaseサービス状態確認
     3. API キー確認
```

#### 3. **パフォーマンス問題**
```
問題: 動作が遅い
解決: 1. インデックス追加
     2. クエリ最適化
     3. 画像サイズ最適化
```

---

## 🎊 完了！

**LIVMEアプリケーションは本番環境で動作準備完了です！**

ユーザーは以下の機能を完全に利用できます：
- ✅ ユーザー登録・ログイン
- ✅ ライブ情報の作成・管理
- ✅ ライブ参加・退会
- ✅ アーティスト・会場検索
- ✅ プロフィール管理
- ✅ ソーシャルリンク設定

**素晴らしいライブ音楽体験をお楽しみください！** 🎵