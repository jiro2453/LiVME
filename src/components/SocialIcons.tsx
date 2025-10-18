import React from 'react';
import { motion } from 'framer-motion';
import { Share } from 'lucide-react';
import { User as UserType } from '../types';
import instagramIcon from 'figma:asset/2701450987b923309cd46b9ff536dccf8b5279ef.png';
import xIcon from 'figma:asset/60334a3695e4d7c94f8800699c7f2b365f0951d9.png';
import tiktokIcon from 'figma:asset/69e18633047e5c183db56b8e6c727deeaf5b843c.png';

interface SocialIconsProps {
  user: UserType;
  onShareProfile?: () => void;
}

export const SocialIcons: React.FC<SocialIconsProps> = ({ user, onShareProfile }) => {
  return (
    <div className="flex justify-center gap-4 mb-3">
      {user.socialLinks?.instagram && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          onClick={() => window.open(`https://instagram.com/${user.socialLinks.instagram?.replace('@', '')}`, '_blank')}
          style={{ 
            all: 'unset',
            cursor: 'pointer',
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
        </motion.div>
      )}
      {user.socialLinks?.twitter && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          onClick={() => window.open(`https://twitter.com/${user.socialLinks.twitter?.replace('@', '')}`, '_blank')}
          style={{ 
            all: 'unset',
            cursor: 'pointer',
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
        </motion.div>
      )}
      {user.socialLinks?.tiktok && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          onClick={() => window.open(`https://tiktok.com/${user.socialLinks.tiktok?.replace('@', '')}`, '_blank')}
          style={{ 
            all: 'unset',
            cursor: 'pointer',
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
        </motion.div>
      )}
      {/* Share Button */}
      {user.user_id && onShareProfile && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-full bg-primary flex items-center justify-center text-white cursor-pointer"
          style={{
            width: '35px',
            height: '35px'
          }}
          onClick={onShareProfile}
          title="プロフィールをシェア"
        >
          <Share className="w-5 h-5" />
        </motion.div>
      )}
    </div>
  );
};