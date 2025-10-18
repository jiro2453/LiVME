import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import livmeLogo from 'figma:asset/bc15bef08422d2c98ec5149c449c876bd727d060.png';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl: string;
  userName: string;
  userAvatar: string;
  userUserId?: string;
}

export function ShareModal({ isOpen, onClose, profileUrl, userName, userAvatar, userUserId }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);

  // QR code generation with logo overlay using QR Server API
  const getQRCodeUrl = (text: string) => {
    const encodedText = encodeURIComponent(text);
    // Using QR Server API with logo overlay capability
    const logoUrl = encodeURIComponent(livmeLogo);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}&format=png&margin=10&qzone=1&logo=${logoUrl}`;
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('URLをコピーしました！');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('URLをコピーしました！');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-card rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full w-8 h-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-6">
              <h3 className="font-medium text-card-foreground mb-1">{userName}</h3>
              {userUserId && (
                <p className="text-sm text-muted-foreground">@{userUserId}</p>
              )}
            </div>

            {/* QR Code with Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative bg-white p-4 rounded-lg shadow-sm border border-border">
                <img
                  src={getQRCodeUrl(profileUrl)}
                  alt="プロフィールQRコード"
                  className="w-48 h-48 block"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Fallback logo overlay if API doesn't support logo parameter */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-lg shadow-sm" style={{ 
                    width: '50px', 
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}>
                    <img
                      src={livmeLogo}
                      alt="LIVME"
                      className="object-contain"
                      style={{ 
                        filter: 'brightness(1.1)',
                        width: '35px',
                        height: '35px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <Button
              onClick={handleCopyUrl}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-12"
              disabled={copied}
            >
              <motion.div
                className="flex items-center justify-center gap-2"
                initial={false}
                animate={{ scale: copied ? 0.95 : 1 }}
                transition={{ duration: 0.1 }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>コピー完了！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>URLをコピー</span>
                  </>
                )}
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}