import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Plus, MapPin, Loader2, LogOut, BookOpen, Info, CheckCircle, AlertTriangle, Music, Wifi, WifiOff, TestTube, ExternalLink, Crown, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import livmeLogo from 'figma:asset/64af73ee36120231c29e00c5019e180ee06fccfa.png';

// Production Environment Demo Data
const productionUser = {
  id: 'prod-user-12345',
  name: '田中 音楽',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  bio: 'ライブ音楽の魅力を共有しています🎵 年間50公演以上参加！',
  socialLinks: {
    instagram: '@tanaka_music',
    twitter: '@tanaka_live'
  }
};

const productionLives = [
  {
    id: 'live-1',
    artist: 'あいみょん',
    date: '2025-07-20',
    venue: '武道館',
    description: '夏の大型ライブツアー！新曲も披露予定🌟',
    attendees: [productionUser, 
      { id: '2', name: '佐藤さん', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9b1f4f7?w=50&h=50&fit=crop&crop=face' },
      { id: '3', name: '鈴木さん', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' }
    ]
  },
  {
    id: 'live-2',
    artist: 'YOASOBI',
    date: '2025-08-15',
    venue: '東京ドーム',
    description: 'ドーム公演決定！最高のパフォーマンスを期待✨',
    attendees: [productionUser,
      { id: '4', name: '高橋さん', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
    ]
  }
];

const pastLives = [
  {
    id: 'past-1',
    artist: 'Official髭男dism',
    date: '2025-06-30',
    venue: '大阪城ホール',
    description: '素晴らしいライブでした！感動的なパフォーマンス💫',
    attendees: [productionUser,
      { id: '5', name: '山田さん', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face' },
      { id: '6', name: '渡辺さん', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face' }
    ]
  }
];

interface ProductionDemoProps {
  onClose?: () => void;
}

export function ProductionDemo({ onClose }: ProductionDemoProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'healthy' | 'checking'>('checking');
  const [showStatusInfo, setShowStatusInfo] = useState(false);

  // Simulate production connection check
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus('healthy');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const displayLives = searchQuery.trim() ? 
    productionLives.filter(live => 
      live.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      live.venue.toLowerCase().includes(searchQuery.toLowerCase())
    ) : productionLives;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Production Environment Header */}
      <div className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6" />
            <div>
              <h1 className="font-semibold">LIVME Production Environment</h1>
              <p className="text-sm opacity-90">v1.0.0 - 本番環境デモ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Crown className="w-3 h-3 mr-1" />
              PRODUCTION
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-background min-h-screen">
        {/* Main App Header */}
        <motion.header 
          className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="relative flex items-center justify-end p-4">
            {/* Production Logo - 64px as specified */}
            <motion.div 
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <img 
                src={livmeLogo} 
                alt="LIVME" 
                className="h-16 w-auto object-contain"
              />
            </motion.div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 cursor-pointer"
                onClick={() => setShowStatusInfo(!showStatusInfo)}
              >
                {connectionStatus === 'healthy' ? (
                  <Wifi className="w-3 h-3 text-green-600 dark:text-green-400" />
                ) : (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                )}
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {connectionStatus === 'healthy' ? 'オンライン' : '接続中'}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                title="ログアウト"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Connection Status Info */}
          <AnimatePresence>
            {showStatusInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border bg-green-50 dark:bg-green-900/20 p-3"
              >
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  <span>Supabase接続良好 - 本番データベースに接続済み</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Main Content */}
        <main className="pb-20">
          {/* User Profile Section */}
          <motion.div 
            className="p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Profile Image */}
            <motion.div
              className="flex justify-center mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden cursor-pointer relative">
                <img 
                  src={productionUser.avatar} 
                  alt={productionUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <h1 className="text-lg font-medium mb-2">
              {productionUser.name}
            </h1>

            <p className="text-sm text-muted-foreground mb-4 px-4 leading-relaxed">
              {productionUser.bio}
            </p>

            {/* Social Icons */}
            <div className="flex justify-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </motion.div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            className="px-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 text-gray-600">
                  <Search className="w-4 h-4" />
                  {!searchQuery && (
                    <span className="text-gray-600">アーティスト名・会場名で検索</span>
                  )}
                </div>
              </div>
              <Input
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-full bg-gray-100 text-black text-center border-2 border-primary focus:ring-2 focus:ring-primary/30 placeholder:text-transparent"
              />
            </div>
          </motion.div>

          {/* Future Lives Section */}
          <div className="px-6 space-y-4 mb-8">
            <motion.div 
              className="flex items-center justify-center relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-medium">
                {searchQuery ? '検索結果 - 参加予定の公演' : '参加予定の公演'}
              </h2>
              <Button
                size="sm"
                className="rounded-full w-8 h-8 p-0 bg-primary text-primary-foreground absolute right-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {displayLives.map((live, index) => (
                <motion.div
                  key={live.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{live.artist}</h3>
                          <Badge variant="outline" className="text-xs">
                            {new Date(live.date) > new Date() ? '予定' : '終了'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{live.venue}</span>
                          <span>•</span>
                          <span>{new Date(live.date).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {live.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {live.attendees.slice(0, 3).map((attendee, i) => (
                              <img
                                key={i}
                                src={attendee.avatar}
                                alt={attendee.name}
                                className="w-6 h-6 rounded-full border-2 border-background"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {live.attendees.length}人が参加予定
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Past Lives Section */}
          <div className="px-6 space-y-4">
            <motion.div 
              className="flex items-center justify-center relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-lg font-medium">過去の参加公演</h2>
              <Button
                size="sm"
                className="rounded-full w-8 h-8 p-0 bg-primary text-primary-foreground absolute right-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {pastLives.map((live, index) => (
                <motion.div
                  key={live.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer opacity-90">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{live.artist}</h3>
                          <Badge variant="secondary" className="text-xs">
                            参加済み
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{live.venue}</span>
                          <span>•</span>
                          <span>{new Date(live.date).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {live.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {live.attendees.slice(0, 3).map((attendee, i) => (
                              <img
                                key={i}
                                src={attendee.avatar}
                                alt={attendee.name}
                                className="w-6 h-6 rounded-full border-2 border-background"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {live.attendees.length}人が参加
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Production Environment Info Panel */}
      <div className="fixed bottom-4 right-4 w-72">
        <Card className="p-4 shadow-lg border-green-200 dark:border-green-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">本番環境の特徴</span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>大きな3D緑色ロゴ (64px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>最適化されたパフォーマンス</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>本番データベース接続</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>最小限のデバッグログ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>プロフェッショナルUI</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}