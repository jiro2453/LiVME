import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/useToast';
import { Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToRegister,
  onSwitchToReset,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔵 Login form submitted', { email });

    setLoading(true);

    try {
      console.log('🔵 Calling signIn...');
      await signIn(email, password);
      console.log('✅ Login successful');
      toast({
        title: 'ログインしました',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      toast({
        title: 'ログインに失敗しました',
        description: error.message || 'メールアドレスまたはパスワードが正しくありません',
        variant: 'destructive',
      });
    } finally {
      console.log('🔵 Login attempt finished');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-12 pb-12 px-10">
          {/* ロゴ */}
          <div className="flex justify-center mb-8">
            <img
              src="/LiVME_2.png"
              alt="LiVME Logo"
              className="h-20 w-auto"
            />
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-center mb-12">ログイン</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* メールアドレス */}
            <div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                required
                className="bg-yellow-50 border-yellow-100 focus:border-primary focus:ring-primary"
              />
            </div>

            {/* パスワード */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                className="bg-yellow-50 border-yellow-100 focus:border-primary focus:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* ログインボタン */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium mt-10"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>

            {/* パスワードを忘れた方 */}
            <div className="text-center pt-6">
              <button
                type="button"
                onClick={onSwitchToReset}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                パスワードを忘れた方はこちら
              </button>
            </div>

            {/* 新規登録 */}
            <div className="text-center text-sm text-gray-600 pt-4">
              アカウントをお持ちでない方は{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:underline font-medium"
              >
                新規登録
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
