import React from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import instagramIcon from 'figma:asset/2701450987b923309cd46b9ff536dccf8b5279ef.png';
import xIcon from 'figma:asset/60334a3695e4d7c94f8800699c7f2b365f0951d9.png';
import tiktokIcon from 'figma:asset/69e18633047e5c183db56b8e6c727deeaf5b843c.png';

// SNSアイコンコンポーネント（編集フォーム用）
export const InstagramIcon = () => (
  <div 
    className="w-7 h-7 flex-shrink-0 bg-transparent border-0 shadow-none"
    style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
  >
    <ImageWithFallback
      src={instagramIcon}
      alt="Instagram"
      className="w-full h-full object-contain bg-transparent"
      style={{ backgroundColor: 'transparent' }}
    />
  </div>
);

export const TwitterIcon = () => (
  <div 
    className="w-7 h-7 flex-shrink-0 bg-transparent border-0 shadow-none"
    style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
  >
    <ImageWithFallback
      src={xIcon}
      alt="X (Twitter)"
      className="w-full h-full object-contain bg-transparent"
      style={{ backgroundColor: 'transparent' }}
    />
  </div>
);

export const TikTokIcon = () => (
  <div 
    className="w-7 h-7 flex-shrink-0 bg-transparent border-0 shadow-none"
    style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
  >
    <ImageWithFallback
      src={tiktokIcon}
      alt="TikTok"
      className="w-full h-full object-contain bg-transparent"
      style={{ backgroundColor: 'transparent' }}
    />
  </div>
);