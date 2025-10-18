import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Database, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ProfileCreationErrorProps {
  error: string;
  onRetry: () => void;
  onOpenDatabaseSettings: () => void;
  isRetrying?: boolean;
}

export function ProfileCreationError({ 
  error, 
  onRetry, 
  onOpenDatabaseSettings, 
  isRetrying = false 
}: ProfileCreationErrorProps) {
  const isSetupError = error.includes('セットアップ') || error.includes('テーブル') || error.includes('procedure');
  const isRLSError = error.includes('RLS') || error.includes('ポリシー');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              プロフィール作成エラー
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
              {error}
            </p>
            
            {isSetupError || isRLSError ? (
              <div className="space-y-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <div className="font-medium mb-2">
                      {isSetupError ? '📊 データベースセットアップが必要です' : '🛡️ RLSポリシーの修正が必要です'}
                    </div>
                    <div className="space-y-1">
                      {isSetupError ? (
                        <>
                          <div>• usersテーブルが作成されていません</div>
                          <div>• 認証設定が無効になっています</div>
                          <div>• 必要な関数が存在しません</div>
                        </>
                      ) : (
                        <>
                          <div>• Row Level Security ポリシーが正しく設定されていません</div>
                          <div>• プロフィール作成権限がありません</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={onOpenDatabaseSettings}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    データベース設定
                  </Button>
                  <Button
                    onClick={() => window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup', '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Supabase開く
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <div className="font-medium mb-1">🔧 現在の状況</div>
                    <div>モックプロフィールでアプリを使用できます。データベース接続が復旧したら、再度プロフィール作成を試行してください。</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    disabled={isRetrying}
                    className="flex-1"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        再試行中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        再試行
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onOpenDatabaseSettings}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    設定確認
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}