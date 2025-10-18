import { useState, useEffect, useCallback } from 'react';
import { Live } from '../types';
import { supabase, getConnectionStatus, safeSupabaseOperation, mockData } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { IS_PRODUCTION, logger } from '../lib/environment';

// Suppress console in production for performance
const originalConsole = { ...console };
if (IS_PRODUCTION) {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.error for critical issues
}

interface UseAllLivesResult {
  allLives: Live[];
  loading: boolean;
  error: string | null;
  refreshAllLives: () => Promise<void>;
  isUsingFallback: boolean;
}

export function useAllLives(): UseAllLivesResult {
  const [allLives, setAllLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  // 全公演データをデータベースから取得
  const fetchAllLivesFromDatabase = useCallback(async () => {
    try {
      logger.debug('🌐 useAllLives: Fetching all public lives immediately...');
      
      setLoading(true);
      setError(null);
      
      // ライブデータを即座に取得
      const { data: livesData, error: livesError, isFromFallback: livesFromFallback } = await safeSupabaseOperation(
        () => supabase
          .from('lives')
          .select(`
            *,
            created_by_user:users!created_by(id, name, avatar)
          `)
          .order('date', { ascending: false }),
        'Fetch all lives',
        [],
        15000 // 15秒に短縮
      );

      if (livesFromFallback || livesError) {
        const errorMsg = livesError?.message || '';
        console.log('⚠️ useAllLives: Lives query failed:', {
          error: errorMsg,
          isFromFallback: livesFromFallback
        });
        
        // タイムアウトエラーは警告として扱い、アプリは継続
        if (errorMsg.includes('timeout')) {
          console.warn('⏱️ Database connection is slow. App will continue with local data.');
          setIsUsingFallback(true);
          setAllLives([]);
          setError(null); // エラーをクリアしてアプリを継続
          setLoading(false);
          return;
        }
        
        if (errorMsg.includes('relation')) {
          setError('データベースのセットアップが必要です。');
        }
        
        setIsUsingFallback(true);
        setAllLives([]);
        return;
      }

      if (!livesData || livesData.length === 0) {
        console.log('ℹ️ useAllLives: No lives found in database');
        setAllLives([]);
        setIsUsingFallback(false);
        return;
      }

      // 全ライブIDを取得
      const liveIds = livesData.map(live => live.id);

      // 全参加者情報を即座に取得
      const { data: attendeesData, error: attendeesError, isFromFallback: attendeesFromFallback } = await safeSupabaseOperation(
        () => supabase
          .from('live_attendees')
          .select(`
            live_id,
            user_id,
            joined_at,
            user:users(id, name, avatar, bio, user_id, social_links, images)
          `)
          .in('live_id', liveIds),
        'Fetch all attendees',
        [],
        15000 // 15秒に短縮
      );

      if (attendeesFromFallback || attendeesError) {
        const errorMsg = attendeesError?.message || '';
        console.log('⚠️ useAllLives: Attendees query failed:', {
          error: errorMsg,
          isFromFallback: attendeesFromFallback,
          liveIdsCount: liveIds.length
        });
        
        // タイムアウトエラーは警告として扱う
        if (errorMsg.includes('timeout')) {
          console.warn('⏱️ Attendees query timed out. Continuing with basic live data.');
          setError(null); // エラーをクリアしてアプリを継続
        } else {
          setError('参加者情報の取得に失敗しました。');
        }
        
        setIsUsingFallback(true);
        return;
      }

      console.log('📊 useAllLives: Data retrieved:', {
        livesCount: livesData?.length || 0,
        attendeesCount: attendeesData?.length || 0,
        attendeesDetails: attendeesData?.map(a => ({
          live_id: a.live_id,
          user_id: a.user_id,
          user_name: a.user?.name,
          has_bio: !!a.user?.bio,
          has_user_id: !!a.user?.user_id,
          has_images: !!a.user?.images?.length,
          has_social_links: !!Object.keys(a.user?.social_links || {}).length
        }))
      });

      // データを結合
      const livesWithAttendees: Live[] = livesData.map(live => {
        const liveAttendees = (attendeesData || [])
          .filter(attendee => attendee.live_id === live.id)
          .map(attendee => ({
            id: attendee.user.id,
            name: attendee.user.name,
            avatar: attendee.user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
            bio: attendee.user.bio || '',
            user_id: attendee.user.user_id,
            images: attendee.user.images || [],
            socialLinks: attendee.user.social_links || {}
          }));

        console.log(`🔍 useAllLives: Processing live "${live.artist}" (${live.id}):`, {
          attendeesForThisLive: (attendeesData || []).filter(a => a.live_id === live.id).length,
          processedAttendees: liveAttendees.length
        });

        // 重複チェック
        const uniqueAttendees = liveAttendees.reduce((acc, attendee) => {
          if (!acc.find(a => a.id === attendee.id)) {
            acc.push(attendee);
          }
          return acc;
        }, [] as typeof liveAttendees);

        return {
          id: live.id,
          artist: live.artist,
          date: live.date,
          venue: live.venue,
          description: live.description || '',
          imageUrl: live.image_url || '',
          createdBy: live.created_by,
          createdAt: live.created_at,
          updatedAt: live.updated_at,
          attendees: uniqueAttendees
        };
      });

      console.log('✅ useAllLives: Final data prepared:', {
        totalLives: livesWithAttendees.length,
        livesWithAttendeesSummary: livesWithAttendees.map(l => ({
          id: l.id,
          artist: l.artist,
          attendeesCount: l.attendees.length,
          attendeesWithCompleteData: l.attendees.filter(a => a.bio || a.user_id || a.images?.length).length
        }))
      });

      logger.info(`✅ useAllLives: Successfully loaded ${livesWithAttendees.length} public lives`);
      setAllLives(livesWithAttendees);
      setIsUsingFallback(false);
      setError(null);

    } catch (err: any) {
      console.error('❌ useAllLives: Fetch error:', err);
      setError('全公演データの取得に失敗しました');
      setAllLives([]);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回読み込み - 即座に実行（リトライロジック付き）
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3; // リトライ回数を減らす

    const initializeAllLives = async () => {
      const attemptFetch = async () => {
        if (retryCount >= maxRetries) {
          console.log('❌ useAllLives: Max retries reached');
          setIsUsingFallback(true);
          setAllLives([]);
          setError('データベースからの取得に失敗しました');
          return;
        }
        
        const connectionStatus = getConnectionStatus();
        console.log(`🌐 useAllLives: Attempt ${retryCount + 1}/${maxRetries}`);
        
        if (connectionStatus) {
          try {
            await fetchAllLivesFromDatabase();
            console.log('✅ useAllLives: Fetch successful');
          } catch (error) {
            console.log('⚠️ useAllLives: Fetch failed:', error);
            
            // リトライ（回数制限付き）
            if (retryCount < maxRetries - 1 && isMounted) {
              retryCount++;
              const retryDelay = 2000; // 固定2秒
              setTimeout(() => {
                if (isMounted) {
                  attemptFetch();
                }
              }, retryDelay);
            }
          }
        }
      };

      // 最初の試行
      await attemptFetch();
    };

    // 即座に実行
    initializeAllLives();

    return () => {
      isMounted = false;
    };
  }, []); // 空の依存配列で初回のみ実行

  const refreshAllLives = useCallback(async () => {
    console.log('🔄 useAllLives: Manual refresh requested');
    setError(null);
    setLoading(true);
    await fetchAllLivesFromDatabase();
  }, []); // 空の依存配列

  return {
    allLives,
    loading,
    error,
    refreshAllLives,
    isUsingFallback
  };
}
