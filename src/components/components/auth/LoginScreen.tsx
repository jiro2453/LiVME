import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { LivmeLogo } from '../LivmeLogo';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

export function LoginScreen({ onSwitchToRegister, onSwitchToReset }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [needsAuthEnabled, setNeedsAuthEnabled] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  
  const { signIn, resendConfirmation } = useAuth();

  // コンポーネントマウント時にフォームをクリアし、ブラウザの自動入力を防ぐ
  React.useEffect(() => {
    // フィールドを確実にクリア
    setEmail('');
    setPassword('');
    
    // ブラウザのAutofillを無効化するため、少し遅延してからクリア
    const timer = setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      
      if (emailInput) {
        emailInput.value = '';
        emailInput.autocomplete = 'new-email';
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.autocomplete = 'new-password';
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setNeedsEmailConfirmation(false);
    setNeedsAuthEnabled(false);
    
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        if (result.requiresEmailConfirmation || result.error?.includes('メールアドレスの確認が必要')) {
          setNeedsEmailConfirmation(true);
        } else if (result.error?.includes('メール認証が無効になっています')) {
          setNeedsAuthEnabled(true);
        } else {
          toast.error(result.error || 'ログインに失敗しました');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setResendingConfirmation(true);
    try {
      const result = await resendConfirmation(email);
      if (!result.success) {
        toast.error(result.error || '確認メールの再送信に失敗しました');
      }
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast.error('確認メールの再送信に失敗しました');
    } finally {
      setResendingConfirmation(false);
    }
  };

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
            <LivmeLogo className="h-20 w-auto mx-auto object-contain" />
          </div>
          <h1 className="text-2xl font-medium text-foreground">
            ログイン
          </h1>
        </motion.div>

        {/* Authentication Disabled Notice */}
        {needsAuthEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                  メール認証が無効になっています
                </div>
                <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Supabaseの設定でメール認証を有効化する必要があります。以下の手順に従ってください：
                </div>
                <div className="space-y-2">
                  <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                    <div className="space-y-1">
                      <div>1. Authentication → Settings を開く</div>
                      <div>2. 「Enable email signups」をON</div>
                      <div>3. 「Enable email logins」をON</div>
                      <div>4. 設定を保存する</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/fgvmbdxayjasmlwrylup/auth/settings', '_blank')}
                    className="w-full border-red-300 text-red-800 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-900/40"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Supabase認証設定を開く
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email Confirmation Notice */}
        {needsEmailConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  メールアドレスの確認が必要です
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  登録時に送信された確認メールのリンクをクリックして、アカウントを有効化してください。
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  disabled={resendingConfirmation || !email.trim()}
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
                >
                  {resendingConfirmation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      確認メールを再送信
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              disabled={loading}
              autoComplete="new-email"
              autoFocus={false}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pr-12"
              disabled={loading}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </motion.div>
        </form>

        {/* Password Reset Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <Button
            variant="link"
            onClick={onSwitchToReset}
            className="text-sm text-muted-foreground hover:text-primary"
            disabled={loading}
          >
            パスワードを忘れた方はこちら
          </Button>
        </motion.div>

        {/* Register Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は{' '}
            <Button
              variant="link"
              onClick={onSwitchToRegister}
              className="p-0 h-auto text-primary font-medium"
              disabled={loading}
            >
              新規登録
            </Button>
          </p>
        </motion.div>
      </Card>
    </motion.div>
  );
}