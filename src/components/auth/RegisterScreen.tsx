import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, MessageSquare, ArrowRight, Settings, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { LivmeLogo } from '../LivmeLogo';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const [step, setStep] = useState(1); // 1: Account Info, 2: Profile Info
  
  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile info
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userIdError, setUserIdError] = useState('');
  const [isCheckingUserId, setIsCheckingUserId] = useState(false);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [needsAuthEnabled, setNeedsAuthEnabled] = useState(false);

  const { signUp, isMockMode } = useAuth();

  // Countdown timer for rate limiting
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isRateLimit && countdown === 0) {
      setIsRateLimit(false);
      setWaitTime(0);
    }
    return () => clearTimeout(timer);
  }, [countdown, isRateLimit]);

  const validateStep1 = () => {
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return false;
    }
    if (!email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }
    if (!password.trim()) {
      setError('パスワードを入力してください');
      return false;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return false;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }
    return true;
  };

  const validateUserId = (value: string) => {
    if (!value) {
      return false; // 空の場合はエラー（必須フィールド）
    }
    
    // 英数字、アンダースコア、ハイフンのみ許可
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(value)) {
      return false;
    }
    
    // 長さチェック（3-20文字）
    if (value.length < 3 || value.length > 20) {
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!name.trim()) {
      setError('名前を入力してください');
      return false;
    }
    
    if (!userId.trim()) {
      setError('ユーザーIDを入力してください');
      return false;
    }
    
    if (!validateUserId(userId)) {
      setError('ユーザーIDは3-20文字の英数字、アンダースコア、ハイフンのみ使用できます');
      return false;
    }
    
    if (userIdError) {
      setError('ユーザーIDの問題を解決してください');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mock mode handling (not implemented in this version)
    if (isMockMode) {
      if (!validateStep2()) return;
      
      setLoading(true);
      try {
        // Mock mode is not implemented in the current AuthContext
        setError('Mock mode is not implemented');
      } catch (error) {
        setError('アカウント作成に失敗しました');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Step 1: Move to next step
    if (step === 1) {
      handleNextStep();
      return;
    }

    // Step 2: Create account
    if (!validateStep2()) return;
    
    setLoading(true);
    setNeedsAuthEnabled(false);
    try {
      console.log('📝 Starting account creation...');
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Bio:', bio);
      
      const result = await signUp(email.trim(), password, {
        name: name.trim(),
        user_id: userId.trim(),
        bio: bio.trim(),
        avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
        socialLinks: {}
      });

      console.log('🔍 SignUp result:', result);
      
      if (!result.success) {
        console.error('❌ Account creation failed:', result.error);
        if (result.error?.includes('メール認証での新規登録が無効')) {
          setNeedsAuthEnabled(true);
          setError('');
        } else if (result.isRateLimit) {
          setIsRateLimit(true);
          setWaitTime(result.waitTime || 60);
          setCountdown(result.waitTime || 60);
          setError('');
        } else {
          setError(result.error || 'アカウント作成に失敗しました');
        }
      } else {
        console.log('✅ Account created successfully');
        // Success is handled by AuthContext - user will be automatically logged in
      }
    } catch (error) {
      console.error('❌ Account creation error:', error);
      setError('アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="mb-4">
              <LivmeLogo className="h-20 w-auto object-contain mx-auto" />
            </div>
            <h1 className="text-xl font-medium text-foreground mb-2">
              {isMockMode ? 'プロフィール作成' : step === 1 ? 'アカウント作成' : 'プロフィール設定'}
            </h1>
            {(isMockMode || step === 2) && (
              <p className="text-sm text-muted-foreground">
                {isMockMode 
                  ? 'あなたのプロフィールを設定しましょう'
                  : 'プロフィール情報を入力してください'
                }
              </p>
            )}
          </motion.div>

          {/* Progress Indicator (Non-mock mode only) */}
          {!isMockMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>アカウント</span>
                <span>プロフィール</span>
              </div>
            </motion.div>
          )}

          {/* Mock Mode Notice */}
          {isMockMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>開発モード</strong><br />
                プロフィール情報のみで開始できます
              </div>
            </motion.div>
          )}

          {/* Authentication Disabled Notice */}
          {needsAuthEnabled && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                    メール認証での新規登録が無効になっています
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Supabaseの設定でメール認証を有効化する必要があります：
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                      <div className="space-y-1">
                        <div>1. Authentication → Settings を開く</div>
                        <div>2. 「Enable email signups」をON</div>
                        <div>3. 「Enable email logins」をON</div>
                        <div>4. 設定を保存してページを再読み込み</div>
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

          {/* Rate Limit Notice */}
          {isRateLimit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    セキュリティ制限中
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    セキュリティのため、一定時間待ってから再試行してください。
                  </div>
                  <div className="text-lg font-mono text-blue-800 dark:text-blue-200">
                    残り時間: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && !isRateLimit && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Register Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {(!isMockMode && step === 1) && (
              <>
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    パスワード
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="6文字以上のパスワード"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    パスワード確認
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="パスワードを再入力"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12"
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {(isMockMode || step === 2) && (
              <>
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    名前 *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="あなたの名前"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* User ID Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    ユーザーID *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      @
                    </div>
                    <Input
                      type="text"
                      placeholder="username123"
                      value={userId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUserId(value);
                        setUserIdError('');
                        
                        if (!validateUserId(value)) {
                          if (!value) {
                            setUserIdError('ユーザーIDは必須です');
                          } else {
                            setUserIdError('3-20文字の英数字、アンダースコア、ハイフンのみ');
                          }
                        }
                      }}
                      className={`pl-8 h-12 ${userIdError ? 'border-red-500' : ''}`}
                      disabled={loading || isCheckingUserId}
                    />
                    {isCheckingUserId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {userIdError && (
                    <p className="text-xs text-red-500 mt-1">{userIdError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-20文字、半角英数字とアンダースコアのみ
                  </p>
                </div>

                {/* Bio Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    自己紹介（任意）
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <textarea
                      placeholder="音楽の趣味や好きなアーティストなど..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full pl-10 p-3 border rounded-lg resize-none bg-background"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              {!isMockMode && step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full h-12"
                  disabled={loading}
                >
                  戻る
                </Button>
              )}

              <Button
                type="submit"
                disabled={loading || isRateLimit}
                className="w-full h-12"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isMockMode ? '作成中...' : step === 1 ? '次へ...' : 'アカウント作成中...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isMockMode ? '開始する' : step === 1 ? '次へ' : 'アカウント作成'}
                    {!loading && step === 1 && !isMockMode && <ArrowRight className="w-4 h-4" />}
                  </div>
                )}
              </Button>
            </div>
          </motion.form>

          {/* Toggle to Login */}
          {!isMockMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-muted-foreground">
                すでにアカウントをお持ちの方は{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  ログイン
                </button>
              </p>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-border text-center"
          >
            <p className="text-xs text-muted-foreground">
              LIVME で音楽体験を共有しよう 🎵
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}