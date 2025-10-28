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

  useEffect(() => {
    if (isOpen && attendeeUserIds.length > 0) {
      loadAttendees();
    }
  }, [isOpen, attendeeUserIds]);

  const loadAttendees = async () => {
    setLoading(true);
    try {
      const users = await Promise.all(
        attendeeUserIds.map(userId => getUserByUserId(userId))
      );
      setAttendees(users.filter(u => u !== null) as User[]);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = element.scrollTop / (element.scrollHeight - element.clientHeight);
    const newIndex = Math.round(scrollPercentage * (attendees.length - 1));
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < attendees.length) {
      setCurrentIndex(newIndex);
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

            {/* Profile Ring Section */}
            <div
              className="bg-white rounded-b-2xl shadow-lg overflow-y-auto"
              style={{ maxHeight: '400px' }}
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center p-12 text-gray-500">
                  参加者がいません
                </div>
              ) : (
                <div className="space-y-0">
                  {attendees.map((attendee, index) => (
                    <div
                      key={attendee.id}
                      className={`p-8 transition-opacity ${
                        index === currentIndex ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        {/* Profile Ring */}
                        <div className="relative">
                          <div className="h-32 w-32 rounded-full bg-gradient-to-r from-primary to-blue-500 p-1">
                            <div className="h-full w-full rounded-full bg-white p-1">
                              <Avatar className="h-full w-full">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gray-400 text-white text-3xl">
                                  {attendee.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">{attendee.name}</h3>
                          <p className="text-sm text-gray-500">@ {attendee.user_id}</p>
                        </div>

                        {/* Social Icons */}
                        <SocialIcons
                          socialLinks={attendee.social_links}
                          onShare={() => handleShareClick(attendee.user_id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scroll Indicator */}
            {attendees.length > 1 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white/80 rounded-full px-1 py-2">
                <div className="text-xs text-gray-600">{currentIndex + 1}/{attendees.length}</div>
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
