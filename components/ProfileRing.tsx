import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { User } from 'lucide-react';

interface ProfileRingProps {
  avatarUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfileRing: React.FC<ProfileRingProps> = ({
  avatarUrl,
  name,
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-primary to-blue-500 p-1`}>
        <div className="h-full w-full rounded-full bg-white p-1">
          <Avatar className="h-full w-full">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};
