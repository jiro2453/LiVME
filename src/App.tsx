import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Plus, LogOut, TestTube, ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { LiveCard } from './components/LiveCard';
import { ProfileRing } from './components/ProfileRing';
import { AddLiveModal } from './components/AddLiveModal';
import { ProfileModal } from './components/ProfileModal';
import { ShareModal } from './components/ShareModal';
import { SupabaseStatus } from './components/SupabaseStatus';
import { DatabaseStatus } from './components/DatabaseStatus';
import { DatabaseSetupGuide } from './components/DatabaseSetupGuide';
import { ProfileCreationError } from './components/ProfileCreationError';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProductionDemo } from './components/ProductionDemo';
import { LivmeLogo } from './components/LivmeLogo';
import { FastLoading } from './components/FastLoading';
import { SocialIcons } from './components/SocialIcons';
import { AdSlot } from './components/AdSlot';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLives } from './hooks/useLives';
import { useAllLives } from './hooks/useAllLives';
import { useSearch } from './hooks/useSearch';
import { useProfileRouting } from './hooks/useProfileRouting';
import { getStoredUser, supabase } from './lib/supabase';
import { IS_PRODUCTION, IS_STAGING, logger } from './lib/environment';
import { groupLivesByYearMonth, formatYearMonth } from './utils/liveGrouping';
import { Live, User as UserType } from './types';
import { Toaster } from 'sonner@2.0.3';
import { toast } from 'sonner@2.0.3';

function MainApp() {
  // Profile routing hook
  const { urlUserId, navigateToProfile, navigateToHome } = useProfileRouting();

  // States
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [profileModalSelectedLive, setProfileModalSelectedLive] = useState<Live | null>(null);
  const [showAddLive, setShowAddLive] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupabaseStatus, setShowSupabaseStatus] = useState(false);
  const [showDatabaseStatus, setShowDatabaseStatus] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [retryingProfile, setRetryingProfile] = useState(false);
  const [showProductionDemo, setShowProductionDemo] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Auth context
  const {
    user: currentUser,
    loading: authLoading,
    signOut,
    updateUserProfile,
    isProfileCreationFailed,
    profileCreationError,
    retryProfileCreation,
    connectionStatus
  } = useAuth();

  // Custom hooks for lives and search functionality
  const { lives, loading: livesLoading, error: livesError, addLive, joinLive, deleteLive, refreshLives, forceReset, isUsingFallback } = useLives();
  const { allLives, loading: allLivesLoading, error: allLivesError, refreshAllLives, isUsingFallback: isAllLivesUsingFallback } = useAllLives();
  const { livesResults, searchLives, clearResults } = useSearch();

  // ページ表示時に確実にデータを取得（ユーザーがログインしている場合）
  useEffect(() => {
    if (currentUser && !authLoading && !livesLoading && !allLivesLoading) {
      if (lives.length === 0 || allLives.length === 0) {
        
        // 初回データロードのみ実行（5秒後のチェックは削除）
        const timer = setTimeout(() => {
          if (lives.length === 0) {
            refreshLives();
          }
          if (allLives.length === 0) {
            refreshAllLives();
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [currentUser?.id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // AdSense verification meta tag
  useEffect(() => {
    // AdSense確認用のメタタグを追加
    const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
    if (!existingMeta) {
      const meta = document.createElement('meta');
      meta.name = 'google-adsense-account';
      meta.content = 'ca-pub-9899334610612784';
      document.head.appendChild(meta);
      console.log('✅ AdSense verification meta tag added');
    }
    
    // ページタイトルを設定（SEO対策）
    document.title = 'LIVME - ライブ体験を記録・共有';
    
    // OGPメタタグを追加
    const addMetaTag = (property: string, content: string) => {
      const existing = document.querySelector(`meta[property="${property}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };
    
    addMetaTag('og:title', 'LIVME - ライブ体験を記録・共有');
    addMetaTag('og:description', 'ライブやコンサートの思い出を記録・共有できるソーシャルアプリ');
    addMetaTag('og:type', 'website');
  }, []);

  // Debug logging
  useEffect(() => {
    if (!IS_PRODUCTION) {
      logger.log('🔍 DEBUG: MainApp user state changed:', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        userName: currentUser?.name,
        authLoading
      });
    }
  }, [currentUser, authLoading]);

  // Debug logging for lives data (disabled to prevent performance issues)
  // useEffect(() => {
  //   console.log('🔍 DEBUG: Lives data in App.tsx:', {
  //     livesCount: lives.length,
  //     livesData: lives,
  //     livesWithAttendees: lives.map(l => ({
  //       id: l.id,
  //       artist: l.artist,
  //       attendeesCount: l.attendees.length,
  //       attendees: l.attendees
  //     }))
  //   });
  // }, [lives]);

  // Handle URL-based profile routing
  useEffect(() => {
    if (urlUserId && currentUser) {
      if (livesLoading || allLivesLoading) return;

      const findUserByUserId = (targetUserId: string): UserType | null => {
        if (currentUser.user_id === targetUserId) return currentUser;
        
        for (const live of allLives) {
          const foundUser = live.attendees.find(attendee => attendee.user_id === targetUserId);
          if (foundUser) return foundUser;
        }
        
        for (const live of lives) {
          const foundUser = live.attendees.find(attendee => attendee.user_id === targetUserId);
          if (foundUser) return foundUser;
        }
        
        return null;
      };
      
      const user = findUserByUserId(urlUserId);
      if (user) {
        setSelectedUser(user);
        setShowUserProfile(true);
        setShowProfile(false);
      } else if (!livesLoading && !allLivesLoading) {
        navigateToHome();
      }
    } else if (!urlUserId && showUserProfile) {
      setShowUserProfile(false);
      setSelectedUser(null);
    }
  }, [urlUserId, currentUser, lives, allLives, livesLoading, allLivesLoading, showUserProfile, navigateToHome]);

  // Development debug setup
  useEffect(() => {
    if (typeof window !== 'undefined' && !IS_PRODUCTION) {
      (window as any).livmeForceReset = forceReset;
      (window as any).livmeEnvironment = 'development';
      (window as any).livmeDebugInfo = {
        user: currentUser?.id,
        livesCount: lives.length,
        allLivesCount: allLives.length,
        authLoading,
        livesLoading,
        allLivesLoading,
        connectionStatus
      };
    }
  }, [forceReset, currentUser, lives, allLives, authLoading, livesLoading, allLivesLoading, connectionStatus]);

  // Search handling
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => searchLives(searchQuery), 300);
      return () => clearTimeout(timeoutId);
    } else {
      clearResults();
    }
  }, [searchQuery, searchLives, clearResults]);

  // Event handlers
  const handleShareProfile = () => {
    if (!currentUser || !currentUser.user_id) {
      toast.error('プロフィールのシェアができません');
      return;
    }
    setShowShareModal(true);
  };

  const handleAddLive = async (liveData: Omit<Live, 'id' | 'attendees'>) => {
    if (!currentUser) return;
    const result = await addLive(liveData, currentUser.id);
    if (result.success) {
      setShowAddLive(false);
      try {
        // 二重リフレッシュを一旦抑制して1回のみ
        await Promise.all([refreshLives(), refreshAllLives()]);
      } catch (error) {
        // エラーは無視
      }
    }
  };

  const handleJoinLive = async (liveId: string) => {
    if (!currentUser) return;
    const result = await joinLive(liveId, currentUser.id);
    if (result.success) {
      try {
        // 一旦1回のみ
        await Promise.all([refreshLives(), refreshAllLives()]);
      } catch (error) {
        // エラーは無視
      }
    }
  };

  const handleDeleteLive = async (liveId: string) => {
    if (!currentUser) return;
    const result = await deleteLive(liveId, currentUser.id);
    if (result.success) {
      if (selectedLive && selectedLive.id === liveId) {
        setSelectedLive(null);
      }
      if (profileModalSelectedLive && profileModalSelectedLive.id === liveId) {
        setProfileModalSelectedLive(null);
      }
      try {
        await refreshLives();
        await refreshAllLives();
      } catch (error) {
        // エラーは無視
      }
    }
  };

  const handleUpdateUserProfile = async (updatedUser: UserType): Promise<void> => {
    if (!currentUser) {
      throw new Error('ユーザーがログインしていません');
    }

    try {
      const updates: Partial<UserType> = {
        name: updatedUser.name,
        bio: updatedUser.bio,
        user_id: updatedUser.user_id,
        avatar: updatedUser.avatar,
        images: updatedUser.images,
        socialLinks: updatedUser.socialLinks
      };

      const result = await updateUserProfile(updates);
      
      if (result.success) {
        logger.info('✅ Profile update successful');
      } else {
        logger.error('❌ Profile update failed:', result.error);
        throw new Error(result.error || 'プロフィール更新に失敗しました');
      }
    } catch (error) {
      logger.error('❌ Update user profile error:', error);
      throw error;
    }
  };

  const handleViewUserProfile = (user: UserType) => {
    if (profileModalSelectedLive) {
      setProfileModalSelectedLive(null);
    }

    if (showProfile || showUserProfile) {
      setSelectedUser(user);
      
      if (showProfile && user.id !== currentUser?.id) {
        setShowProfile(false);
        setShowUserProfile(true);
      } else if (showUserProfile) {
        setShowUserProfile(true);
      } else if (showUserProfile && user.id === currentUser?.id) {
        setShowUserProfile(false);
        setShowProfile(true);
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(user);
      setShowUserProfile(true);
    }

    if (user.user_id) {
      navigateToProfile(user.user_id);
    }
  };

  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
    setSelectedUser(null);
    if (urlUserId) {
      navigateToHome();
    }
  };

  const handleRetryProfile = async () => {
    setRetryingProfile(true);
    try {
      await retryProfileCreation();
    } finally {
      setRetryingProfile(false);
    }
  };

  const getProfileModalLives = (targetUser: UserType): Live[] => {
    if (currentUser?.id === targetUser.id) {
      return lives;
    }

    const sourceLives = allLives.length > 0 ? allLives : lives;

    // Debug logging disabled for performance
    // if (!IS_PRODUCTION) {
    //   console.log('ProfileModal data selection:', { ... });
    // }

    return sourceLives;
  };

  // Data processing
  const displayLives = searchQuery.trim() ? livesResults : lives;

  // 非破壊ソート＋メモ化
  const allLivesSorted = useMemo(() => {
    const copied = [...displayLives];
    return copied.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [displayLives]);

  // 年月グループ化（メモ化）
  const groupedLives = useMemo(() => groupLivesByYearMonth(allLivesSorted), [allLivesSorted]);

  // アコーディオンの全キー（メモ化）
  const allAccordionKeys = useMemo(() => {
    return Object.keys(groupedLives)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .flatMap(year =>
        Object.keys(groupedLives[year])
          .sort((a, b) => parseInt(b) - parseInt(a))
          .map(month => `${year}-${month}`)
      );
  }, [groupedLives]);

  // 制御モードの開閉キー（初回のみ全開）
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  useEffect(() => {
    if (openKeys.length === 0 && allAccordionKeys.length > 0) {
      setOpenKeys(allAccordionKeys);
    }
  }, [allAccordionKeys, openKeys.length]);

  // Show different screens based on state
  if (showProductionDemo) {
    return <ProductionDemo onClose={() => setShowProductionDemo(false)} />;
  }

  if (authLoading || (currentUser && livesLoading && lives.length === 0)) {
    return <FastLoading authLoading={authLoading} livesLoading={livesLoading} error={livesError} connectionStatus={connectionStatus} />;
  }

  if (!currentUser || !currentUser.id || currentUser.id.startsWith('local-user-')) {
    return <AuthScreen />;
  }

  // Profile screen
  if (showProfile || showUserProfile) {
    const profileUser = showProfile ? currentUser : selectedUser;
    if (!profileUser) return null;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="w-full max-w-2xl mx-auto bg-background min-h-screen">
          <motion.header 
            className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={showProfile ? () => setShowProfile(false) : handleCloseUserProfile}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <motion.div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <LivmeLogo />
                {IS_STAGING && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium shadow-md"
                  >
                    <TestTube className="w-3 h-3" />
                    STAGING
                  </motion.div>
                )}
              </motion.div>
              
              <div className="w-10"></div>
            </div>
          </motion.header>

          <ProfileModal
            user={profileUser}
            currentUser={currentUser}
            lives={getProfileModalLives(profileUser)}
            onClose={showProfile ? () => setShowProfile(false) : handleCloseUserProfile}
            onUpdateUser={handleUpdateUserProfile}
            onViewLive={(live) => setProfileModalSelectedLive(live)}
          />
        </div>

        <AnimatePresence>
          {profileModalSelectedLive && (
            <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <ProfileRing
                live={profileModalSelectedLive}
                onClose={() => setProfileModalSelectedLive(null)}
                onViewProfile={handleViewUserProfile}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main screen
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <div className="w-full max-w-2xl mx-auto bg-background min-h-screen">
          <motion.header
            className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative flex items-center justify-end p-4">
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <LivmeLogo />
                {IS_STAGING && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium shadow-md"
                  >
                    <TestTube className="w-3 h-3" />
                    STAGING
                  </motion.div>
                )}
              </motion.div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfile(true)}
                  className="rounded-full"
                >
                  <User className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="rounded-full"
                  title="ログアウト"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.header>

          {isProfileCreationFailed && profileCreationError && (
            <ProfileCreationError
              error={profileCreationError}
              onRetry={handleRetryProfile}
              onOpenDatabaseSettings={() => setShowSupabaseStatus(true)}
              isRetrying={retryingProfile}
            />
          )}

          <main className="pb-20">
            {/* Profile Section */}
            <motion.div 
              className="p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="flex justify-center mb-4"
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowProfile(true)}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden cursor-pointer relative">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              <h1 className="text-lg font-medium mb-2">{currentUser.name}</h1>

              {currentUser.user_id && (
                <div className="flex items-center justify-center gap-1 mb-3">
                  <span className="text-gray-500 font-medium">@</span>
                  <span className="text-sm text-muted-foreground">
                    {currentUser.user_id}
                  </span>
                </div>
              )}

              {currentUser.bio && (
                <p className="text-sm text-muted-foreground mb-4 px-4 leading-relaxed">
                  {currentUser.bio}
                </p>
              )}

              <SocialIcons user={currentUser} onShareProfile={handleShareProfile} />
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
                    {!searchQuery && (
                      <>
                        <Search className="w-4 h-4" />
                        <span className="text-gray-600">アーティスト名・会場名で検索</span>
                      </>
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

            {/* All Lives Section - アコーディオンで年月ごとに表示 */}
            <div className="px-6 space-y-4 mb-8">
              <motion.div 
                className="flex items-center justify-center relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-lg font-medium search-results-header">
                  {searchQuery ? '検索結果' : '参加公演'}
                </h2>
                <Button
                  onClick={() => setShowAddLive(true)}
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
                {Object.keys(groupedLives).length > 0 ? (
                  <Accordion
                    type="multiple"
                    className="w-full"
                    value={openKeys}
                    onValueChange={setOpenKeys}
                  >
                    {Object.keys(groupedLives)
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .flatMap(year => {
                        const months = Object.keys(groupedLives[year])
                          .sort((a, b) => parseInt(b) - parseInt(a));
                        
                        return months.flatMap((month, monthIndex) => {
                          const monthLives = groupedLives[year][month];
                          const accordionValue = `${year}-${month}`;
                          const elements: JSX.Element[] = [];
                          
                          // 月のアコーディオンアイテム
                          elements.push(
                            <AccordionItem key={accordionValue} value={accordionValue}>
                              <AccordionTrigger className="hover:no-underline">
                                <span className="text-base font-medium">
                                  {formatYearMonth(year, month)}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-2">
                                  {monthLives.map((live, index) => (
                                    <motion.div
                                      key={live.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.05 * index }}
                                    >
                                      <LiveCard
                                        live={live}
                                        onJoin={() => handleJoinLive(live.id)}
                                        onViewAttendees={() => setSelectedLive(live)}
                                        onDelete={() => handleDeleteLive(live.id)}
                                        isJoined={live.attendees.some(u => u.id === currentUser.id)}
                                      />
                                    </motion.div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                          
                          // 各年の2つ目の月（インデックス1）の直後に広告を挿入
                          if (monthIndex === 1) {
                            elements.push(
                              <AdSlot
                                key={`ad-${year}-${month}`}
                                variant="banner"
                                enabled={true} // A/Bテスト用: 初期は無効
                                isModalOpen={!!(selectedLive || showAddLive || showProfile || showUserProfile)}
                                slotId={`ad-accordion-${year}`}
                                adUnitId="5486684481"
                              />
                            );
                          }
                          
                          return elements;
                        });
                      })}
                  </Accordion>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <p className="text-sm">
                      {searchQuery 
                        ? '該当する公演がありません'
                        : 'まだ参加公演がありませ��'
                      }
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </main>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {selectedLive && (
            <ProfileRing
              live={selectedLive}
              onClose={() => setSelectedLive(null)}
              onViewProfile={handleViewUserProfile}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddLive && (
            <AddLiveModal
              onClose={() => setShowAddLive(false)}
              onAdd={handleAddLive}
              existingLives={lives}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSupabaseStatus && (
            <SupabaseStatus onClose={() => setShowSupabaseStatus(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDatabaseStatus && (
            <DatabaseStatus onClose={() => setShowDatabaseStatus(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSetupGuide && (
            <DatabaseSetupGuide onClose={() => setShowSetupGuide(false)} />
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          profileUrl={currentUser?.user_id ? `${window.location.origin}/${currentUser.user_id}` : ''}
          userName={currentUser?.name || ''}
          userAvatar={currentUser?.avatar || ''}
          userUserId={currentUser?.user_id || ''}
        />
      </div>

      <Toaster 
        position="top-center"
        className="font-japanese"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            fontFamily: '"M PLUS 1", "Meiryo", "メイリオ", "Hiragino Sans", "ヒラギノ角ゴシック Pro", "Yu Gothic Medium", "游ゴシック Medium", "Yu Gothic", "游ゴシック", sans-serif',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        }}
      />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const preconnect1 = document.createElement('link');
    preconnect1.href = 'https://fonts.googleapis.com';
    preconnect1.rel = 'preconnect';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.rel = 'preconnect';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@100;200;300;400;500;600;700;800;900&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    return () => {
      if (document.head.contains(preconnect1)) document.head.removeChild(preconnect1);
      if (document.head.contains(preconnect2)) document.head.removeChild(preconnect2);
      if (document.head.contains(fontLink)) document.head.removeChild(fontLink);
    };
  }, []);

  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

function AppWrapper() {
  const { user } = useAuth();
  return <MainApp key={user?.id || 'no-user'} />;
}
