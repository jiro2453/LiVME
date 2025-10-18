import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Calendar, MapPin, Music, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useAllLives } from '../hooks/useAllLives';
import { ImageWithFallback } from './figma/ImageWithFallback';
import instagramIcon from 'figma:asset/2701450987b923309cd46b9ff536dccf8b5279ef.png';
import xIcon from 'figma:asset/60334a3695e4d7c94f8800699c7f2b365f0951d9.png';
import tiktokIcon from 'figma:asset/69e18633047e5c183db56b8e6c727deeaf5b843c.png';

interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  user_id?: string;
  images?: string[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  };
}

interface Live {
  id: string;
  artist: string;
  date: string;
  venue: string;
  attendees: User[];
}

interface ProfileRingProps {
  live: Live;
  onClose: () => void;
  onViewProfile: (user: User) => void;
}

// モバイルデバイス検出関数
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // User Agentによる検出
  const userAgent = window.navigator.userAgent;
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Touch対応とscreen sizeによる検出
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobileUserAgent || (hasTouchScreen && isSmallScreen);
};

// 振動機能（非常に弱い振動）
const triggerVibration = (pattern: number | number[] = 10): void => {
  // モバイルデバイスでない場合は何もしない
  if (!isMobileDevice()) {
    return;
  }
  
  // Vibration APIが利用可能かチェック
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // エラーは無視
    }
  }
};

// SNSアイコンコンポーネント（画像版）
const InstagramIcon = () => (
  <div 
    className="overflow-hidden"
    style={{ 
      all: 'unset',
      display: 'block',
      width: '35px',
      height: '35px'
    }}
  >
    <img
      src={instagramIcon}
      alt="Instagram"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        borderRadius: '0',
        padding: '0',
        margin: '0',
        display: 'block'
      }}
    />
  </div>
);

const TwitterIcon = () => (
  <div 
    className="overflow-hidden"
    style={{ 
      all: 'unset',
      display: 'block',
      width: '35px',
      height: '35px'
    }}
  >
    <img
      src={xIcon}
      alt="X (Twitter)"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        borderRadius: '0',
        padding: '0',
        margin: '0',
        display: 'block'
      }}
    />
  </div>
);

const TikTokIcon = () => (
  <div 
    className="overflow-hidden"
    style={{ 
      all: 'unset',
      display: 'block',
      width: '35px',
      height: '35px'
    }}
  >
    <img
      src={tiktokIcon}
      alt="TikTok"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        borderRadius: '0',
        padding: '0',
        margin: '0',
        display: 'block'
      }}
    />
  </div>
);

export function ProfileRing({ live, onClose, onViewProfile }: ProfileRingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [updatedAttendees, setUpdatedAttendees] = useState(live.attendees);
  
  const { user: currentUser } = useAuth();
  
  // allLivesフックを使用して最新の全公演データを取得
  const { allLives, loading: allLivesLoading } = useAllLives();
  
  // refreshAllLivesの呼び出しを削除してパフォーマンス向上

  // ユーザー情報マップをメモ化（パフォーマンス最適化）
  const userInfoMap = useMemo(() => {
    const map = new Map<string, User>();
    
    // allLivesから全ユーザー情報を抽出してマップ化
    if (allLives && allLives.length > 0) {
      for (const liveEvent of allLives) {
        for (const attendee of liveEvent.attendees) {
          const existing = map.get(attendee.id);
          // より完全な情報があれば更新
          if (!existing || 
              attendee.bio || attendee.user_id || 
              attendee.images?.length || 
              Object.keys(attendee.socialLinks || {}).length > 0) {
            map.set(attendee.id, attendee);
          }
        }
      }
    }
    
    return map;
  }, [allLives]);
  
  // 他人のユーザー情報を最新データから取得する関数（メモ化）
  const getLatestUserInfo = useCallback((targetUser: User): User => {
    // 現在のユーザーの場合は currentUser の最新情報を使用
    if (currentUser && targetUser.id === currentUser.id) {
      return {
        ...targetUser,
        name: currentUser.name,
        avatar: currentUser.avatar,
        bio: currentUser.bio || '',
        user_id: currentUser.user_id,
        images: currentUser.images || [],
        socialLinks: currentUser.socialLinks || {}
      };
    }
    
    // マップから高速検索
    const foundUser = userInfoMap.get(targetUser.id);
    if (foundUser) {
      return {
        ...targetUser,
        name: foundUser.name || targetUser.name,
        avatar: foundUser.avatar || targetUser.avatar,
        bio: foundUser.bio || targetUser.bio || '',
        user_id: foundUser.user_id || targetUser.user_id || '',
        images: Array.isArray(foundUser.images) ? foundUser.images : (targetUser.images || []),
        socialLinks: {
          ...targetUser.socialLinks,
          ...foundUser.socialLinks
        }
      };
    }
    
    // 見つからない場合は元の情報を返す
    return {
      ...targetUser,
      bio: targetUser.bio || '',
      user_id: targetUser.user_id || '',
      images: Array.isArray(targetUser.images) ? targetUser.images : [],
      socialLinks: targetUser.socialLinks || {}
    };
  }, [currentUser, userInfoMap]);

  // 現在のユーザーのプロフィール情報でattendeesを更新（メモ化で最適化）
  const sortedAttendees = useMemo(() => {
    try {
      const updated = live.attendees.map(attendee => getLatestUserInfo(attendee));

      // 現在のユーザーを先頭に移動
      return currentUser ? updated.sort((a, b) => {
        if (a.id === currentUser.id) return -1;
        if (b.id === currentUser.id) return 1;
        return 0;
      }) : updated;
    } catch (error) {
      // エラー時は元のデータにフォールバック
      return live.attendees.map(attendee => ({
        ...attendee,
        bio: attendee.bio || '',
        user_id: attendee.user_id || '',
        images: Array.isArray(attendee.images) ? attendee.images : [],
        socialLinks: attendee.socialLinks || {}
      }));
    }
  }, [live.attendees, currentUser, getLatestUserInfo]);
  
  // 状態を更新（最適化：sortedAttendeesを直接使用）
  useEffect(() => {
    setUpdatedAttendees(sortedAttendees);
  }, [sortedAttendees]);
  
  // データリフレッシュロジックを削除してパフォーマンス向上

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    const totalAttendees = updatedAttendees.length;
    let profileChanged = false;
    
    if (info.offset.y < -threshold) {
      // Swipe up - next profile
      setDirection(1);
      if (currentIndex < totalAttendees - 1) {
        setCurrentIndex(currentIndex + 1);
        profileChanged = true;
      } else {
        // At last profile, loop to first
        setCurrentIndex(0);
        profileChanged = true;
      }
    } else if (info.offset.y > threshold) {
      // Swipe down - previous profile
      setDirection(-1);
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        profileChanged = true;
      } else {
        // At first profile, loop to last
        setCurrentIndex(totalAttendees - 1);
        profileChanged = true;
      }
    }
    
    // プロフィールが変更された場合のみ振動（非常に軽い振動）
    if (profileChanged) {
      // 極めて軽い振動パターン（10ms）
      triggerVibration(10);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });
    return {
      year: year.toString(),
      dateInfo: `${month}/${day}(${weekday})`
    };
  };

  const slideVariants = {
    enter: (direction: number) => ({
      rotateX: direction > 0 ? 90 : -90,
      y: direction > 0 ? 100 : -100,
      scale: 0.9,
      opacity: 0,
      transformOrigin: direction > 0 ? "bottom" : "top",
    }),
    center: {
      rotateX: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transformOrigin: "center",
    },
    exit: (direction: number) => ({
      rotateX: direction > 0 ? -90 : 90,
      y: direction > 0 ? -100 : 100,
      scale: 0.9,
      opacity: 0,
      transformOrigin: direction > 0 ? "top" : "bottom",
    }),
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const selectedUser = updatedAttendees[currentIndex];
    onViewProfile(selectedUser);
  };

  // ナビゲーションドットクリック時の処理（さらに軽い振動）
  const handleDotClick = useCallback((index: number) => {
    if (index !== currentIndex) {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      
      // ドット切り替えでも極めて軽い振動（8ms）
      triggerVibration(8);
    }
  }, [currentIndex]);

  const { year, dateInfo } = formatDate(live.date);

  // データロード中のインジケーター
  if (updatedAttendees.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.button
          onClick={async (e) => {
            e.stopPropagation();
            // データ更新を実行
            try {
              await refreshAllLives();
            } catch (error) {
              console.error('Failed to refresh data:', error);
            }
          }}
          className="bg-white rounded-lg px-6 py-4 flex items-center gap-3 text-gray-800 hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
          <span className="font-medium">更新する</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ willChange: "transform, opacity" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Live Info Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border-2 border-primary bg-white text-gray-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[70px]">
                <div className="text-xs opacity-80 leading-tight">{year}</div>
                <div className="text-sm font-medium leading-tight">{dateInfo}</div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-base mb-1 text-gray-800">{live.artist}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{live.venue}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Card Container */}
          <div className="relative min-h-[500px]">
            {/* Ring Holes */}
            <div className="absolute -top-2 left-0 right-0 flex justify-around px-8 z-30">
              {Array.from({ length: 20 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    delay: 0.02 * i, 
                    duration: 0.3, 
                    ease: "easeOut" 
                  }}
                  className="w-3 h-4 bg-gray-800 rounded-full shadow-inner"
                  style={{
                    background: 'linear-gradient(to bottom, #4a5568, #2d3748)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.1)',
                    willChange: 'transform'
                  }}
                />
              ))}
            </div>

            {/* Single Profile Card */}
            <div className="relative">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.25,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: 1200,
                    willChange: "transform, opacity",
                  }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div 
                    className="bg-white rounded-lg overflow-hidden shadow-lg mx-2" 
                    style={{ 
                      backfaceVisibility: "hidden",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    <div className="pt-6 pb-0 px-6">
                      <div className="flex flex-col items-center text-center py-4">
                        {/* Avatar */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                          className="mb-6"
                        >
                          <motion.div 
                            className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden cursor-pointer"
                            onClick={handleViewProfile}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={updatedAttendees[currentIndex].avatar}
                              alt={updatedAttendees[currentIndex].name}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        </motion.div>

                        {/* Name */}
                        <motion.h3
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-lg font-medium mb-2 text-black"
                        >
                          {updatedAttendees[currentIndex].name}
                        </motion.h3>

                        {/* User ID */}
                        {updatedAttendees[currentIndex].user_id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="flex items-center justify-center gap-1 mb-4"
                          >
                            <span className="text-gray-500 font-medium">@</span>
                            <span className="text-sm text-gray-600">
                              {updatedAttendees[currentIndex].user_id}
                            </span>
                          </motion.div>
                        )}

                        {/* Bio */}
                        {updatedAttendees[currentIndex].bio && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-700 mb-6 text-sm leading-relaxed max-w-xs"
                          >
                            {updatedAttendees[currentIndex].bio}
                          </motion.p>
                        )}

                        {/* Social Links - 全員統一でアイコンのみ表示 */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mb-4 flex justify-center gap-4"
                        >
                          {updatedAttendees[currentIndex].socialLinks?.instagram && (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="cursor-pointer"
                              onClick={() => window.open(`https://instagram.com/${updatedAttendees[currentIndex].socialLinks?.instagram?.replace('@', '')}`, '_blank')}
                              style={{ 
                                all: 'unset',
                                cursor: 'pointer',
                                display: 'block',
                                width: '35px',
                                height: '35px'
                              }}
                            >
                              <InstagramIcon />
                            </motion.div>
                          )}

                          {updatedAttendees[currentIndex].socialLinks?.twitter && (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="cursor-pointer"
                              onClick={() => window.open(`https://twitter.com/${updatedAttendees[currentIndex].socialLinks?.twitter?.replace('@', '')}`, '_blank')}
                              style={{ 
                                all: 'unset',
                                cursor: 'pointer',
                                display: 'block',
                                width: '35px',
                                height: '35px'
                              }}
                            >
                              <TwitterIcon />
                            </motion.div>
                          )}

                          {updatedAttendees[currentIndex].socialLinks?.tiktok && (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="cursor-pointer"
                              onClick={() => window.open(`https://tiktok.com/${updatedAttendees[currentIndex].socialLinks?.tiktok?.replace('@', '')}`, '_blank')}
                              style={{ 
                                all: 'unset',
                                cursor: 'pointer',
                                display: 'block',
                                width: '35px',
                                height: '35px'
                              }}
                            >
                              <TikTokIcon />
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Gallery Images */}
                        {(() => {
                          const currentAttendee = updatedAttendees[currentIndex];
                          const hasImages = currentAttendee?.images && currentAttendee.images.length > 0;
                          
                          console.log('🖼️ Gallery Debug:', {
                            currentIndex,
                            attendeeName: currentAttendee?.name,
                            hasImagesProperty: !!currentAttendee?.images,
                            imagesLength: currentAttendee?.images?.length || 0,
                            images: currentAttendee?.images,
                            shouldShowGallery: hasImages
                          });
                          
                          return hasImages ? (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                              className="mb-6 w-full max-w-xs"
                            >
                              <div className={currentAttendee.images!.length >= 3 ? "grid grid-cols-3 gap-2" : "flex justify-center gap-2"}>
                                {currentAttendee.images!.map((image, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    className={`aspect-square rounded-lg overflow-hidden bg-gray-200 ${currentAttendee.images!.length < 3 ? "w-20 h-20" : ""}`}
                                  >
                                    <img
                                      src={image}
                                      alt={`Gallery image ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {/* More Details Button - 自分自身の場合は非表示 */}
                    {currentUser && updatedAttendees[currentIndex].id !== currentUser.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="px-6 pb-6 flex justify-center"
                      >
                        <motion.button
                          onClick={handleViewProfile}
                          className="bg-primary text-primary-foreground px-8 py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          もっとみる
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Dots */}
          {updatedAttendees.length > 1 && (
            <div className="flex justify-center gap-2 pb-2">
              {updatedAttendees.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}