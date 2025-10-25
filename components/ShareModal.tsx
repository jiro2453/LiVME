import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, userId }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/?profile=${userId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'コピーしました',
        description: 'URLをクリップボードにコピーしました',
        variant: 'success',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'URLのコピーに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleTwitterShare = () => {
    const text = `私のプロフィールをチェック！`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLineShare = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>プロフィール共有</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">プロフィールURL</p>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-600">SNSでシェア</p>
            <div className="flex gap-2">
              <Button onClick={handleTwitterShare} className="flex-1">
                X (Twitter)
              </Button>
              <Button onClick={handleLineShare} className="flex-1">
                LINE
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
