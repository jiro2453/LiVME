import { useState, useEffect, useCallback } from 'react';
import { fetchUser, updateUser as apiUpdateUser } from '../lib/api';
import { User } from '../types';

export function useUser(userId: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError('ユーザーIDが指定されていません');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchUser(userId);
      if (data) {
        setUser(data);
      } else {
        setError('ユーザーが見つかりません');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('ユーザーデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが指定されていません' };
    }

    try {
      const result = await apiUpdateUser(userId, userData);
      if (result.success) {
        // データを再取得して UI を更新
        await fetchData();
      }
      return result;
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: 'ユーザー更新に失敗しました' };
    }
  }, [userId, fetchData]);

  return {
    user,
    loading,
    error,
    updateUser,
    refetch: fetchData
  };
}