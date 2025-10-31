import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { SocialIcons } from './SocialIcons';
import { ShareModal } from './ShareModal';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { getUserByUserId } from '../lib/api';
import type { Live, User } from '../types';

interface LiveAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  live: Live;
  attendeeUserIds: string[];
}

// モバイルデバイス検出
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent;
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  return isMobileUserAgent || (hasTouchScreen && isSmallScreen);
};

// 振動トリガー（極めて軽い振動）
const triggerVibration = (pattern: number | number[] = 10): void => {
  if (!isMobileDevice()) {
    return;
  }

  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // エラーは無視
    }
  }
};

export const LiveAttendeesModal: React.FC<LiveAttendeesModalProps> = ({
  isOpen,
  onClose,
  live,
  attendeeUserIds,
}) => {
  const [attendees, setAttendees] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState<string>('');
  const [direction, setDirection] = useState(0); // 1: 上スワイプ, -1: 下スワイプ

  useEffect(() => {
    if (isOpen && attendeeUserIds.length > 0) {
      loadAttendees();
      setCurrentIndex(0);
    }
  }, [isOpen, attendeeUserIds]);

  const loadAttendees = async () => {
    setLoading(true);
    try {
      const users = await Promise.all(
        attendeeUserIds.map(userId => getUserByUserId(userId))
      );

      const filteredUsers = users.filter(u => u !== null) as User[];

      // users.idで重複を除外
      const uniqueUsers = filteredUsers.reduce((acc, user) => {
        if (!acc.some(u => u.id === user.id)) {
          acc.push(user);
        }
        return acc;
      }, [] as User[]);

      setAttendees(uniqueUsers);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3D回転アニメーションの定義
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

  // ドラッグ終了ハンドラー
  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 50;
    const totalAttendees = attendees.length;
    let profileChanged = false;

    if (info.offset.y < -threshold) {
      // 上スワイプ - 次のプロフィール
      setDirection(1);
      const nextIndex = (currentIndex + 1) % totalAttendees;
      setCurrentIndex(nextIndex);
      profileChanged = true;
    } else if (info.offset.y > threshold) {
      // 下スワイプ - 前のプロフィール
      setDirection(-1);
      const prevIndex = (currentIndex - 1 + totalAttendees) % totalAttendees;
      setCurrentIndex(prevIndex);
      profileChanged = true;
    }

    if (profileChanged) {
      triggerVibration(10);
    }
  };

  // ドットクリックハンドラー
  const handleDotClick = useCallback((index: number) => {
    if (index !== currentIndex) {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      triggerVibration(8);
    }
  }, [currentIndex]);

  const handleShareClick = (userId: string) => {
    setShareUserId(userId);
    setIsShareModalOpen(true);
  };

  const date = new Date(live.date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

  const currentAttendee = attendees[currentIndex];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 gap-0 bg-transparent border-0 shadow-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative space-y-2"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Live Info Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-primary bg-white text-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[70px]">
                  <div className="text-xs opacity-80 leading-tight">{year}</div>
                  <div className="text-sm font-medium leading-tight">{month}/{day}({weekday})</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base mb-1 text-gray-800 truncate">{live.artist}</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{live.venue}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Ring Section */}
            <div
              className="relative"
              style={{
                perspective: '1200px',
              }}
            >
              {/* リングバインダー穴 - 20個 */}
              <div className="absolute -top-2 left-0 right-0 flex justify-around px-8 z-30 pointer-events-none">
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

              {/* 次のページのプレビュー */}
              {!loading && attendees.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="absolute inset-0 bg-white rounded-2xl shadow-md"
                  style={{
                    top: '8px',
                    transform: 'translateY(4px) scale(0.98)',
                    zIndex: 5,
                  }}
                />
              )}

              {/* メインカードコンテナ */}
              <div
                className="bg-white rounded-2xl shadow-xl overflow-hidden relative"
                style={{
                  height: '400px',
                  paddingTop: '2rem',
                  transformStyle: 'preserve-3d',
                  zIndex: 10,
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : attendees.length === 0 ? (
                  <div className="text-center p-12 text-gray-500">
                    参加者がいません
                  </div>
                ) : (
                  <AnimatePresence
                    initial={false}
                    custom={direction}
                    mode="wait"
                  >
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
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={0.2}
                      onDragEnd={handleDragEnd}
                      className="absolute inset-0 p-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
                      style={{
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        willChange: 'transform, opacity',
                      }}
                    >
                      {currentAttendee && (
                        <div className="flex flex-col items-center space-y-4 w-full">
                          {/* アバター */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.2,
                              type: "spring",
                              stiffness: 300
                            }}
                            className="relative"
                          >
                            <motion.div
                              className="h-[84px] w-[84px] rounded-full bg-gradient-to-r from-primary to-blue-500 p-1"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="h-full w-full rounded-full bg-white p-1">
                                <Avatar className="h-full w-full">
                                  <AvatarImage src="" />
                                  <AvatarFallback className="bg-gray-400 text-white text-3xl">
                                    {currentAttendee.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </motion.div>
                          </motion.div>

                          {/* 名前 */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                          >
                            <h3 className="text-lg font-semibold mb-2 text-black">
                              {currentAttendee.name}
                            </h3>
                          </motion.div>

                          {/* ユーザーID */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="flex items-center justify-center gap-1"
                          >
                            <span className="text-gray-500 font-medium">@</span>
                            <span className="text-sm text-gray-600">{currentAttendee.user_id}</span>
                          </motion.div>

                          {/* SNSアイコン */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex justify-center"
                          >
                            <SocialIcons
                              socialLinks={currentAttendee.social_links}
                              onShare={() => handleShareClick(currentAttendee.user_id)}
                            />
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* スワイプヒント */}
                {!loading && attendees.length > 1 && currentIndex === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 animate-pulse"
                  >
                    上にスワイプして次へ
                  </motion.div>
                )}
              </div>

              {/* ナビゲーションドット */}
              {attendees.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white/80 rounded-full px-2 py-2 backdrop-blur-sm"
                >
                  <div className="text-xs text-gray-600 font-medium">
                    {currentIndex + 1}/{attendees.length}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {attendees.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {shareUserId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareUserId('');
          }}
          userId={shareUserId}
        />
      )}
    </>
  );
};
