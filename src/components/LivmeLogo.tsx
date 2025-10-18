import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import livmeLogo from 'figma:asset/68a436cefdb2137fc72b78d68469cab1e70052bc.png';

interface LivmeLogoProps {
  className?: string;
  fallbackClassName?: string;
}

export const LivmeLogo: React.FC<LivmeLogoProps> = ({ className, fallbackClassName }) => (
  <ImageWithFallback
    src={livmeLogo}
    alt="LIVME"
    className={`${className || "h-16 w-auto object-contain"} brightness-110`}
    fallback={
      <div className={fallbackClassName || "h-16 flex items-center justify-center"}>
        <div className="text-primary font-bold text-2xl tracking-wide">
          LIVME
        </div>
      </div>
    }
  />
);