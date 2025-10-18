import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Play, 
  Shield, 
  Settings, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';

interface DatabaseSetupGuideProps {
  onClose: () => void;
}

export function DatabaseSetupGuide({ onClose }: DatabaseSetupGuideProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [copiedSql, setCopiedSql] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const completeSetupSQL = `-- ============================================
-- LIVME Complete Database Setup with Fixed RLS
-- このSQLを全選択してコピー & ペーストしてください
-- ============================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create lives table  
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  venue VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create live_attendees table
CREATE TABLE IF NOT EXISTS live_attendees (
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (live_id, user_id)
);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendees ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- 7. Create FIXED RLS policies for users
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id 
        OR auth.uid() IS NOT NULL 
        OR current_setting('role') = 'service_role'
        OR current_user = 'service_role'
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- 8. RLS policies for lives
DROP POLICY IF EXISTS "Anyone can view lives" ON lives;
DROP POLICY IF EXISTS "Authenticated users can create lives" ON lives;
DROP POLICY IF EXISTS "Users can update own lives" ON lives;
DROP POLICY IF EXISTS "Users can delete own lives" ON lives;

CREATE POLICY "Anyone can view lives" ON lives FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create lives" ON lives FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own lives" ON lives FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own lives" ON lives FOR DELETE USING (auth.uid() = created_by);

-- 9. RLS policies for live_attendees
DROP POLICY IF EXISTS "Anyone can view live attendees" ON live_attendees;
DROP POLICY IF EXISTS "Users can join lives" ON live_attendees;
DROP POLICY IF EXISTS "Users can leave lives" ON live_attendees;

CREATE POLICY "Anyone can view live attendees" ON live_attendees FOR SELECT USING (true);
CREATE POLICY "Users can join lives" ON live_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave lives" ON live_attendees FOR DELETE USING (auth.uid() = user_id);

-- 10. Create auto-profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  PERFORM set_config('role', 'service_role', true);
  
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'ユーザー'),
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create manual profile creation function (fallback)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_name TEXT DEFAULT NULL,
  user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_name TEXT;
BEGIN
  profile_name := COALESCE(user_name, split_part(user_email, '@', 1), 'ユーザー');
  
  INSERT INTO public.users (id, name, avatar, bio, social_links)
  VALUES (
    user_id,
    profile_name,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile manually for %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_lives_date ON lives(date);
CREATE INDEX IF NOT EXISTS idx_lives_artist ON lives(artist);
CREATE INDEX IF NOT EXISTS idx_lives_venue ON lives(venue);
CREATE INDEX IF NOT EXISTS idx_lives_created_by ON lives(created_by);
CREATE INDEX IF NOT EXISTS idx_live_attendees_live_id ON live_attendees(live_id);
CREATE INDEX IF NOT EXISTS idx_live_attendees_user_id ON live_attendees(user_id);

-- 完了メッセージ
SELECT 'LIVME database setup completed successfully! 🎉' as message;`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      toast.success('SQLをクリップボードにコピーしました！');
      setTimeout(() => setCopiedSql(false), 2000);
    } catch (error) {
      toast.error('コピーに失敗しました');
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  const markStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
  };

  const steps = [
    {
      number: 1,
      title: "Supabaseプロジェクトを開く",
      icon: <ExternalLink className="w-5 h-5" />,
      description: "Supabaseダッシュボードでプロジェクトにアクセスします",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              📌 重要：プロジェクトURL
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p>LIVMEプロジェクト: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">fgvmbdxayjasmlwrylup</code></p>
              <p>以下のリンクから直接アクセスできます：</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup', '_blank');
              markStepComplete(1);
            }}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Supabaseプロジェクトを開く
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>💡 ヒント: リンクをクリックすると新しいタブでSupabaseダッシュボードが開きます</p>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: "認証設定を有効化（最重要！）",
      icon: <Shield className="w-5 h-5" />,
      description: "メール認証を有効にしないとアプリが動作しません",
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
              ⚠️ 必須設定（これがないとログインできません）
            </h4>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <p>左サイドバー「Authentication」→「Settings」で以下を設定：</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>✅ 「Enable email signups」をONにする</li>
                <li>✅ 「Enable email logins」をONにする</li>
                <li>✅ 「Confirm email」はOFFでも構いません（開発時）</li>
              </ul>
            </div>
          </div>
          
          <Button
            onClick={() => {
              window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/auth/settings', '_blank');
              markStepComplete(2);
            }}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            認証設定を開く（重要！）
          </Button>
        </div>
      )
    },
    {
      number: 3,
      title: "SQL Editorを開く",
      icon: <Database className="w-5 h-5" />,
      description: "データベースのテーブルとポリシーを作成します",
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2">手順：</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>左サイドバーで「SQL Editor」をクリック</li>
              <li>「New query」ボタンをクリック</li>
              <li>空のクエリエディターが表示されます</li>
            </ol>
          </div>
          
          <Button
            onClick={() => {
              window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new', '_blank');
              markStepComplete(3);
            }}
            className="w-full"
            size="lg"
          >
            <Database className="w-4 h-4 mr-2" />
            SQL Editorを開く
          </Button>
        </div>
      )
    },
    {
      number: 4,
      title: "セットアップSQLをコピー",
      icon: <Copy className="w-5 h-5" />,
      description: "完全なデータベースセットアップSQLをコピーします",
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              📝 セットアップSQL
            </h4>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p>以下のボタンをクリックして、完全なセットアップSQLをコピーしてください。</p>
              <p>このSQLには以下が含まれています：</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>テーブル作成（users, lives, live_attendees）</li>
                <li>Row Level Security ポリシー</li>
                <li>自動プロフィール作成トリガー</li>
                <li>インデックス作成</li>
              </ul>
            </div>
          </div>
          
          <Button
            onClick={() => {
              copyToClipboard(completeSetupSQL);
              markStepComplete(4);
            }}
            className="w-full"
            size="lg"
            variant={copiedSql ? "outline" : "default"}
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                コピー完了！
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                セットアップSQLをコピー
              </>
            )}
          </Button>
          
          {copiedSql && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 dark:text-green-400 text-center"
            >
              ✅ SQLがクリップボードにコピーされました！次のステップに進んでください
            </motion.div>
          )}
        </div>
      )
    },
    {
      number: 5,
      title: "SQLを実行",
      icon: <Play className="w-5 h-5" />,
      description: "コピーしたSQLをSupabaseで実行します",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🎯 実行手順
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li><strong>SQL Editorに戻る</strong> - 手順3で開いたタブに戻ります</li>
              <li><strong>SQLを貼り付け</strong> - エディターにコピーしたSQLを貼り付けます（Ctrl+V または Cmd+V）</li>
              <li><strong>実行ボタンをクリック</strong> - 右下の「Run」ボタンまたは Ctrl+Enter</li>
              <li><strong>完了を確認</strong> - 「LIVME database setup completed successfully! 🎉」が表示されれば成功</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ よくあるエラーと対処法
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p><strong>「permission denied」エラー:</strong> プロジェクト管理者権限が必要です</p>
              <p><strong>「relation already exists」エラー:</strong> 既にテーブルが存在する場合は無視して構いません</p>
              <p><strong>タイムアウトエラー:</strong> SQLを小さく分けて実行してください</p>
            </div>
          </div>
          
          <Button
            onClick={() => markStepComplete(5)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            SQL実行完了をマーク
          </Button>
        </div>
      )
    },
    {
      number: 6,
      title: "接続確認",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "LIVMEアプリに戻って接続を確認します",
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              🎉 最終確認
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
              <li>このダイアログを閉じる</li>
              <li>LIVMEアプリの左上のデータベースアイコンをクリック</li>
              <li>「再確認」ボタンをクリック</li>
              <li>緑色の接続成功メッセージが表示されれば完了！</li>
            </ol>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🔧 まだエラーが出る場合
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• 手順2の認証設定が正しくされているか確認</p>
              <p>• ブラウザを更新してみる</p>
              <p>• 数分待ってから再試行（設定反映に時間がかかる場合があります）</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              markStepComplete(6);
              onClose();
            }}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            セットアップ完了！
          </Button>
        </div>
      )
    }
  ];

  const completedCount = completedSteps.size;
  const totalSteps = steps.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-medium">データベースセットアップガイド</h2>
                <p className="text-sm text-muted-foreground">
                  進行状況: {completedCount}/{totalSteps} ステップ完了
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalSteps) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="border border-border rounded-lg">
                <motion.button
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/50 rounded-lg"
                  onClick={() => toggleStep(step.number)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${completedSteps.has(step.number) 
                        ? 'bg-green-500 text-white' 
                        : expandedStep === step.number 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {completedSteps.has(step.number) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {step.icon}
                      <div>
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedStep === step.number ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {expandedStep === step.number && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-border">
                        {step.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                💡 ヒント: 各ステップを順番に進めてください
              </div>
              <Button onClick={onClose} variant="outline">
                閉じる
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}