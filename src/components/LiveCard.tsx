import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  socialLinks: {
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

interface LiveCardProps {
  live: Live;
  onJoin: () => void;
  onViewAttendees: () => void;
  onDelete: () => void;
  isJoined: boolean;
}

export function LiveCard({ live, onJoin, onViewAttendees, onDelete, isJoined }: LiveCardProps) {
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

  // 過去の公演かどうかを判定（昨日以前）
  const isPast = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return new Date(live.date) <= yesterday;
  };

  const isLivePast = isPast();
  const { year, dateInfo } = formatDate(live.date);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントを防ぐ
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full" // カード全体の幅を親コンテナいっぱいに
    >
      <div 
        className={`p-4 border-2 rounded-lg bg-card hover:bg-muted/20 transition-colors cursor-pointer relative w-full shadow-sm hover:shadow-md transition-shadow ${
          isLivePast ? 'border-gray-300 opacity-80' : 'border-primary'
        }`}
        onClick={onViewAttendees}
      >
        <div className="flex items-center gap-4 w-full">
          {/* Date Display */}
          <div className="flex-shrink-0">
            <div className={`px-4 py-3 rounded-xl text-center min-w-[85px] shadow-sm ${
              isLivePast 
                ? 'bg-gray-300 text-gray-600' 
                : 'bg-primary text-primary-foreground'
            }`}>
              <div className="text-xs opacity-80 leading-tight font-medium">{year}</div>
              <div className="text-sm font-bold leading-tight">{dateInfo}</div>
            </div>
          </div>

          {/* Live Info - 右側まで拡張 */}
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-semibold text-base mb-1.5 truncate leading-tight">{live.artist}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate font-medium">{live.venue}</span>
            </div>
          </div>

          {/* Three-dot Menu */}
          <div className="flex-shrink-0" onClick={handleMenuClick}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-muted/50 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}