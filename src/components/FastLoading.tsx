import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertTriangle, Music, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { LivmeLogo } from './LivmeLogo';
import { IS_PRODUCTION, IS_STAGING } from '../lib/environment';

interface FastLoadingProps {
  authLoading: boolean;
  livesLoading: boolean;
  error: string | null;
  connectionStatus: 'healthy' | 'unhealthy' | 'checking';
}

export const FastLoading: React.FC<FastLoadingProps> = ({ 
  authLoading, 
  livesLoading, 
  error, 
  connectionStatus 
}) => {
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    // 2秒後にヒントを表示
    const timer = setTimeout(() => setShowTips(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'healthy':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <WifiOff className="w-5 h-5 text-blue-500" />;
      case 'checking':
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'healthy':
        return 'オンライン同期中';
      case 'unhealthy':
        return 'ローカルモード';
      case 'checking':
      default:
        return '接続確認中...';
    }
  };

  const getLoadingMessage = () => {
    if (authLoading) return 'ユーザー情報を準備中...';
    if (livesLoading) return 'ライブデータを準備中...';
    return 'LIVMEを起動中...';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          <LivmeLogo className="h-24 w-auto object-contain mx-auto" />
        </motion.div>
      </div>
    </div>
  );
};