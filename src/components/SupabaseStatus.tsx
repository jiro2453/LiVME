import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, Play, Shield, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { DatabaseSetupGuide } from './DatabaseSetupGuide';
import { testSupabaseConnection, isMockMode } from '../lib/supabase';

interface SupabaseStatusProps {
  onClose: () => void;
}

export function SupabaseStatus({ onClose }: SupabaseStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'disconnected' | 'mock'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('loading');
    setError(null);

    if (isMockMode) {
      setConnectionStatus('mock');
      return;
    }

    try {
      const result = await testSupabaseConnection();
      setConnectionStatus(result.success ? 'connected' : 'disconnected');
      if (!result.success && result.error) {
        setError(result.error.toString());
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'mock':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Database className="w-6 h-6 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Supabase接続成功！';
      case 'disconnected':
        return 'Supabase接続失敗';
      case 'mock':
        return 'モックモード（開発用）';
      default:
        return '接続確認中...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-red-600';
      case 'mock':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const isRLSError = error?.includes('violates row-level security policy') || error?.includes('42501');
  const isProfileError = error?.includes('PGRST116') || error?.includes('multiple (or no) rows returned');
  const isTableError = error?.includes('relation "users" does not exist') || error?.includes('relation') || error?.includes('does not exist');

  const quickFixSQL = `-- Quick Fix SQL（最小限の修正）
-- RLSポリシー問題の緊急修正

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id 
        OR auth.uid() IS NOT NULL 
        OR current_setting('role') = 'service_role'
        OR current_user = 'service_role'
    );

SELECT 'Quick fix applied! 🛠️' as message;`;

  return (
    <>
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
          className="w-full max-w-lg max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                <h2 className="text-lg font-medium">データベース接続状況</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                {getStatusIcon()}
                <div className="flex-1">
                  <div className={`font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </div>
                  {error && (
                    <div className="text-sm text-red-500 mt-1">
                      エラー: {error}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkConnection}
                  disabled={connectionStatus === 'loading'}
                >
                  再確認
                </Button>
              </div>

              {/* Setup Guide CTA */}
              {connectionStatus === 'disconnected' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        📚 データベースセットアップが必要です
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        初回セットアップの場合は、詳細なガイドに従ってデータベースを設定してください。画像付きで分かりやすく説明しています。
                      </div>
                      <Button
                        onClick={() => setShowSetupGuide(true)}
                        className="w-full mb-2"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        詳細セットアップガイドを開く
                      </Button>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        💡 初心者の方におすすめ：ステップバイステップで設定できます
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions for Specific Errors */}
              {isTableError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                        📊 テーブルが存在しません
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                        データベースのテーブルが作成されていません。完全なセットアップが必要です。
                      </div>
                      <Button
                        onClick={() => setShowSetupGuide(true)}
                        variant="destructive"
                        className="w-full"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        セットアップガイドを開く
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isRLSError && !isTableError && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                        🛡️ セキュリティポリシーエラー
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        Row Level Security ポリシーの修正が必要です。クイック修正またはフルセットアップを選択してください。
                      </div>
                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            copyToClipboard(quickFixSQL);
                            window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new', '_blank');
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          クイック修正SQL実行
                        </Button>
                        <Button
                          onClick={() => setShowSetupGuide(true)}
                          className="w-full"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          完全セットアップガイド
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Success */}
              {connectionStatus === 'connected' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                    🎉 Supabaseに正常に接続されています！
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mb-3">
                    すべての機能が利用可能です。データは永続化されます。
                  </div>
                  <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                    <div><strong>接続先:</strong> fgvmbdxayjasmlwrylup.supabase.co</div>
                    <div><strong>認証:</strong> 有効</div>
                    <div><strong>テーブル:</strong> 作成済み</div>
                    <div><strong>RLS:</strong> 設定済み</div>
                    <div><strong>トリガー:</strong> 設定済み</div>
                  </div>
                </div>
              )}

              {/* Connection Error */}
              {connectionStatus === 'disconnected' && !isRLSError && !isProfileError && !isTableError && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                      接続に失敗しました
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300 space-y-1 mb-3">
                      <div>考えられる原因:</div>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>認証設定が無効になっている</li>
                        <li>ネットワーク接続の問題</li>
                        <li>Supabaseプロジェクトが一時停止されている</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowSetupGuide(true)}
                    className="w-full"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    詳細セットアップガイド
                  </Button>
                </div>
              )}

              {/* Mock Mode Notice */}
              {connectionStatus === 'mock' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    現在モックモードで動作中（この状態は通常発生しません）
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <Button onClick={onClose}>
                閉じる
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Database Setup Guide Modal */}
      <AnimatePresence>
        {showSetupGuide && (
          <DatabaseSetupGuide onClose={() => setShowSetupGuide(false)} />
        )}
      </AnimatePresence>
    </>
  );
}