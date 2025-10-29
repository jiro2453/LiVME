import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { SocialIcons } from './SocialIcons';
import { ShareModal } from './ShareModal';
import { X, MapPin } from 'lucide-react';
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

      setAttendees(filteredUsers);
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
    setTranslateY(deltaY);
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

    if (deltaY < -threshold && currentIndex < attendees.length - 1) {
      // 上にスワイプ → 次のユーザー
      console.log('次のユーザーへ:', currentIndex + 1);
      setCurrentIndex(prev => prev + 1);
    } else if (deltaY > threshold && currentIndex > 0) {
      // 下にスワイプ → 前のユーザー
      console.log('前のユーザーへ:', currentIndex - 1);
      setCurrentIndex(prev => prev - 1);
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
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full z-50"
              aria-label="閉じる"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Live Info Card */}
            <div className="bg-white rounded-t-2xl p-4 shadow-lg">
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

            {/* Profile Ring Section - ドラッグ可能 */}
            <div
              className="bg-white rounded-b-2xl shadow-lg overflow-hidden relative"
              style={{ height: '400px' }}
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
              ) : currentAttendee ? (
                <div
                  className={`p-8 h-full flex items-center justify-center ${
                    isDragging ? '' : 'transition-transform duration-300 ease-out'
                  }`}
                  style={{
                    transform: `translateY(${translateY}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                >
                  <div className="flex flex-col items-center space-y-4">
                    {/* Profile Ring */}
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

                    {/* User Info */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">{currentAttendee.name}</h3>
                      <p className="text-sm text-gray-500">@ {currentAttendee.user_id}</p>
                    </div>

                    {/* Social Icons */}
                    <SocialIcons
                      socialLinks={currentAttendee.social_links}
                      onShare={() => handleShareClick(currentAttendee.user_id)}
                    />
                  </div>
                </div>
              ) : null}

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
