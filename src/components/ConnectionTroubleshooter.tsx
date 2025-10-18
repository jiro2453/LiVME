import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, XCircle, Globe, Smartphone, Router, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { checkSupabaseHealth, testSupabaseConnection } from '../lib/supabase';

interface ConnectionTroubleshooterProps {
  onClose: () => void;
  currentStatus: 'healthy' | 'unhealthy' | 'checking';
}

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  duration?: number;
}

export function ConnectionTroubleshooter({ onClose, currentStatus }: ConnectionTroubleshooterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  const diagnosticTests = [
    {
      name: 'インターネット接続',
      test: 'internet',
      description: '基本的なインターネット接続を確認'
    },
    {
      name: 'DNS解決',
      test: 'dns',
      description: 'Supabaseドメインの名前解決を確認'
    },
    {
      name: 'Supabase到達性',
      test: 'supabase_reach',
      description: 'Supabaseサーバーへの到達性を確認'
    },
    {
      name: 'API応答',
      test: 'api_response',
      description: 'Supabase APIの応答を確認'
    },
    {
      name: '認証サービス',
      test: 'auth_service',
      description: '認証サービスの動作を確認'
    }
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const totalTests = diagnosticTests.length;
    
    for (let i = 0; i < totalTests; i++) {
      const test = diagnosticTests[i];
      setCurrentTest(test.name);
      setProgress(((i + 1) / totalTests) * 100);

      const startTime = Date.now();
      let result: DiagnosticResult;

      try {
        switch (test.test) {
          case 'internet':
            result = await testInternetConnection();
            break;
          case 'dns':
            result = await testDNSResolution();
            break;
          case 'supabase_reach':
            result = await testSupabaseReachability();
            break;
          case 'api_response':
            result = await testAPIResponse();
            break;
          case 'auth_service':
            result = await testAuthService();
            break;
          default:
            result = {
              test: test.name,
              status: 'error',
              message: 'テストが定義されていません'
            };
        }
      } catch (error: any) {
        result = {
          test: test.name,
          status: 'error',
          message: `テスト実行エラー: ${error.message}`
        };
      }

      result.duration = Date.now() - startTime;
      setResults(prev => [...prev, result]);

      // 各テスト間で少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const testInternetConnection = async (): Promise<DiagnosticResult> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors'
      });

      clearTimeout(timeoutId);
      
      return {
        test: 'インターネット接続',
        status: 'success',
        message: 'インターネット接続は正常です'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          test: 'インターネット接続',
          status: 'warning',
          message: 'インターネット接続が遅い可能性があります'
        };
      }
      
      return {
        test: 'インターネット接続',
        status: 'error',
        message: 'インターネット接続に問題があります'
      };
    }
  };

  const testDNSResolution = async (): Promise<DiagnosticResult> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://fgvmbdxayjasmlwrylup.supabase.co', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      return {
        test: 'DNS解決',
        status: 'success',
        message: 'Supabaseドメインの名前解決は正常です'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          test: 'DNS解決',
          status: 'warning',
          message: 'DNS解決が遅い可能性があります'
        };
      }
      
      return {
        test: 'DNS解決',
        status: 'error',
        message: 'Supabaseドメインの名前解決に失敗しました'
      };
    }
  };

  const testSupabaseReachability = async (): Promise<DiagnosticResult> => {
    try {
      const { healthy } = await checkSupabaseHealth();
      
      if (healthy) {
        return {
          test: 'Supabase到達性',
          status: 'success',
          message: 'Supabaseサーバーに正常に到達できます'
        };
      } else {
        return {
          test: 'Supabase到達性',
          status: 'error',
          message: 'Supabaseサーバーに到達できません'
        };
      }
    } catch (error: any) {
      return {
        test: 'Supabase到達性',
        status: 'error',
        message: `到達性テストエラー: ${error.message}`
      };
    }
  };

  const testAPIResponse = async (): Promise<DiagnosticResult> => {
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        return {
          test: 'API応答',
          status: 'success',
          message: 'Supabase APIは正常に応答しています'
        };
      } else {
        return {
          test: 'API応答',
          status: 'warning',
          message: 'Supabase APIの応答が不安定です'
        };
      }
    } catch (error: any) {
      return {
        test: 'API応答',
        status: 'error',
        message: `API応答テストエラー: ${error.message}`
      };
    }
  };

  const testAuthService = async (): Promise<DiagnosticResult> => {
    try {
      // 認証サービスの軽量テスト
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://fgvmbdxayjasmlwrylup.supabase.co/auth/v1/settings', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndm1iZHhheWphc21sd3J5bHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MzgxMDUsImV4cCI6MjA2NzAxNDEwNX0.Kt5lRop18PoDqItBGCcMv2XQZ9vEgfhE08EAtCdyeKE'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          test: '認証サービス',
          status: 'success',
          message: '認証サービスは正常に動作しています'
        };
      } else {
        return {
          test: '認証サービス',
          status: 'warning',
          message: '認証サービスに一部問題がある可能性があります'
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          test: '認証サービス',
          status: 'warning',
          message: '認証サービスの応答が遅い可能性があります'
        };
      }

      return {
        test: '認証サービス',
        status: 'error',
        message: `認証サービステストエラー: ${error.message}`
      };
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    }
  };

  const getSolutions = () => {
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');

    if (!hasErrors && !hasWarnings) {
      return (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">すべて正常です</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            すべての接続テストが正常に完了しました。アプリケーションは問題なく動作するはずです。
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-medium">推奨対処法:</h4>
        
        {hasErrors && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-800 dark:text-red-200 space-y-2">
              <p className="font-medium">接続エラーが検出されました:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>インターネット接続を確認してください</li>
                <li>Wi-Fiまたはモバイルデータの信号強度を確認してください</li>
                <li>ファイアウォールやプロキシ設定を確認してください</li>
                <li>しばらく時間をおいてから再試行してください</li>
              </ul>
            </div>
          </div>
        )}

        {hasWarnings && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
              <p className="font-medium">接続が不安定です:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>ネットワーク環境を改善してください</li>
                <li>ローカルモードで利用を継続できます</li>
                <li>オンライン時に自動同期されます</li>
              </ul>
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p className="font-medium">ローカルモード:</p>
            <p>
              接続に問題がある場合でも、LIVMEはローカルモードで完全に動作します。
              オンライン時に自動的にデータが同期されます。
            </p>
          </div>
        </div>
      </div>
    );
  };

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
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                {currentStatus === 'healthy' ? (
                  <Wifi className="w-5 h-5 text-blue-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-medium">接続診断ツール</h2>
                <p className="text-sm text-muted-foreground">
                  ネットワーク接続とSupabaseサービスの状態を確認します
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">現在の接続状態</span>
              <Badge variant={currentStatus === 'healthy' ? 'default' : 'outline'}>
                {currentStatus === 'healthy' ? 'オンライン' : 
                 currentStatus === 'unhealthy' ? 'ローカルモード' : '確認中'}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">診断実行中: {currentTest}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="font-medium">診断結果</h3>
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                  {result.duration && (
                    <div className="text-xs text-muted-foreground">
                      {result.duration}ms
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Solutions */}
          {results.length > 0 && !isRunning && (
            <div className="mb-6">
              {getSolutions()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              閉じる
            </Button>
            
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              {isRunning ? '診断中...' : '診断開始'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}