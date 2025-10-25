import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { LogOut, User, Mail } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'ログアウトしました',
        variant: 'success',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: error.message || 'ログアウトに失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Info */}
          <div className="space-y-3 py-4 border-b">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-500">ユーザーID</p>
                <p className="font-medium">@{user?.user_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-500">メールアドレス</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              variant="outline"
              className="w-full justify-start"
            >
              プロフィール編集
            </Button>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>

          {/* Version Info */}
          <div className="text-center text-gray-500 pt-4 border-t">
            <p>LIVME v1.0.0</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
