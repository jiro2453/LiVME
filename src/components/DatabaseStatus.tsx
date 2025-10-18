import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Users, Music, Shield, User, Eye, Wifi, Bug } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionTroubleshooter } from './ConnectionTroubleshooter';

interface DatabaseStatusProps {
  onClose: () => void;
}

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

interface PolicyInfo {
  tableName: string;
  policyName: string;
  operation: string;
}

interface ProfileTestResult {
  success: boolean;
  action: string;
  message: string;
}

export function DatabaseStatus({ onClose }: DatabaseStatusProps) {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [policies, setPolicies] = useState<PolicyInfo[]>([]);
  const [authStatus, setAuthStatus] = useState<{enabled: boolean, error?: string}>({enabled: false});
  const [overallStatus, setOverallStatus] = useState<'success' | 'warning' | 'error'>('error');
  const [profileTests, setProfileTests] = useState<ProfileTestResult[]>([]);
  const [testingProfile, setTestingProfile] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  
  const { user, connectionStatus } = useAuth();

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    
    try {
      // Check tables and row counts with shorter timeout
      const tableResults = await Promise.all([
        checkTable('users'),
        checkTable('lives'),
        checkTable('live_attendees')
      ]);
      setTables(tableResults);

      // Check RLS policies
      const policiesResult = await checkPolicies();
      setPolicies(policiesResult);

      // Check auth status
      const authResult = await checkAuthStatus();
      setAuthStatus(authResult);

      // Determine overall status
      const hasErrors = tableResults.some(t => !t.exists) || !authResult.enabled;
      const hasWarnings = tableResults.some(t => t.exists && t.rowCount === 0);
      
      if (hasErrors) {
        setOverallStatus('error');
      } else if (hasWarnings) {
        setOverallStatus('warning');
      } else {
        setOverallStatus('success');
      }

    } catch (error) {
      console.error('Database status check failed:', error);
      setOverallStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const testProfileOperations = async () => {
    if (!user) {
      setProfileTests([{
        success: false,
        action: 'ユーザー認証',
        message: 'ログインが必要です'
      }]);
      return;
    }

    setTestingProfile(true);
    const tests: ProfileTestResult[] = [];

    try {
      // Test 1: プロフィール読み取り（短いタイムアウト）
      console.log('🧪 Testing profile read...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒に短縮

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          tests.push({
            success: false,
            action: 'プロフィール読み取り',
            message: `エラー: ${error.message}`
          });
        } else if (!data) {
          tests.push({
            success: false,
            action: 'プロフィール読み取り',
            message: 'プロフィールがデータベースに存在しません'
          });
        } else {
          tests.push({
            success: true,
            action: 'プロフィール読み取り',
            message: '正常に読み取れました'
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          tests.push({
            success: false,
            action: 'プロフィール読み取り',
            message: 'タイムアウト: 接続が遅い可能性があります'
          });
        } else {
          tests.push({
            success: false,
            action: 'プロフィール読み取り',
            message: `例外エラー: ${error.message}`
          });
        }
      }

      // Test 2: プロフィール作成/更新（短いタイムアウト）
      console.log('🧪 Testing profile upsert...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒に短縮

        const testData = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio || '',
          social_links: user.socialLinks || {},
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('users')
          .upsert(testData)
          .select()
          .single()
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          tests.push({
            success: false,
            action: 'プロフィール更新',
            message: `エラー: ${error.message}`
          });
        } else {
          tests.push({
            success: true,
            action: 'プロフィール更新',
            message: '正常に更新できました'
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          tests.push({
            success: false,
            action: 'プロフィール更新',
            message: 'タイムアウト: 接続が遅い可能性があります'
          });
        } else {
          tests.push({
            success: false,
            action: 'プロフィール更新',
            message: `例外エラー: ${error.message}`
          });
        }
      }

      // Test 3: テーブル権限確認（短いタイムアウト）
      console.log('🧪 Testing table permissions...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒に短縮

        const { error } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          tests.push({
            success: false,
            action: 'テーブル権限',
            message: `権限エラー: ${error.message}`
          });
        } else {
          tests.push({
            success: true,
            action: 'テーブル権限',
            message: 'アクセス権限正常'
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          tests.push({
            success: false,
            action: 'テーブル権限',
            message: 'タイムアウト: 権限確認が遅い可能性があります'
          });
        } else {
          tests.push({
            success: false,
            action: 'テーブル権限',
            message: `権限エラー: ${error.message}`
          });
        }
      }

    } catch (error) {
      console.error('Profile tests failed:', error);
    } finally {
      setProfileTests(tests);
      setTestingProfile(false);
    }
  };

  const checkTable = async (tableName: string): Promise<TableInfo> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒に短縮

      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        return {
          name: tableName,
          exists: false,
          rowCount: 0,
          error: error.message
        };
      }

      return {
        name: tableName,
        exists: true,
        rowCount: count || 0
      };
    } catch (error: any) {
      return {
        name: tableName,
        exists: false,
        rowCount: 0,
        error: error.name === 'AbortError' ? 'タイムアウト' : (error.message || 'Unknown error')
      };
    }
  };

  const checkPolicies = async (): Promise<PolicyInfo[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const { data, error } = await supabase
        .rpc('get_policies_info')
        .select('*')
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error || !data) {
        // Fallback: try to check if we can perform basic operations
        return [
          { tableName: 'users', policyName: 'Basic policies', operation: 'SELECT, INSERT, UPDATE' },
          { tableName: 'lives', policyName: 'Basic policies', operation: 'SELECT, INSERT, UPDATE' },
          { tableName: 'live_attendees', policyName: 'Basic policies', operation: 'SELECT, INSERT, DELETE' }
        ];
      }

      return data;
    } catch (error) {
      return [];
    }
  };

  const checkAuthStatus = async (): Promise<{enabled: boolean, error?: string}> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const { data: { session }, error } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);

      if (error && error.message.includes('signup disabled')) {
        return { enabled: false, error: 'メール認証が無効になっています' };
      }

      return { enabled: true };
    } catch (error: any) {
      return { 
        enabled: false, 
        error: error.name === 'AbortError' ? 'タイムアウト' : (error.message || 'Unknown auth error')
      };
    }
  };

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (overallStatus) {
      case 'success':
        return 'データベース正常動作中';
      case 'warning':
        return 'セットアップ完了（データ未作成）';
      case 'error':
        return 'セットアップ未完了または接続問題';
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <Card className="p-6 w-full max-w-md">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" />
            <span>データベース状況を確認中...</span>
          </div>
        </Card>
      </motion.div>
    );
  }

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
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <h2 className={`text-lg font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    詳細なデータベース状況
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={connectionStatus === 'healthy' ? 'default' : 'outline'}>
                  {connectionStatus === 'healthy' ? 'オンライン' : 'ローカル'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkDatabaseStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  再確認
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            <div className={`p-4 rounded-lg mb-6 ${
              connectionStatus === 'healthy' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : connectionStatus === 'unhealthy'
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`font-medium mb-2 ${
                  connectionStatus === 'healthy' ? 'text-green-800 dark:text-green-200'
                  : connectionStatus === 'unhealthy' ? 'text-blue-800 dark:text-blue-200'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {connectionStatus === 'healthy' && '🌐 オンライン接続中'}
                  {connectionStatus === 'unhealthy' && '📱 ローカルモード'}
                  {connectionStatus === 'checking' && '🔍 接続確認中...'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTroubleshooter(true)}
                  className="text-xs"
                >
                  <Bug className="w-3 h-3 mr-1" />
                  診断
                </Button>
              </div>
              <div className={`text-sm ${
                connectionStatus === 'healthy' ? 'text-green-700 dark:text-green-300'
                : connectionStatus === 'unhealthy' ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
              }`}>
                {connectionStatus === 'healthy' && 'Supabaseと正常に接続されています。リアルタイム同期が利用可能です。'}
                {connectionStatus === 'unhealthy' && 'ローカルモードで動作中です。オンライン時に自動同期されます。'}
                {connectionStatus === 'checking' && '接続状態を確認しています...'}
              </div>
            </div>

            {/* Profile Testing Section */}
            {user && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-medium">
                    <User className="w-4 h-4" />
                    プロフィール操作テスト
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testProfileOperations}
                    disabled={testingProfile}
                  >
                    {testingProfile ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    テスト実行
                  </Button>
                </div>

                {profileTests.length > 0 && (
                  <div className="grid gap-2">
                    {profileTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {test.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{test.action}</div>
                            <div className={`text-xs ${
                              test.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {test.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {user && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="text-sm">
                      <div className="font-medium mb-1">現在のユーザー情報:</div>
                      <div className="text-muted-foreground">
                        ID: {user.id}<br />
                        名前: {user.name}<br />
                        接続: {connectionStatus}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tables Status */}
            <div className="space-y-4 mb-6">
              <h3 className="flex items-center gap-2 font-medium">
                <Database className="w-4 h-4" />
                テーブル状況
              </h3>
              <div className="grid gap-3">
                {tables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {table.name === 'users' && <Users className="w-4 h-4" />}
                      {table.name === 'lives' && <Music className="w-4 h-4" />}
                      {table.name === 'live_attendees' && <Shield className="w-4 h-4" />}
                      <div>
                        <div className="font-medium">{table.name}</div>
                        {table.error && (
                          <div className="text-xs text-red-500">{table.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {table.exists ? `${table.rowCount}件` : '未作成'}
                      </span>
                      {table.exists ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Status */}
            <div className="space-y-4 mb-6">
              <h3 className="flex items-center gap-2 font-medium">
                <Shield className="w-4 h-4" />
                認証状況
              </h3>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">メール認証</div>
                  {authStatus.error && (
                    <div className="text-xs text-red-500">{authStatus.error}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {authStatus.enabled ? '有効' : '無効'}
                  </span>
                  {authStatus.enabled ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Security Policies */}
            {policies.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="flex items-center gap-2 font-medium">
                  <Shield className="w-4 h-4" />
                  セキュリティポリシー
                </h3>
                <div className="grid gap-2">
                  {policies.map((policy, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border text-sm">
                      <span className="font-medium">{policy.tableName}</span>
                      <span className="text-muted-foreground">{policy.operation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={onClose} className="flex-1">
                閉じる
              </Button>
              {(overallStatus === 'error' || connectionStatus === 'unhealthy') && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowTroubleshooter(true)}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  接続診断
                </Button>
              )}
              {overallStatus === 'error' && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new', '_blank')}
                >
                  SQL Editor
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Connection Troubleshooter Modal */}
      <AnimatePresence>
        {showTroubleshooter && (
          <ConnectionTroubleshooter
            onClose={() => setShowTroubleshooter(false)}
            currentStatus={connectionStatus}
          />
        )}
      </AnimatePresence>
    </>
  );
}