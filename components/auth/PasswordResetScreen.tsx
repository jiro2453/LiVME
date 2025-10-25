import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/useToast';

interface PasswordResetScreenProps {
  onSwitchToLogin: () => void;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: '送信完了',
        description: 'パスワードリセット用のメールを送信しました',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: '送信に失敗しました',
        description: error.message || 'メール送信中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>パスワードリセット</CardTitle>
          <CardDescription>
            パスワードをリセットするためのメールを送信します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                パスワードリセット用のメールを送信しました。メール内のリンクをクリックして、新しいパスワードを設定してください。
              </p>
              <Button onClick={onSwitchToLogin} className="w-full">
                ログイン画面に戻る
              </Button>
            </div>
          ) : (
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '送信中...' : 'リセットメールを送信'}
              </Button>

              <div className="text-center text-gray-600">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline"
                >
                  ログイン画面に戻る
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
