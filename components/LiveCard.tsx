import React from 'react';
import { Card, CardContent } from './ui/card';
import { Pencil, Trash2, MapPin, Calendar } from 'lucide-react';
import type { Live } from '../types';
import { isPastLive, formatDate } from '../utils/liveGrouping';

interface LiveCardProps {
  live: Live;
  isOwner: boolean;
  onEdit?: (live: Live) => void;
  onDelete?: (liveId: string) => void;
}

export const LiveCard: React.FC<LiveCardProps> = ({
  live,
  isOwner,
  onEdit,
  onDelete,
}) => {
  const isPast = isPastLive(live.date);
  const bgColor = isPast ? 'bg-gray-50' : 'bg-green-50';
  const borderColor = isPast ? 'border-gray-200' : 'border-green-200';

  return (
    <Card className={`${bgColor} ${borderColor} border-2`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold">{live.artist}</h3>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(live)}
                  className="text-gray-600 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete?.(live.id)}
                  className="text-gray-600 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1 text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(live.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{live.venue}</span>
            </div>

            {live.description && (
              <div className="mt-2 text-gray-600">
                <p>{live.description}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
