import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/useToast';

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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>アカウントにログインしてください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={onSwitchToReset}
                className="text-primary hover:underline"
              >
                パスワードを忘れた方
              </button>

              <div className="text-gray-600">
                アカウントをお持ちでない方は
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-primary hover:underline ml-1"
                >
                  新規登録
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
