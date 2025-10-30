import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Live } from '../types';

interface LiveCardProps {
  live: Live;
  isOwner: boolean;
  onEdit?: (live: Live) => void;
  onDelete?: (liveId: string) => void;
  onClick?: (live: Live) => void;
}

export const LiveCard: React.FC<LiveCardProps> = ({
  live,
  isOwner,
  onEdit,
  onDelete,
  onClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const date = new Date(live.date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

  return (
    <Card className="bg-white border border-primary/30 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick?.(live)}>
      <CardContent className="h-[81px] px-4 flex items-center">
        <div className="flex items-center gap-4 w-full">
          {/* Date Badge */}
          <div className="flex-shrink-0 bg-primary text-white rounded-lg px-3 py-1.5 text-center min-w-[70px] flex flex-col justify-center">
            <div className="text-xs font-medium leading-tight">{year}</div>
            <div className="text-lg font-bold leading-tight">{month}/{day}({weekday})</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{live.artist}</h3>
            <div className="flex items-center gap-1 text-gray-600 text-xs mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{live.venue}</span>
            </div>
          </div>

          {/* Menu Button */}
          {isOwner && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="メニュー"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                    <button
                      onClick={() => {
                        onEdit?.(live);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      編集
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(live.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
