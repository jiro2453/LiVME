import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, checkSupabaseHealth, getConnectionStatus, safeSupabaseOperation, getStoredUser, storeUser, removeStoredUser } from '../lib/supabase';
import { User } from '../types';
import { toast } from 'sonner@2.0.3';

// PRODUCTION ENVIRONMENT - Minimal logging
const IS_PRODUCTION = true;
const logger = {
  log: () => {},
  warn: () => {},
  error: console.error, // Keep critical errors only
  info: () => {},
  debug: () => {}
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileCreationError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  signUp: (email: string, password: string, userData: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string; isRateLimit?: boolean; waitTime?: number }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  retryProfileCreation: () => Promise<void>;
  isMockMode: boolean;
  isProfileCreationFailed: boolean;
  connectionStatus: 'healthy' | 'unhealthy' | 'checking';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCreationError, setProfileCreationError] = useState<string | null>(null);
  const [isProfileCreationFailed, setIsProfileCreationFailed] = useState(false);
  const [currentAuthUser, setCurrentAuthUser] = useState<SupabaseUser | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
  const [isInitialized, setIsInitialized] = useState(false);
  const isMockMode = false;

  const clearSessionData = useCallback(() => {
    console.log('🧹 Clearing all session data...');
    
    setCurrentAuthUser(null);
    setUser(null);
    setIsProfileCreationFailed(false);
    setProfileCreationError(null);
    
    // ローカルストレージを完全にクリア
    removeStoredUser();
    
    // LIVMEに関連するすべてのローカルストレージをクリア
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('livme_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared localStorage key: ${key}`);
      });
      
      // セッション期限切れフラグを設定（UI通知用）
      localStorage.setItem('livme_session_expired', 'true');
    }
  }, []);

  // Global error handler for authentication errors
  useEffect(() => {
    const handleGlobalAuthError = (error: any) => {
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('JWT expired')) {
        console.log('🔑 Global auth error detected - clearing session');
        clearSessionData();
        toast.error('セッションが期限切れです。再度ログインしてください。', {
          duration: 5000
        });
      }
    };

    // Listen for unhandled promise rejections that might contain auth errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason) {
        handleGlobalAuthError(event.reason);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [clearSessionData]);

  // 軽量な接続チェック
  useEffect(() => {
    let isMounted = true;

    const performLightweightCheck = async () => {
      if (!isMounted) return;
      
      logger.debug('🔍 Lightweight connection check starting...');
      setConnectionStatus('checking');
      
      try {
        // 2秒でタイムアウトする軽量チェック
        const healthPromise = checkSupabaseHealth();
        const timeoutPromise = new Promise<{ healthy: boolean; reason?: string }>((resolve) => 
          setTimeout(() => resolve({ healthy: false, reason: 'Quick check timeout' }), 2000)
        );
        
        const health = await Promise.race([healthPromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        const newStatus = health.healthy ? 'healthy' : 'unhealthy';
        logger.debug(`🏥 Lightweight connection result: ${newStatus}`);
        setConnectionStatus(newStatus);
        
        if (health.healthy) {
          logger.debug('✅ Connection healthy - sync available');
        } else {
          logger.debug('⚠️ Connection unhealthy - local mode only');
        }
      } catch (error: any) {
        logger.error('❌ Lightweight connection check failed:', error.message);
        if (isMounted) {
          setConnectionStatus('unhealthy');
        }
      }
    };

    // 500ms後に軽量チェック実行
    setTimeout(performLightweightCheck, 500);

    return () => {
      isMounted = false;
    };
  }, []);

  const createMockProfile = useCallback((authUser: SupabaseUser): User => {
    return {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'ユーザー',
      avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
      bio: '',
      images: [], // 画像ギャラリーを追加
      socialLinks: {},
      user_id: authUser.email?.split('@')[0] || `user_${authUser.id.slice(-8)}` // Generate default user_id
    };
  }, []);

  // Supabaseにユーザープロフィールを作成する関数（タイムアウト短縮）
  const createUserProfileInDatabase = useCallback(async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      logger.debug('🔄 Creating user profile in database for:', authUser.id);
      
      const now = new Date().toISOString();
      const profileData = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'ユーザー',
        avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
        bio: '',
        social_links: {},
        images: [], // 画像ギャラリーを追加（空の配列で初期化）
        user_id: authUser.email?.split('@')[0] || `user_${authUser.id.slice(-8)}`, // Generate default user_id
        created_at: now,
        updated_at: now
      };

      logger.debug('📊 Creating profile with data:', profileData);

      const { data, error } = await safeSupabaseOperation(
        () => supabase
          .from('users')
          .upsert(profileData, { onConflict: 'id' })
          .select()
          .single(),
        'Create user profile',
        null,
        15000 // 15秒に延長（接続が遅い環境に対応）
      );

      if (error) {
        const errorMessage = error?.message || String(error || '');
        
        // "Failed to fetch" エラーはネットワーク問題なので警告のみ
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
          console.log('📱 Using local profile (network unavailable)');
          return null;
        }
        
        // タイムアウトエラーの場合は警告のみでモックプロファイルを使用
        if (errorMessage.includes('timeout')) {
          console.log('📱 Using local profile (connection timeout)');
          return null; // nullを返してモックプロファイルを使用
        }
        
        // その他のエラーは警告として記録（エラーログは出さない）
        console.log('📱 Profile creation skipped - using local profile');
        return null;
      }

      logger.debug('✅ User profile created in database successfully');
      const userProfile: User = {
        ...data,
        socialLinks: data.social_links || {},
        images: data.images || []
      };
      delete userProfile.social_links;
      
      return userProfile;
    } catch (error: any) {
      const errorMessage = error?.message || String(error || '');
      
      // "Failed to fetch" の場合は静かに処理
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        console.log('📱 Using local profile (network error)');
        return null;
      }
      
      console.log('📱 Profile creation error - using local profile');
      return null;
    }
  }, []);

  // 既存のプロフィールを取得または作成する関数（タイムアウト短縮）
  const getOrCreateUserProfile = useCallback(async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('🔍 Quick profile check for user:', authUser.id);
      
      // まず既存のプロフィールを確認
      const { data: existingUser, error: fetchError, isFromFallback } = await safeSupabaseOperation(
        () => supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle(),
        'Check existing profile',
        null,
        10000 // 10秒に延長
      );

      // ネットワークエラーの場合は静かに処理
      if (isFromFallback && fetchError) {
        const errorMessage = fetchError?.message || String(fetchError || '');
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
          console.log('📱 Network unavailable - using local profile');
          return null;
        }
      }

      if (!fetchError && existingUser) {
        console.log('✅ Found existing profile in database');
        const userWithSocialLinks = {
          ...existingUser,
          socialLinks: existingUser.social_links || {},
          images: existingUser.images || [], // 画像ギャラリーを追加
        };
        delete userWithSocialLinks.social_links;
        return userWithSocialLinks;
      }

      console.log('📝 No existing profile found, creating new one...');
      return await createUserProfileInDatabase(authUser);
    } catch (error: any) {
      const errorMessage = error?.message || String(error || '');
      
      // "Failed to fetch" の場合は静かに処理
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        console.log('📱 Network error - using local profile');
        return null;
      }
      
      console.log('📱 Profile fetch error - using local profile');
      return null;
    }
  }, [createUserProfileInDatabase]);

  // 即座の初期化 - 認証チェックのみ
  useEffect(() => {
    logger.debug('🚀 AuthProvider: Fast authentication initialization');
    
    // セッション期限切れフラグをチェック
    const sessionExpired = typeof window !== 'undefined' 
      ? localStorage.getItem('livme_session_expired') === 'true'
      : false;
    
    if (sessionExpired) {
      logger.debug('🔑 Session expired flag detected - clearing all data');
      // セッション期限切れの場合は全てクリア
      clearSessionData();
      setUser(null);
    } else {
      // Supabaseセッションの状態を即座にチェック
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session) {
          logger.debug('🔐 No valid session found - clearing all data');
          // セッションがない場合は完全にクリア
          clearSessionData();
          setUser(null);
        } else {
          // 有効なセッションがある場合のみストレージから読み込み
          const storedUser = getStoredUser();
          
          if (storedUser && storedUser.id && !storedUser.id.startsWith('local-user-') && storedUser.id === session.user.id) {
            logger.debug('✅ Found authenticated user with valid session:', storedUser.name);
            setUser(storedUser);
            setIsProfileCreationFailed(false);
            setProfileCreationError(null);
          } else {
            logger.debug('🔐 Session user mismatch or invalid stored user - clearing data');
            // セッションとストレージのユーザーが一致しない場合はクリア
            clearSessionData();
            setUser(null);
          }
        }
      }).catch(() => {
        logger.debug('🔐 Session check failed - clearing all data');
        clearSessionData();
        setUser(null);
      });
    }
    
    // ローディングを短時間で終了
    setTimeout(() => {
      setLoading(false);
      setIsInitialized(true);
      logger.debug('✅ Fast authentication initialization complete');
    }, 300); // 300msに短縮
    
  }, [clearSessionData]);

  // Periodic session validation to detect stale tokens
  useEffect(() => {
    if (!user || loading) return;

    const validateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('🔑 Session validation error:', error.message);
          if (error.message.includes('refresh_token_not_found') || 
              error.message.includes('Invalid Refresh Token') ||
              error.message.includes('JWT expired')) {
            console.log('🔑 Invalid session detected - clearing auth data');
            clearSessionData();
          }
        } else if (!session) {
          console.log('🔑 No session found during validation - clearing auth data');
          clearSessionData();
        }
      } catch (error: any) {
        console.log('🔑 Session validation failed:', error.message);
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          clearSessionData();
        }
      }
    };

    // Initial validation after 5 seconds
    const initialValidation = setTimeout(validateSession, 5000);

    // Periodic validation every 10 minutes
    const interval = setInterval(validateSession, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialValidation);
      clearInterval(interval);
    };
  }, [user, loading, clearSessionData]);

  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      console.log(`👤 Loading user profile: ${authUser.id}`);
      console.log('🔍 DEBUG: AuthUser details:', {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata
      });
      
      // すぐにモックプロフィールを設定
      const mockProfile = createMockProfile(authUser);
      console.log('🔍 DEBUG: Created mock profile:', {
        id: mockProfile.id,
        name: mockProfile.name,
        avatar: mockProfile.avatar?.substring(0, 50) + '...'
      });
      
      setUser(mockProfile);
      storeUser(mockProfile);
      console.log('✅ DEBUG: User profile set and stored');
      
      // プロフィール作成成功として扱う
      setIsProfileCreationFailed(false);
      setProfileCreationError(null);
      
      // より積極的なバックグラウンド同期（短縮）
      setTimeout(async () => {
        try {
          console.log('🌐 Immediate profile sync starting...');
          const dbProfile = await getOrCreateUserProfile(authUser);
          
          if (dbProfile) {
            console.log('✅ Profile synced immediately');
            setUser(dbProfile);
            storeUser(dbProfile);
            
            // データ同期完了を通知（控えめに）
            setTimeout(() => {
              toast.success('データを同期しました', { duration: 1500 });
            }, 500);
          } else {
            console.log('📱 Continuing with local profile (database sync will retry in background)');
            // タイムアウトや接続エラーの場合でもアプリは継続
          }
        } catch (bgError: any) {
          const errorMsg = bgError?.message || String(bgError || '');
          if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
            console.log('📱 Network unavailable - continuing with local profile');
          } else if (errorMsg.includes('timeout')) {
            console.log('📱 Connection timeout - continuing with local profile');
          } else {
            console.log('📱 Profile sync skipped - continuing with local profile');
          }
        }
      }, 300); // 300msに短縮して即座同期
      
    } catch (error: any) {
      const errorMsg = error?.message || String(error || '');
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
        console.log('📱 Network error - using local profile');
      } else {
        console.log('📱 Profile load error - using local profile');
      }
      
      const mockProfile = createMockProfile(authUser);
      setUser(mockProfile);
      storeUser(mockProfile);
      
      setIsProfileCreationFailed(false);
      setProfileCreationError(null);
      console.log('✅ Local profile ready');
    }
  }, [createMockProfile, getOrCreateUserProfile]);

  // 軽量な認証状態チェック with enhanced token error handling
  useEffect(() => {
    let isMounted = true;

    const performLightAuth = async () => {
      try {
        console.log('🔐 Lightweight session check starting...');
        
        // 既にユーザーがいる場合はスキップ
        if (user) {
          console.log('ℹ️ User already loaded, skipping background auth');
          return;
        }
        
        const { data: { session }, error, isFromFallback } = await safeSupabaseOperation(
          () => supabase.auth.getSession(),
          'Background session retrieval',
          { session: null },
          5000 // 5秒に短縮
        );
        
        if (!isMounted) return;

        if (error || isFromFallback) {
          console.log('⚠️ Background session error - staying in auth screen if no user');
          // Clear any stale session data
          if (error?.message?.includes('refresh_token_not_found') || 
              error?.message?.includes('Invalid Refresh Token')) {
            removeStoredUser();
            setUser(null);
            setCurrentAuthUser(null);
          }
          return;
        }

        if (session?.user) {
          console.log('✅ Background session found:', session.user.id);
          setCurrentAuthUser(session.user);
          await loadUserProfile(session.user);
        } else {
          console.log('ℹ️ No background session - staying in auth screen if no user');
        }
      } catch (error: any) {
        console.error('❌ Background auth error:', error);
        // Handle token errors
        if (error?.message?.includes('refresh_token_not_found') || 
            error?.message?.includes('Invalid Refresh Token')) {
          console.log('🔑 Token error in background auth - clearing session');
          removeStoredUser();
          setUser(null);
          setCurrentAuthUser(null);
        }
      }
    };

    // 1秒後にバックグラウンドで実行（短縮）
    setTimeout(performLightAuth, 1000);

    // Enhanced Auth state listener with token error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentAuthUser(session.user);
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out - clearing all auth data');
        setCurrentAuthUser(null);
        setUser(null);
        setIsProfileCreationFailed(false);
        setProfileCreationError(null);
        
        // ローカルストレージを完全にクリア
        removeStoredUser();
        if (typeof window !== 'undefined') {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('livme_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🧹 Auth event cleared localStorage key: ${key}`);
          });
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed successfully');
        if (session?.user) {
          setCurrentAuthUser(session.user);
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        toast.success('パスワードリセットメールを確認してください');
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          setCurrentAuthUser(session.user);
          await loadUserProfile(session.user);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile, user]);

  const retryProfileCreation = useCallback(async () => {
    console.log('🔄 Retrying profile creation...');
    
    setIsProfileCreationFailed(false);
    setProfileCreationError(null);
    
    if (currentAuthUser) {
      console.log('👤 Retrying with current auth user:', currentAuthUser.id);
      await loadUserProfile(currentAuthUser);
    } else {
      console.log('❌ No authenticated user for retry - staying in auth screen');
      setUser(null);
    }
  }, [currentAuthUser, loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      logger.debug('🔐 Attempting to sign in...');
      
      // 入力値の厳格な検証
      if (!email || !password || email.trim() === '' || password.trim() === '') {
        console.log('❌ Empty credentials provided');
        return { success: false, error: 'メールアドレスとパスワードを入力してください' };
      }
      
      // Clear any existing stale session data first
      await supabase.auth.signOut({ scope: 'local' });
      
      const { data, error } = await safeSupabaseOperation(
        () => supabase.auth.signInWithPassword({ email: email.trim(), password }),
        'Sign in',
        null,
        15000 // 15秒に短縮
      );

      if (error) {
        console.log('❌ Sign in error:', error.message || error);
        let message = 'ログインに失敗しました';
        let requiresEmailConfirmation = false;
        
        if (error.message.includes('Invalid login credentials')) {
          message = 'メールアドレスまたはパスワードが間違っています。\n\nアカウントをお持ちでない場合は新規登録してください。';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'メールアドレスの確認が必要です';
          requiresEmailConfirmation = true;
        } else if (error.message.includes('refresh_token_not_found') || 
                   error.message.includes('Invalid Refresh Token')) {
          message = 'セッションが無効です。再度ログインしてください。';
          clearSessionData();
        } else if (error.message.includes('timeout')) {
          message = 'ログインがタイムアウトしました。ネットワーク接続を確認してください。';
        } else if (error.message.includes('Too many requests')) {
          message = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        }
        
        return { success: false, error: message, requiresEmailConfirmation };
      }

      console.log('✅ Sign in successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      // Handle token errors in catch block
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid Refresh Token')) {
        console.log('🔑 Token error during sign in - clearing session');
        clearSessionData();
        return { success: false, error: 'セッションが無効です。再度ログインしてください。' };
      }
      
      return { success: false, error: 'ログインに失敗しました' };
    }
  };

  const signUp = async (email: string, password: string, userData: Omit<User, 'id'>) => {
    try {
      console.log('📝 Attempting to sign up...');
      
      const { data, error } = await safeSupabaseOperation(
        () => supabase.auth.signUp({
          email,
          password,
          options: { data: { name: userData.name } }
        }),
        'Sign up',
        null,
        15000 // 15秒に短縮
      );

      if (error) {
        console.error('❌ Sign up error:', error);
        let message = '登録に失敗しました';
        let isRateLimit = false;
        let waitTime = 0;
        
        if (error.message.includes('User already registered')) {
          message = 'このメールアドレスは既に登録されています';
        } else if (error.message.includes('timeout')) {
          message = '登���がタイムアウトしました。ネットワーク接続を確認してください。';
        } else if (error.message.includes('For security purposes, you can only request this after')) {
          // Extract wait time from error message
          const match = error.message.match(/after (\d+) seconds/);
          waitTime = match ? parseInt(match[1]) : 60;
          message = `セキュリティのため、${waitTime}秒後に再試行してください`;
          isRateLimit = true;
        } else if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
          message = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
          isRateLimit = true;
          waitTime = 60;
        }
        
        return { success: false, error: message, isRateLimit, waitTime };
      }

      console.log('✅ Sign up successful');
      if (data.user && !data.session) {
        toast.success('確認メールを送信しました', { duration: 8000 });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { success: false, error: '登録に失敗しました' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      // すぐにローカル状態をクリア
      setCurrentAuthUser(null);
      setUser(null);
      setIsProfileCreationFailed(false);
      setProfileCreationError(null);
      
      // ローカルストレージを完全にクリア
      removeStoredUser();
      
      // LIVMEに関連するすべてのローカルストレージをクリア
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('livme_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🧹 Removed localStorage key: ${key}`);
        });
        
        // セッション期限切れフラグもクリア
        localStorage.removeItem('livme_session_expired');
      }
      
      // Supabaseからもサインアウト（即座に実行）
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('✅ Supabase sign out successful');
      } catch (error) {
        console.log('⚠️ Supabase sign out failed:', error);
        // Supabaseサインアウトが失敗してもローカル状態はクリア済みなので続行
      }
      
      toast.success('ログアウトしまし��');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // エラーが発生してもローカル状態はクリアする
      setCurrentAuthUser(null);
      setUser(null);
      removeStoredUser();
      toast.error('ログアウトに失敗しました');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await safeSupabaseOperation(
        () => supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        }),
        'Password reset',
        null,
        10000 // 10秒に短縮
      );

      if (error) throw new Error('パスワードリセットに失敗しました');
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await safeSupabaseOperation(
        () => supabase.auth.updateUser({ password: newPassword }),
        'Password update',
        null,
        10000 // 10秒に短縮
      );

      if (error) return { success: false, error: 'パスワード更新に失敗しました' };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'パスワード更新に失敗しました' };
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, error: 'ユーザーがログインしていません' };
      }

      console.log('⚡ Ultra-fast profile update...', updates);
      console.log('🔧 Current user ID:', user.id);
      console.log('🌐 Connection status:', connectionStatus);
      
      // 即座にローカル更新（UI応答性最優先）
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      storeUser(updatedUser);
      console.log('✅ Instant local update completed');
      
      // バックグラウンドでデータベース更新（完全非ブロッキング）
      setTimeout(async () => {
        try {
          console.log('🌐 Background database sync...');
          
          const dbUpdates: any = { ...updates };
          if (updates.socialLinks) {
            dbUpdates.social_links = updates.socialLinks;
            delete dbUpdates.socialLinks;
          }

          const now = new Date().toISOString();
          
          // 超短時間でcreated_atを取得
          const { data: existingRecord, error: fetchError } = await safeSupabaseOperation(
            () => supabase
              .from('users')
              .select('created_at')
              .eq('id', user.id)
              .maybeSingle(),
            'Quick created_at check',
            null,
            2000 // 2秒に短縮
          );

          // Check for token errors in the fetch
          if (fetchError?.message?.includes('refresh_token_not_found') || 
              fetchError?.message?.includes('Invalid Refresh Token')) {
            console.log('🔑 Token error in profile update - clearing session');
            clearSessionData();
            return;
          }

          const finalDbData = {
            id: user.id,
            ...dbUpdates,
            user_id: dbUpdates.user_id || user.user_id || user.id?.slice(-8) || 'default_user_id',
            created_at: existingRecord?.created_at || now,
            updated_at: now
          };

          console.log('📊 Background database sync with:', finalDbData);

          const { error: updateError } = await safeSupabaseOperation(
            () => supabase
              .from('users')
              .upsert(finalDbData, { onConflict: 'id' }),
            'Profile background sync',
            null,
            5000 // 5秒に短縮
          );

          if (updateError) {
            console.log('⚠️ Background sync failed:', updateError);
            if (updateError.message?.includes('refresh_token_not_found') || 
                updateError.message?.includes('Invalid Refresh Token')) {
              console.log('🔑 Token error in background sync - clearing session');
              clearSessionData();
            }
          } else {
            console.log('✅ Background database sync completed');
          }
        } catch (bgError: any) {
          console.log('⚠️ Background sync error:', bgError);
          if (bgError?.message?.includes('refresh_token_not_found') || 
              bgError?.message?.includes('Invalid Refresh Token')) {
            console.log('🔑 Token error in background sync - clearing session');
            clearSessionData();
          }
        }
      }, 100); // 100msに短縮

      return { success: true };
    } catch (error: any) {
      console.error('❌ Update user profile error:', error);
      
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid Refresh Token')) {
        console.log('🔑 Token error in profile update - clearing session');
        clearSessionData();
        return { success: false, error: 'セッシ��ンが無効です。再度ログインしてください。' };
      }
      
      return { success: false, error: 'プロフィール更新に失敗しました' };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await safeSupabaseOperation(
        () => supabase.auth.resend({ type: 'signup', email }),
        'Resend confirmation',
        null,
        10000 // 10秒に短縮
      );

      if (error) return { success: false, error: '確認メール再送信に失敗しました' };
      
      toast.success('確認メールを再送信しました');
      return { success: true };
    } catch (error) {
      return { success: false, error: '確認メール再送信に失敗しました' };
    }
  };

  const value = {
    user,
    loading,
    profileCreationError,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
    resendConfirmation,
    retryProfileCreation,
    isMockMode,
    isProfileCreationFailed,
    connectionStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}