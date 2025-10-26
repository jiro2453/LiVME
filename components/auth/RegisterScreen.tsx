import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/useToast';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const validateUserId = (id: string): boolean => {
    const regex = /^[a-zA-Z0-9_-]{3,30}$/;
    return regex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🟢 Register form submitted', { email, name, userId });

    if (password !== confirmPassword) {
      console.warn('⚠️ Password mismatch');
      toast({
        title: 'エラー',
        description: 'パスワードが一致しません',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      console.warn('⚠️ Password too short');
      toast({
        title: 'エラー',
        description: 'パスワードは8文字以上である必要があります',
        variant: 'destructive',
      });
      return;
    }

    if (!validateUserId(userId)) {
      console.warn('⚠️ Invalid userId format');
      toast({
        title: 'エラー',
        description: 'ユーザーIDは英数字・ハイフン・アンダースコアのみ、3-30文字で入力してください',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🟢 Calling signUp...');
      await signUp(email, password, name, userId);
      console.log('✅ Signup successful');
      toast({
        title: '登録完了',
        description: 'アカウントが作成されました',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      toast({
        title: '登録に失敗しました',
        description: error.message || '登録中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      console.log('🟢 Signup attempt finished');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      {/* ロゴ */}
      <div className="mb-8">
        <img
          src="/LiVME_2.png"
          alt="LiVME Logo"
          className="h-16 w-auto"
          onError={(e) => {
            // 画像が見つからない場合のフォールバック
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        {/* フォールバックテキスト */}
        <h1 className="text-4xl font-bold text-primary" style={{ display: 'none' }}>
          LiVME
        </h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>新規登録</CardTitle>
          <CardDescription>新しいアカウントを作成してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">ユーザーID</Label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="yamada_taro"
                required
              />
              <p className="text-gray-500">
                英数字・ハイフン・アンダースコアのみ、3-30文字
              </p>
            </div>

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
              <p className="text-gray-500">8文字以上</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '登録'}
            </Button>

            <div className="text-center text-gray-600">
              既にアカウントをお持ちの方は
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline ml-1"
              >
                ログイン
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
