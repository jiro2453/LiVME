import { createClient } from '@supabase/supabase-js'

// 実際のSupabase認証情報
const supabaseUrl = 'https://fgvmbdxayjasmlwrylup.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndm1iZHhheWphc21sd3J5bHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MzgxMDUsImV4cCI6MjA2NzAxNDEwNX0.Kt5lRop18PoDqItBGCcMv2XQZ9vEgfhE08EAtCdyeKE'

// 接続状態の管理（起動直後はオプティミスティックに true）
let isSupabaseHealthy = true;
let connectionCheckInterval: NodeJS.Timeout | null = null;

// 軽量ロガー（本番/負荷時は抑制）
const LOG_ENABLED = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('dev'));
const log = (...args: any[]) => { if (LOG_ENABLED) console.log(...args); };

// Create Supabase client with optimized settings and error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'livme-app'
    }
  }
})

// Reloadガード（短時間の連続リロードを防ぐ）
function safeReloadOnce(ttlMs = 60000) {
  try {
    const key = 'livme_reload_guard';
    const last = parseInt(localStorage.getItem(key) || '0', 10);
    const now = Date.now();
    if (now - last < ttlMs) {
      log('🔁 Reload suppressed (guard active)');
      return;
    }
    localStorage.setItem(key, String(now));
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

// Enhanced token error handler（安全化）
export async function handleTokenError(error: any): Promise<boolean> {
  const msg = error?.message || String(error || '');
  log('🔑 Handling token error:', msg);
  
  if (
    msg.includes('refresh_token_not_found') ||
    msg.includes('Invalid Refresh Token') ||
    msg.includes('refresh token not found') ||
    msg.includes('JWT expired')
  ) {
    log('🚪 Token expired/invalid - clearing session and signing out');
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('livme_session_expired', 'true');
      }
      removeStoredUser();
      await supabase.auth.signOut({ scope: 'local' });
      if (typeof window !== 'undefined') {
        setTimeout(() => safeReloadOnce(60000), 300);
      }
      return true;
    } catch (signOutError) {
      console.error('❌ Error during token cleanup:', signOutError);
      if (typeof window !== 'undefined') {
        localStorage.setItem('livme_session_expired', 'true');
        localStorage.clear();
        safeReloadOnce(60000);
      }
      return true;
    }
  }
  
  return false;
}

// LocalStorage keys for fallback
const STORAGE_KEYS = {
  USER: 'livme_user',
  LIVES: 'livme_lives',
  CONNECTION_STATUS: 'livme_connection_status',
  LAST_SYNC: 'livme_last_sync',
  LAST_SUCCESS: 'livme_last_success',
  LAST_HEALTH_CHECK: 'livme_last_health_check'
};

// ローカルストレージユーティリティ関数
export function getStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to get stored user:', error);
    return null;
  }
}

export function storeUser(user: any) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    log('✅ User stored locally');
  } catch (error) {
    console.warn('Failed to store user:', error);
  }
}

export function removeStoredUser() {
  try {
    const currentUser = getStoredUser();
    if (currentUser?.id) {
      clearUserLives(currentUser.id);
    }
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    
    
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('livme_')) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
        log(`🧹 Removed localStorage key: ${key}`);
      }
    }
    log('✅ User and all associated LIVME data removed from local storage');
  } catch (error) {
    console.warn('Failed to remove stored user:', error);
  }
}

export function getStoredLives() {
  try {
    const currentUser = getStoredUser();
    if (!currentUser?.id || currentUser.id.startsWith('local-user-')) {
      log('⚠️ No valid user ID for lives storage, returning empty array');
      return [];
    }
    const userSpecificKey = `${STORAGE_KEYS.LIVES}_${currentUser.id}`;
    const stored = localStorage.getItem(userSpecificKey);
    const result = stored ? JSON.parse(stored) : [];
    log(`📋 Retrieved ${result.length} lives for user ${currentUser.id}`);
    return result;
  } catch (error) {
    console.warn('Failed to get stored lives:', error);
    return [];
  }
}

export function storeLives(lives: any[]) {
  try {
    const currentUser = getStoredUser();
    if (!currentUser?.id || currentUser.id.startsWith('local-user-')) {
      log('⚠️ No valid user ID for lives storage, skipping store');
      return;
    }
    const userSpecificKey = `${STORAGE_KEYS.LIVES}_${currentUser.id}`;
    localStorage.setItem(userSpecificKey, JSON.stringify(lives));
    log(`✅ ${lives.length} lives stored locally for user ${currentUser.id}`);
  } catch (error) {
    console.warn('Failed to store lives:', error);
  }
}

export function clearUserLives(userId?: string) {
  try {
    const targetUserId = userId || getStoredUser()?.id;
    if (!targetUserId) return;
    const userSpecificKey = `${STORAGE_KEYS.LIVES}_${targetUserId}`;
    localStorage.removeItem(userSpecificKey);
    log(`🧹 Cleared lives data for user ${targetUserId}`);
  } catch (error) {
    console.warn('Failed to clear user lives:', error);
  }
}

// 3秒タイムアウトの単純なヘルスチェック（Raceは使わない）
async function simpleHealthCheck(timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: controller.signal
    });
    clearTimeout(id);
    return response.ok;
  } catch {
    return false;
  }
}

// Supabase健全性の確認（単純化＋キャッシュ長め）
export async function checkSupabaseHealth(): Promise<{ healthy: boolean; reason?: string }> {
  const now = Date.now();
  const lastSuccess = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SUCCESS) || '0', 10);
  const fifteenMinAgo = now - 15 * 60 * 1000;
  if (lastSuccess > fifteenMinAgo) {
    log('📋 Using recent success cache (15m) - healthy');
    isSupabaseHealthy = true;
    return { healthy: true, reason: 'cache' };
  }
  
  const ok = await simpleHealthCheck(3000);
  isSupabaseHealthy = ok;
  localStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, ok ? 'healthy' : 'unhealthy');
  if (ok) localStorage.setItem(STORAGE_KEYS.LAST_SUCCESS, String(now));
  log(`🔎 Health check result: ${ok ? '✅ healthy' : '❌ unhealthy'}`);
  return { healthy: ok, reason: ok ? undefined : 'no-respond' };
}

// 現在の接続状態を取得（30秒以上空いた時だけ非同期で1回叩く）
export function getConnectionStatus(): boolean {
  try {
    const now = Date.now();
    const lastCheck = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_HEALTH_CHECK) || '0', 10);
    if (now - lastCheck > 30000) {
      localStorage.setItem(STORAGE_KEYS.LAST_HEALTH_CHECK, String(now));
      // 失敗しても飲み込む
      checkSupabaseHealth().catch(() => {});
    }
    return isSupabaseHealthy;
  } catch {
    return isSupabaseHealthy;
  }
}

// 安全なSupabase操作ラッパー（ログ抑制+接続状態更新）
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string,
  fallbackValue: T | null = null,
  timeoutMs: number = 15000 // 15秒に延長（接続が遅い環境に対応）
): Promise<{ data: T | null; error: any; isFromFallback: boolean }> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operationName} timeout (${timeoutMs}ms)`)), timeoutMs);
    });
    const result = await Promise.race([operation(), timeoutPromise]) as { data: T | null; error: any };
    if (result.error) {
      const wasTokenError = await handleTokenError(result.error);
      if (wasTokenError) {
        return { data: fallbackValue, error: result.error, isFromFallback: true };
      }
    }
    return { ...result, isFromFallback: false };
  } catch (error: any) {
    const errorMessage = error?.message || String(error || '');
    
    // "Failed to fetch" エラーは警告ログのみ（ネットワーク問題）
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
      log(`📱 ${operationName}: Network unavailable`);
      isSupabaseHealthy = false;
      localStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'unhealthy');
      return { data: fallbackValue, error, isFromFallback: true };
    }
    
    const wasTokenError = await handleTokenError(error);
    if (wasTokenError) {
      return { data: fallbackValue, error, isFromFallback: true };
    }
    isSupabaseHealthy = false;
    localStorage.setItem(STORAGE_KEYS.CONNECTION_STATUS, 'unhealthy');
    log(`⚠️ ${operationName}: ${errorMessage}`);
    return { data: fallbackValue, error, isFromFallback: true };
  }
}

// シンプルなリトライ（最大2回・短い待機）
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 800,
  operationName: string = 'Operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (
        error?.message?.includes('already registered') ||
        error?.message?.includes('Invalid login credentials') ||
        error?.message?.includes('relation') ||
        error?.code === '23505' ||
        error?.code === '42501'
      ) {
        throw error;
      }
      if (attempt === maxRetries) {
        throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error?.message || error}`);
      }
      const delay = baseDelay * attempt + Math.random() * 400;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
}

// タイムアウト付きプロミス
export function createTimeoutPromise<T>(promise: Promise<T>, timeoutMs: number = 8000, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${operation} timeout (${timeoutMs}ms)`)), timeoutMs))
  ]);
}

// 軽量接続テスト（3秒タイムアウト）
export async function testSupabaseConnection() {
  try {
    const { healthy, reason } = await checkSupabaseHealth();
    if (healthy) {
      return { success: true, message: 'Supabase接続良好', isMockMode: false };
    } else {
      return { success: false, message: 'ローカルモードで動作中', error: new Error(reason || 'Connection test failed'), isMockMode: false };
    }
  } catch (error: any) {
    return { success: false, message: 'ローカルモードで動作中', error, isMockMode: false };
  }
}

// Enhanced mock data for better fallback experience
export const mockData = { /* ← ここはあなたの現行定義をそのまま残しています（省略） */
  users: [
    {
      id: 'local-user-1',
      name: 'ユーザー',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: '音楽が大好きです！LIVMEでライブ体験を記録しています🎵',
      social_links: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  lives: [
    {
      id: 'local-live-1',
      artist: 'あいみょん',
      date: '2024-12-25',
      venue: '武道館',
      description: 'クリスマスライブ！素晴らしいパフォーマンスでした🎄',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      created_by: 'local-user-1',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'local-live-2',
      artist: 'YOASOBI',
      date: '2025-01-15',
      venue: '東京ドーム',
      description: '新年最初のライブ！楽しみです✨',
      image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
      created_by: 'local-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'local-live-3',
      artist: 'Official髭男dism',
      date: '2025-02-14',
      venue: '大阪城ホール',
      description: 'バレンタインライブ💕新曲も披露予定！',
      image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=300&fit=crop',
      created_by: 'local-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  live_attendees: [
    {
      live_id: 'local-live-1',
      user_id: 'local-user-1',
      joined_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      live_id: 'local-live-2',
      user_id: 'local-user-1',
      joined_at: new Date().toISOString()
    },
    {
      live_id: 'local-live-3',
      user_id: 'local-user-1',
      joined_at: new Date().toISOString()
    }
  ]
}

// ユーザー固有でない古いライブデータをクリーンアップ
export function cleanupOldLivesData() {
  try {
    const oldKey = STORAGE_KEYS.LIVES;
    if (localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey);
      log('🧹 Removed old shared lives data');
    }
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEYS.LIVES + '_') && key.includes('local-user-')) {
        localStorage.removeItem(key);
        log(`🧹 Removed old local user data: ${key}`);
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup old lives data:', error);
  }
}

// Initialize local storage cleanup only（明示的に呼ぶまで自動実行しない）
export function initializeLocalData() {
  cleanupOldLivesData();
  const currentUser = getStoredUser();
  if (currentUser?.id && !currentUser.id.startsWith('local-user-')) {
    log(`✅ LIVME: Local data initialized for authenticated user ${currentUser.id} (no sample data)`);
    return;
  }
  log('ℹ️ LIVME: Local user detected, sample data available through mockData');
}

// Health monitoring（自動起動しない。アプリ最上位で明示的に1回だけ呼ぶ）
export function startHealthMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  connectionCheckInterval = setInterval(async () => {
    log('🔄 Hourly background health check...');
    await checkSupabaseHealth().catch(() => {});
  }, 60 * 60 * 1000);
}

export function stopHealthMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
}

// 自動起動は削除（ここがフリーズ誘発の温床でした）
// if (typeof window !== 'undefined') {
//   startHealthMonitoring();
//   initializeLocalData();
// }

// Default to fallback mode for better startup performance
export const isMockMode = false;
