import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Copy, RefreshCw, Database, X, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface DatabaseErrorDebugProps {
  error: any;
  context: string;
  userId?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function DatabaseErrorDebug({ 
  error, 
  context, 
  userId, 
  onClose, 
  onRetry 
}: DatabaseErrorDebugProps) {
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const errorDetails = {
    message: error?.message || 'Unknown error',
    code: error?.code || 'No code',
    details: error?.details || 'No details',
    hint: error?.hint || 'No hint',
    context: context,
    userId: userId,
    timestamp: new Date().toISOString()
  };

  const copyErrorInfo = async () => {
    try {
      const errorText = `
LIVME Database Error Debug Report
================================
Timestamp: ${errorDetails.timestamp}
Context: ${errorDetails.context}
User ID: ${errorDetails.userId || 'N/A'}

Error Details:
- Message: ${errorDetails.message}
- Code: ${errorDetails.code}
- Details: ${errorDetails.details}
- Hint: ${errorDetails.hint}

Browser Info:
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
      `.trim();

      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      toast.success('エラー情報をクリップボードにコピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('クリップボードへのコピーに失敗しました');
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const getErrorCategory = () => {
    const message = errorDetails.message.toLowerCase();
    
    if (message.includes('not-null constraint')) {
      return {
        category: 'Constraint Violation',
        severity: 'high',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        solution: 'required_field'
      };
    } else if (message.includes('permission denied') || message.includes('rls')) {
      return {
        category: 'Permission Error',
        severity: 'high',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        solution: 'permission'
      };
    } else if (message.includes('timeout') || message.includes('network')) {
      return {
        category: 'Network Error',
        severity: 'medium',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        solution: 'network'
      };
    } else {
      return {
        category: 'General Error',
        severity: 'medium',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        solution: 'general'
      };
    }
  };

  const getSolutionSteps = (solution: string) => {
    switch (solution) {
      case 'required_field':
        return [
          '1. Supabase SQL Editorを開く',
          '2. /docs/fix-created-at-constraint.sql の内容を実行',
          '3. created_at カラムにデフォルト値を設定',
          '4. 既存のNULLデータを更新'
        ];
      case 'permission':
        return [
          '1. Supabaseダッシュボードを開く',
          '2. Authentication > RLS policies を確認',
          '3. usersテーブルのポリシーを有効化',
          '4. 適切な権限を設定'
        ];
      case 'network':
        return [
          '1. インターネット接続を確認',
          '2. Supabaseサービス状態を確認',
          '3. ブラウザを再読み込み',
          '4. しばらく待ってから再試行'
        ];
      default:
        return [
          '1. ブラウザのコンソールを確認',
          '2. ネットワークタブでリクエストを確認',
          '3. Supabaseダッシュボードを確認',
          '4. エラー情報をサポートに報告'
        ];
    }
  };

  const { category, severity, color, bgColor, borderColor, solution } = getErrorCategory();

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
              <AlertTriangle className={`w-6 h-6 ${color}`} />
              <div>
                <h2 className={`text-lg font-medium ${color}`}>
                  データベースエラー詳細
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={color}>
                    {category}
                  </Badge>
                  <Badge variant={severity === 'high' ? 'destructive' : 'secondary'}>
                    {severity === 'high' ? '要修正' : '注意'}
                  </Badge>
                </div>
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

          {/* Error Summary */}
          <div className={`p-4 rounded-lg mb-6 border ${bgColor} ${borderColor}`}>
            <div className={`font-medium mb-2 ${color}`}>
              エラー概要
            </div>
            <div className={`text-sm ${color.replace('600', '700')}`}>
              <strong>メッセージ:</strong> {errorDetails.message}
            </div>
            {errorDetails.code !== 'No code' && (
              <div className={`text-sm mt-1 ${color.replace('600', '700')}`}>
                <strong>エラーコード:</strong> {errorDetails.code}
              </div>
            )}
          </div>

          {/* Solution Steps */}
          <div className="space-y-4 mb-6">
            <h3 className="flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-green-500" />
              解決手順
            </h3>
            <div className="space-y-2">
              {getSolutionSteps(solution).map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">
                    {index + 1}
                  </div>
                  <div className="text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Details */}
          <details className="mb-6">
            <summary className="cursor-pointer font-medium mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              技術的詳細
            </summary>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="space-y-2 text-sm font-mono">
                <div><strong>Context:</strong> {errorDetails.context}</div>
                <div><strong>User ID:</strong> {errorDetails.userId || 'N/A'}</div>
                <div><strong>Timestamp:</strong> {errorDetails.timestamp}</div>
                {errorDetails.details !== 'No details' && (
                  <div><strong>Details:</strong> {errorDetails.details}</div>
                )}
                {errorDetails.hint !== 'No hint' && (
                  <div><strong>Hint:</strong> {errorDetails.hint}</div>
                )}
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              閉じる
            </Button>
            
            {onRetry && (
              <Button 
                onClick={handleRetry} 
                disabled={retrying}
                className="flex-1"
              >
                {retrying ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                再試行
              </Button>
            )}
            
            <Button onClick={copyErrorInfo} variant="outline">
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'コピー済み' : 'エラー情報をコピー'}
            </Button>
          </div>

          {/* SQL Fix Link */}
          {solution === 'required_field' && (
            <div className="mt-4 p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Database className="w-4 h-4" />
                <span className="font-medium">SQL修正スクリプト</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                この問題を解決するには、Supabase SQL Editorで修正スクリプトを実行してください。
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/sql/new', '_blank')}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Database className="w-4 h-4 mr-2" />
                Supabase SQL Editor を開く
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}