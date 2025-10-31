import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { SocialIcons } from './SocialIcons';
import { ShareModal } from './ShareModal';
import { MapPin } from 'lucide-react';
import { getUserByUserId } from '../lib/api';
import type { Live, User } from '../types';

interface LiveAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  live: Live;
  attendeeUserIds: string[];
}

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

  // ドラッグ/スワイプ用の状態
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // ページめくりアニメーション用の状態
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down' | null>(null);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && attendeeUserIds.length > 0) {
      loadAttendees();
      setCurrentIndex(0); // モーダルを開くときはインデックスをリセット
    }
  }, [isOpen, attendeeUserIds]);

  useEffect(() => {
    console.log('currentIndexが変更されました:', currentIndex);
    console.log('現在のattendee:', attendees[currentIndex]);
  }, [currentIndex, attendees]);

  // ページめくりアニメーションをトリガー
  useEffect(() => {
    if (currentIndex !== prevIndex && attendees.length > 0) {
      // アニメーション開始
      setIsAnimating(true);
      setAnimationDirection(currentIndex > prevIndex ? 'up' : 'down');

      // アニメーション完了後にリセット
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setAnimationDirection(null);
        setPrevIndex(currentIndex);
      }, 400); // アニメーション時間と同期

      return () => clearTimeout(timer);
    }
  }, [currentIndex, prevIndex, attendees.length]);

  const loadAttendees = async () => {
    setLoading(true);
    console.log('=== loadAttendees開始 ===');
    console.log('attendeeUserIds:', attendeeUserIds);
    console.log('attendeeUserIds数:', attendeeUserIds.length);

    try {
      const users = await Promise.all(
        attendeeUserIds.map(userId => getUserByUserId(userId))
      );
      console.log('取得したusers:', users);
      console.log('nullを除外する前のusers数:', users.length);

      const filteredUsers = users.filter(u => u !== null) as User[];
      console.log('nullを除外した後のusers:', filteredUsers);
      console.log('nullを除外した後のusers数:', filteredUsers.length);

      // users.idで重複を除外
      const uniqueUsers = filteredUsers.reduce((acc, user) => {
        if (!acc.some(u => u.id === user.id)) {
          acc.push(user);
        }
        return acc;
      }, [] as User[]);
      console.log('重複除外後のusers:', uniqueUsers);
      console.log('重複除外後のusers数:', uniqueUsers.length);

      setAttendees(uniqueUsers);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  // ドラッグ開始
  const handleDragStart = (clientY: number) => {
    console.log('ドラッグ開始:', clientY);
    setIsDragging(true);
    setStartY(clientY);
    setCurrentY(clientY);
  };

  // ドラッグ中
  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    setCurrentY(clientY);
    const deltaY = clientY - startY;
    // ドラッグ量を制限（引っ張りすぎないように）
    const limitedDeltaY = Math.max(-150, Math.min(150, deltaY));
    setTranslateY(limitedDeltaY);
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 50; // 50px以上ドラッグしたらページ切り替え

    console.log('ドラッグ終了:', {
      deltaY,
      currentIndex,
      attendeesLength: attendees.length,
    });

    if (deltaY < -threshold) {
      // 上にスワイプ → 次のユーザー（最後の場合は最初に戻る）
      const nextIndex = (currentIndex + 1) % attendees.length;
      console.log('次のユーザーへ:', nextIndex);
      setCurrentIndex(nextIndex);
    } else if (deltaY > threshold) {
      // 下にスワイプ → 前のユーザー（最初の場合は最後に戻る）
      const prevIndex = (currentIndex - 1 + attendees.length) % attendees.length;
      console.log('前のユーザーへ:', prevIndex);
      setCurrentIndex(prevIndex);
    } else {
      console.log('スワイプ距離が不足:', deltaY);
    }

    // リセット
    setTranslateY(0);
    setStartY(0);
    setCurrentY(0);
  };

  // タッチイベント
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // マウスイベント
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

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
          <div className="relative space-y-2">
            {/* Live Info Card - 独立したカード */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-primary text-white rounded-lg px-3 py-2 text-center min-w-[70px]">
                  <div className="text-xs font-medium">{year}</div>
                  <div className="text-lg font-bold">{month}/{day}({weekday})</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{live.artist}</h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{live.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Ring Section - リングノート風デザイン */}
            <div className="relative" style={{ perspective: '1000px' }}>
              {/* リングの穴装飾 */}
              <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center gap-3 z-20 pointer-events-none">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-gray-900"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(255,255,255,0.3)',
                    }}
                  />
                ))}
              </div>

              {/* 次のページのプレビュー（下層） */}
              {!loading && attendees.length > 1 && (
                <div
                  className="absolute inset-0 bg-white rounded-2xl shadow-md"
                  style={{
                    top: '8px',
                    transform: 'translateY(4px) scale(0.98)',
                    opacity: 0.5,
                    zIndex: 5,
                  }}
                />
              )}

              {/* メインページコンテナ */}
              <div
                className="bg-white rounded-2xl shadow-xl overflow-hidden relative"
                style={{
                  height: '400px',
                  paddingTop: '2rem',
                  transformStyle: 'preserve-3d',
                  transform: isDragging
                    ? `translateY(${translateY}px) rotateX(${translateY * 0.2}deg)`
                    : 'translateY(0) rotateX(0deg)',
                  transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: 10,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
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
                <div className="relative h-full">
                  {/* 両方のカードを重ねて配置 */}

                  {/* 前のページ（アニメーション中のみ表示） */}
                  {isAnimating && attendees[prevIndex] && prevIndex !== currentIndex && (
                    <div
                      key={`prev-${prevIndex}`}
                      className="absolute inset-0 p-8 flex items-center justify-center"
                      style={{
                        cursor: 'grab',
                        transform: animationDirection === 'up'
                          ? 'translateY(-100%)'
                          : 'translateY(100%)',
                        opacity: 0,
                        transition: 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.4s ease-out',
                        zIndex: 5,
                      }}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div className="h-32 w-32 rounded-full bg-gradient-to-r from-primary to-blue-500 p-1">
                            <div className="h-full w-full rounded-full bg-white p-1">
                              <Avatar className="h-full w-full">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gray-400 text-white text-3xl">
                                  {attendees[prevIndex].name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">{attendees[prevIndex].name}</h3>
                          <p className="text-sm text-gray-500">@ {attendees[prevIndex].user_id}</p>
                        </div>
                        <SocialIcons
                          socialLinks={attendees[prevIndex].social_links}
                          onShare={() => handleShareClick(attendees[prevIndex].user_id)}
                        />
                      </div>
                    </div>
                  )}

                  {/* 現在のページ */}
                  {currentAttendee && (
                    <div
                      key={`current-${currentIndex}`}
                      className="absolute inset-0 p-8 flex items-center justify-center"
                      style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 1 - Math.abs(translateY) / 150 : 1,
                        transform: 'translateY(0)',
                        transition: isDragging ? 'none' : 'none',
                        animation: isAnimating
                          ? animationDirection === 'up'
                            ? 'slideInFromBottom 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)'
                            : 'slideInFromTop 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)'
                          : 'none',
                        zIndex: 10,
                      }}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div className="h-32 w-32 rounded-full bg-gradient-to-r from-primary to-blue-500 p-1">
                            <div className="h-full w-full rounded-full bg-white p-1">
                              <Avatar className="h-full w-full">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gray-400 text-white text-3xl">
                                  {currentAttendee.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">{currentAttendee.name}</h3>
                          <p className="text-sm text-gray-500">@ {currentAttendee.user_id}</p>
                        </div>
                        <SocialIcons
                          socialLinks={currentAttendee.social_links}
                          onShare={() => handleShareClick(currentAttendee.user_id)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* スワイプヒント（最初のユーザーのときのみ表示） */}
              {!loading && attendees.length > 1 && currentIndex === 0 && !isDragging && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 animate-pulse">
                  上にスワイプして次へ
                </div>
              )}
            </div>

              {/* Page Indicator */}
              {attendees.length > 1 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white/80 rounded-full px-2 py-2">
                  <div className="text-xs text-gray-600 font-medium">{currentIndex + 1}/{attendees.length}</div>
                  {/* ドットインジケーター */}
                  <div className="flex flex-col gap-1 mt-1">
                    {attendees.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
