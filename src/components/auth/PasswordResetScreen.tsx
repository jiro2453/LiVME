import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { LivmeLogo } from '../LivmeLogo';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

interface PasswordResetScreenProps {
  onBack: () => void;
}

export function PasswordResetScreen({ onBack }: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('パスワードリセットメールを送信しました');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('パスワードリセットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-background flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md p-8 text-center">
          {/* Logo */}
          <motion.div 
            className="text-center mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-4">
              <LivmeLogo className="h-16 w-auto object-contain mx-auto" />
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-8 h-8 text-green-600" />
          </motion.div>
          
          <h1 className="text-xl font-medium mb-4">メールを送信しました</h1>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            {email} にパスワードリセット用のメールを送信しました。
            メールに記載されたリンクからパスワードを再設定してください。
          </p>
          
          <div className="space-y-3">
            <Button onClick={onBack} className="w-full">
              ログイン画面に戻る
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSent(false)}
              className="w-full"
            >
              メールアドレスを変更
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4">
            <LivmeLogo className="h-16 w-auto object-contain mx-auto" />
          </div>
        </motion.div>

        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-medium ml-2">パスワードリセット</h1>
        </div>

        <p className="text-muted-foreground mb-6 text-sm">
          登録時のメールアドレスを入力してください。
          パスワードリセット用のリンクをお送りします。
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                送信中...
              </>
            ) : (
              'リセットメールを送信'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={onBack}
            className="text-sm text-muted-foreground"
          >
            ログイン画面に戻る
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}