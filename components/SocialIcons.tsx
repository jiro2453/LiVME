import React from 'react';
import { Share } from 'lucide-react';
import { Icons } from './assets/Icons';

interface SocialIconsProps {
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  onShare?: () => void;
}

export const SocialIcons: React.FC<SocialIconsProps> = ({ socialLinks, onShare }) => {
  const handleSocialClick = (platform: string, username?: string) => {
    if (!username) return;

    const urls = {
      instagram: `https://instagram.com/${username.replace('@', '')}`,
      twitter: `https://x.com/${username.replace('@', '')}`,
      tiktok: `https://tiktok.com/@${username.replace('@', '')}`,
    };

    window.open(urls[platform as keyof typeof urls], '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {socialLinks?.instagram && (
        <button
          onClick={() => handleSocialClick('instagram', socialLinks.instagram)}
          className="hover:opacity-80 transition-opacity"
          aria-label="Instagram"
        >
          <img src={Icons.instagram} alt="Instagram" className="h-8 w-8" />
        </button>
      )}

      {socialLinks?.twitter && (
        <button
          onClick={() => handleSocialClick('twitter', socialLinks.twitter)}
          className="hover:opacity-80 transition-opacity"
          aria-label="X (Twitter)"
        >
          <img src={Icons.x} alt="X" className="h-8 w-8" />
        </button>
      )}

      {socialLinks?.tiktok && (
        <button
          onClick={() => handleSocialClick('tiktok', socialLinks.tiktok)}
          className="hover:opacity-80 transition-opacity"
          aria-label="TikTok"
        >
          <img src={Icons.tiktok} alt="TikTok" className="h-8 w-8" />
        </button>
      )}

      {onShare && (
        <button
          onClick={onShare}
          className="hover:opacity-80 transition-opacity text-primary"
          aria-label="Share"
        >
          <Share className="h-8 w-8" />
        </button>
      )}
    </div>
  );
};
