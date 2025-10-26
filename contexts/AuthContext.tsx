import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching user profile for:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        throw error;
      }

      if (data) {
        console.log('✅ User profile fetched:', { name: data.name, user_id: data.user_id });
        setUser(data);
        setUserProfile(data);
      } else {
        console.warn('⚠️ No user profile found for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting login with:', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error);

      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('メールアドレスまたはパスワードが間違っています');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('メールアドレスの確認が必要です。Supabase設定で「Confirm email」をOFFにしてください。');
      } else {
        throw new Error(`ログインエラー: ${error.message}`);
      }
    }

    console.log('✅ Login successful:', data.user?.id);

    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, name: string, userId: string) => {
    console.log('📝 Attempting signup with:', { email, name, userId });

    // First, sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Signup error (auth):', authError);

      // Provide user-friendly error messages
      if (authError.message.includes('User already registered')) {
        throw new Error('このメールアドレスは既に登録されています');
      } else if (authError.message.includes('Password should be at least')) {
        throw new Error('パスワードは6文字以上にしてください');
      } else if (authError.message.includes('Unable to validate email')) {
        throw new Error('メールアドレスの形式が正しくありません');
      } else {
        throw new Error(`アカウント作成エラー: ${authError.message}`);
      }
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      throw new Error('ユーザー作成に失敗しました');
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create user profile
    console.log('📝 Creating user profile in database...');
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        user_id: userId,
        bio: '未設定',
        images: [],
        social_links: {},
      });

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);

      // Provide user-friendly error messages
      if (profileError.message.includes('duplicate key')) {
        throw new Error('このユーザーIDは既に使用されています');
      } else if (profileError.message.includes('violates foreign key')) {
        throw new Error('データベース接続エラー。テーブルが正しく作成されているか確認してください。');
      } else {
        throw new Error(`プロフィール作成エラー: ${profileError.message}`);
      }
    }

    console.log('✅ User profile created successfully');

    // Fetch the newly created profile
    await fetchUserProfile(authData.user.id);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      setUser(data);
      setUserProfile(data);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
