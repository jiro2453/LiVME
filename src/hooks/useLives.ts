import { useState, useEffect, useCallback } from 'react';
import { Live } from '../types';
import { supabase, getConnectionStatus, safeSupabaseOperation, getStoredLives, storeLives, mockData, getStoredUser } from '../lib/supabase';
import { createLive as apiCreateLive } from '../lib/api';
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

interface UseLivesResult {
  lives: Live[];
  loading: boolean;
  error: string | null;
  addLive: (liveData: Omit<Live, 'id' | 'attendees'>, userId: string) => Promise<{ success: boolean; error?: string }>;
  joinLive: (liveId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  deleteLive: (liveId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  refreshLives: () => Promise<void>;
  forceReset: () => Promise<void>;
  isUsingFallback: boolean;
}

export function useLives(): UseLivesResult {
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(false); // 即座に利用可能
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true); // デフォルトでフォールバック

  // 即座にローカルデータを読み込み（ユーザーが参加しているライブのみ）
  const loadLocalLives = useCallback(() => {
    const currentUser = getStoredUser();
    const currentUserId = currentUser?.id;
    
    if (!currentUserId) {
      // 警告ログを削除（正常な初期状態）
      setLives([]);
      setError(null);
      return;
    }
    
    if (currentUserId.startsWith('local-user-')) {
      logger.debug('ℹ️ LIVME: Local user detected, setting empty lives for authenticated app');
      setLives([]);
      setError(null);
      return;
    }
    
    const storedLives = getStoredLives();
    let formattedLives: Live[] = [];
    
    logger.debug('💾 LIVME: Loading local lives for user:', {
      userId: currentUserId,
      storedLivesCount: storedLives.length,
      storedLives: IS_PRODUCTION ? undefined : storedLives.map(live => ({
        id: live.id,
        artist: live.artist,
        date: live.date,
        venue: live.venue,
        created_by: live.created_by
      }))
    });
    
    if (storedLives.length > 0) {
      // ローカルストレージからデータを読み込み（ユーザーが作成したライブまたは参加しているライブ）
      // 注意: 現在のローカルストレージには、ユーザーが関与しているライブのみが保存されている前提
      formattedLives = storedLives.map(live => ({
        id: live.id,
        artist: live.artist,
        date: live.date,
        venue: live.venue,
        description: live.description || '',
        imageUrl: live.image_url || '',
        createdBy: live.created_by,
        createdAt: live.created_at,
        updatedAt: live.updated_at,
        attendees: [{
          id: currentUserId,
          name: currentUser.name,
          avatar: currentUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
          bio: currentUser.bio || '',
          user_id: currentUser.user_id,
          socialLinks: currentUser.socialLinks || {}
        }] // 暫定的に現在のユーザーのみ表示、DBから正確な参加者情報を取得
      }));
      
      // Production: Minimal logging
    } else {
      // ローカルデータがない場合は空の配列を返す（認証済みユーザー）
      // mockDataはローカルユーザー用のみなので、認証済みユーザーには使用しない
      formattedLives = [];
      
      logger.info('ℹ️ LIVME: No local data found for authenticated user');
    }
    
    // Production: Remove detailed debugging logs
    
    if (formattedLives.length > 0) {
      logger.info(`✅ LIVME: Loaded ${formattedLives.length} lives for user`);
    }
    setLives(formattedLives);
    setError(null);
  }, []);

  // バックグラウンドでデータベースから取得（ユーザーが参加しているライブのみ）
  const fetchLivesFromDatabase = useCallback(async () => {
    try {
      // 現在のユーザーIDを取得
      const currentUser = getStoredUser();
      const currentUserId = currentUser?.id;

      logger.debug('🌐 LIVME: fetchLivesFromDatabase started for user:', currentUserId);
      logger.debug('🌐 LIVME: Database connection status:', getConnectionStatus());

      // 現在のユーザーが参加しているライブのみを取得
      if (!currentUserId) {
        // 警告ログを削除（正常な初期状態）
        return;
      }
      
      if (currentUserId.startsWith('local-user-')) {
        logger.debug('ℹ️ LIVME: Local user detected, skipping database fetch:', currentUserId);
        return;
      }
      
      console.log('📡 LIVME: Fetching user data immediately...');
      
      // ユーザーが参加しているライブIDと作成したライブIDを並列取得（即座に実行）
      const [attendanceResult, createdResult] = await Promise.all([
        safeSupabaseOperation(
          () => supabase
            .from('live_attendees')
            .select('live_id')
            .eq('user_id', currentUserId),
          'User attendance fetch',
          [],
          10000 // タイムアウトを10秒に短縮
        ),
        safeSupabaseOperation(
          () => supabase
            .from('lives')
            .select('id')
            .eq('created_by', currentUserId),
          'User created lives fetch',
          [],
          10000 // タイムアウトを10秒に短縮
        )
      ]);
      
      const { data: userAttendance, error: attendanceError, isFromFallback: attendanceFromFallback } = attendanceResult;
      const { data: userCreatedLives, error: createdError, isFromFallback: createdFromFallback } = createdResult;
      
      console.log('📡 LIVME: User data fetched:', {
        attendanceCount: userAttendance?.length || 0,
        createdCount: userCreatedLives?.length || 0,
        attendanceError: attendanceError?.message,
        createdError: createdError?.message,
        attendanceFromFallback,
        createdFromFallback,
        attendanceData: userAttendance,
        createdData: userCreatedLives
      });

      // データが取得できなかった場合の詳細ログ（"Failed to fetch"の場合は静かに処理）
      const attendanceErrorMsg = attendanceError?.message || '';
      const createdErrorMsg = createdError?.message || '';
      const isNetworkError = attendanceErrorMsg.includes('Failed to fetch') || 
                            attendanceErrorMsg.includes('fetch') ||
                            createdErrorMsg.includes('Failed to fetch') ||
                            createdErrorMsg.includes('fetch');

      if (attendanceFromFallback && createdFromFallback) {
        if (isNetworkError) {
          console.log('📱 LIVME: Using local data (network unavailable)');
        } else {
          console.log('📱 LIVME: Using local data');
        }
      } else if (attendanceFromFallback) {
        console.log('📱 LIVME: Attendance query using fallback');
      } else if (createdFromFallback) {
        console.log('📱 LIVME: Created lives query using fallback');
      }

      console.log('📡 LIVME: User created lives query result:', {
        success: !createdError && !createdFromFallback,
        dataCount: userCreatedLives?.length || 0,
        error: createdError?.message,
        isFromFallback: createdFromFallback,
        rawData: userCreatedLives
      });

      if (attendanceFromFallback || attendanceError || createdFromFallback || createdError) {
        console.log('⚠️ LIVME: Database query failed for user data:', {
          attendanceError: attendanceError?.message,
          createdError: createdError?.message,
          attendanceFromFallback,
          createdFromFallback,
          userAttendanceData: userAttendance,
          userCreatedData: userCreatedLives
        });
        
        // エラーでもユーザーデータが取得できている場合は処理を続行
        const canProceedWithAttendance = !attendanceFromFallback && !attendanceError && userAttendance;
        const canProceedWithCreated = !createdFromFallback && !createdError && userCreatedLives;
        
        if (!canProceedWithAttendance && !canProceedWithCreated) {
          console.log('❌ LIVME: Both attendance and created queries failed, aborting DB fetch');
          return;
        }
        
        console.log('⚡ LIVME: Partial success, proceeding with available data:', {
          hasAttendanceData: canProceedWithAttendance,
          hasCreatedData: canProceedWithCreated
        });
      }

      // 参加しているライブIDと作成した���イブIDを結合（重複削除）
      const attendedLiveIds = (userAttendance || []).map(item => item.live_id);
      const createdLiveIds = (userCreatedLives || []).map(item => item.id);
      const userLiveIds = [...new Set([...attendedLiveIds, ...createdLiveIds])];
      
      console.log(`📊 LIVME: User ${currentUserId} live data summary:`, {
        attendedCount: attendedLiveIds.length,
        createdCount: createdLiveIds.length,
        totalUnique: userLiveIds.length,
        attendedLiveIds,
        createdLiveIds
      });

      if (userLiveIds.length === 0) {
        console.log(`ℹ️ LIVME: No lives found for user ${currentUserId} in database`);
        console.log('📊 LIVME: Attendance data:', { attendedLiveIds, createdLiveIds });
        setLives([]);
        setIsUsingFallback(false);
        setError(null);
        return;
      }

      // ライブの詳細情報と参加者情報を並列取得（即座に実行）
      console.log('📡 LIVME: Fetching lives and attendees data in parallel...');
      const [livesResult, attendeesResult] = await Promise.all([
        safeSupabaseOperation(
          () => supabase
            .from('lives')
            .select(`
              *,
              created_by_user:users!created_by(id, name, avatar)
            `)
            .in('id', userLiveIds)
            .order('date', { ascending: false }),
          'Background lives fetch',
          [],
          15000 // 15秒に短縮
        ),
        safeSupabaseOperation(
          () => supabase
            .from('live_attendees')
            .select(`
              live_id,
              user_id,
              joined_at,
              user:users(id, name, avatar, bio, user_id, social_links, images)
            `)
            .in('live_id', userLiveIds),
          'Background attendees fetch',
          [],
          15000 // 15秒に短縮
        )
      ]);
      
      const { data: livesData, error: livesError, isFromFallback: livesFromFallback } = livesResult;
      const { data: attendeesData, error: attendeesError, isFromFallback: attendeesFromFallback } = attendeesResult;
      
      console.log('📡 LIVME: Lives and attendees data fetched:', {
        livesCount: livesData?.length || 0,
        attendeesCount: attendeesData?.length || 0,
        livesError: livesError?.message,
        attendeesError: attendeesError?.message,
        livesData: livesData,
        attendeesData: attendeesData,
        userLiveIds: userLiveIds
      });

      // フォールバックまたはエラーの場合
      if (livesFromFallback || attendeesFromFallback || livesError || attendeesError) {
        if (livesError?.message.includes('relation') || attendeesError?.message.includes('relation')) {
          setError('データベースのセットアップが必要です。ローカルデータを表示しています。');
        } else if (livesError?.message.includes('timeout') || attendeesError?.message.includes('timeout')) {
          setError('データベース接続がタイムアウトしました。ローカルデータを表示しています。');
        }
        
        return;
      }

      // データを結合
      const livesWithAttendees: Live[] = (livesData || []).map(live => {
        const liveAttendees = (attendeesData || [])
          .filter(attendee => attendee.live_id === live.id)
          .map(attendee => ({
            id: attendee.user.id,
            name: attendee.user.name,
            avatar: attendee.user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
            bio: attendee.user.bio || '',
            user_id: attendee.user.user_id,
            images: attendee.user.images || [], // ギャラリー画像を追加
            socialLinks: attendee.user.social_links || {}
          }));

        console.log(`🔍 LIVME: Processing live ${live.id} (${live.artist}):`, {
          liveId: live.id,
          allAttendeesForLive: (attendeesData || []).filter(a => a.live_id === live.id),
          processedAttendees: liveAttendees.length
        });

        // 重複チェック（同じユーザーIDが複数回参加者リストに入らないようにする）
        const uniqueAttendees = liveAttendees.reduce((acc, attendee) => {
          if (!acc.find(a => a.id === attendee.id)) {
            acc.push(attendee);
          }
          return acc;
        }, [] as typeof liveAttendees);

        // Production: Remove detailed logging

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

      console.log('✅ LIVME: Final lives with attendees:', {
        totalLives: livesWithAttendees.length,
        livesWithAttendeesSummary: livesWithAttendees.map(l => ({
          id: l.id,
          artist: l.artist,
          attendeesCount: l.attendees.length,
          attendees: l.attendees
        }))
      });

      logger.info(`✅ LIVME: Database sync successful - ${livesWithAttendees.length} lives loaded`);
      setLives(livesWithAttendees);
      setIsUsingFallback(false);
      setError(null);
      
      // ローカルストレージにも保存
      const livesToStore = livesWithAttendees.map(live => ({
        id: live.id,
        artist: live.artist,
        date: live.date,
        venue: live.venue,
        description: live.description,
        image_url: live.imageUrl,
        created_by: live.createdBy,
        created_at: live.createdAt,
        updated_at: live.updatedAt
      }));
      storeLives(livesToStore);
      
    } catch (err: any) {
      console.error('❌ Background fetch error:', err);
      // エラーが発生してもローカルデータは保持
    }
  }, []);

  // 初回読み込み（即座にローカル、その後バックグラウンドでDB）
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3; // リトライ回数を減らす
    
    // 即座の初期化処理
    const initializeImmediately = async () => {
      const currentUser = getStoredUser();
      
      if (!currentUser) {
        console.log('🔄 LIVME: No user found, waiting...');
        setLoading(false);
        return;
      }
      
      console.log('⚡ LIVME: Fast initialization for user:', currentUser.id);
      
      // 即座にローカルデータを表示
      loadLocalLives();
      setLoading(false);
      
      // 即座にデータベースから取得を開始（リトライ回数を制限）
      const attemptDatabaseFetch = async () => {
        if (retryCount >= maxRetries) {
          console.log('❌ LIVME: Max retries reached, stopping');
          return;
        }
        
        console.log(`📡 LIVME: Database fetch attempt ${retryCount + 1}/${maxRetries}`);
        
        const connectionStatus = getConnectionStatus();
        
        if (connectionStatus) {
          try {
            await fetchLivesFromDatabase();
            console.log('✅ LIVME: Database fetch successful');
          } catch (error) {
            console.log('⚠️ LIVME: Database fetch failed:', error);
            
            // リトライ（回数制限付き）
            if (retryCount < maxRetries - 1 && isMounted) {
              retryCount++;
              const retryDelay = 2000; // 固定2秒
              setTimeout(() => {
                if (isMounted) {
                  attemptDatabaseFetch();
                }
              }, retryDelay);
            }
          }
        }
      };
      
      // 最初の試行
      await attemptDatabaseFetch();
    };
    
    // 即座に実行
    initializeImmediately();
    
    return () => {
      isMounted = false;
    };
    
  }, []); // 空の依存配列で初回のみ実行

  // ライブ追加またはライブ参加（重複検知付き - 新しいAPI使用）
  const addLive = async (liveData: Omit<Live, 'id' | 'attendees'>, userId: string) => {
    try {
      console.log('🎵 LIVME: Adding/joining live...', { liveData, userId });
      
      // 現在のユーザー情報を取得・検証
      const currentUser = getStoredUser();
      if (!currentUser || currentUser.id !== userId) {
        console.error('❌ LIVME: User mismatch in addLive:', { currentUserId: currentUser?.id, requestedUserId: userId });
        toast.error('ユーザー認証エラーが発生しました');
        return { success: false, error: 'ユーザー認証エラー' };
      }

      // データベース接続が利用可能な場合は新しいAPIを使用
      if (getConnectionStatus()) {
        try {
          console.log('🌐 LIVME: Using database API for live creation...');
          const result = await apiCreateLive(liveData, userId);
          
          if (result.isExisting) {
            // 既存のライブに参加した場合
            console.log('🔗 LIVME: Joined existing live:', result.live.id);
            toast.success('同じライブが見つかりました！参加しました');
            
            // 即座にローカル状態を更新
            setLives(prev => {
              const existingIndex = prev.findIndex(live => live.id === result.live.id);
              if (existingIndex >= 0) {
                // 既存のライブを更新
                const updated = [...prev];
                updated[existingIndex] = result.live;
                return updated;
              } else {
                // 新しいライブとして追加
                return [result.live, ...prev];
              }
            });
          } else {
            // 新しいライブを作成した場合
            console.log('✅ LIVME: Created new live:', result.live.id);
            toast.success('ライブを作成しました');
            
            // 即座にローカル状態を更新
            setLives(prev => [result.live, ...prev]);
          }
          
          // ローカルストレージを即座に更新
          setLives(current => {
            const updatedLivesToStore = current.map(live => ({
              id: live.id,
              artist: live.artist,
              date: live.date,
              venue: live.venue,
              description: live.description,
              image_url: live.imageUrl,
              created_by: live.createdBy,
              created_at: live.createdAt,
              updated_at: live.updatedAt
            }));
            storeLives(updatedLivesToStore);
            return current;
          });
          
          // 即座にlive_attendeesの確認と最新データ取得
          try {
            console.log('🔍 LIVME: Verifying live_attendees after add...');
            
            // live_attendeesの存在確認（少し待ってから）
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: attendeeCheck, error: attendeeCheckError } = await safeSupabaseOperation(
              () => supabase
                .from('live_attendees')
                .select('*')
                .eq('live_id', result.live.id)
                .eq('user_id', userId),
              'Check attendee after add',
              [],
              10000
            );
            
            if (attendeeCheckError || !attendeeCheck || attendeeCheck.length === 0) {
              console.log('⚠️ LIVME: Attendee not found, attempting to re-add...');
              // 参加者が見つからない場合、再度挿入を試行
              const { error: reInsertError } = await safeSupabaseOperation(
                () => supabase
                  .from('live_attendees')
                  .insert([{ live_id: result.live.id, user_id: userId }]),
                'Re-insert attendee after add',
                null,
                10000
              );
              
              if (!reInsertError || reInsertError.message.includes('duplicate')) {
                console.log('✅ LIVME: Attendee successfully re-added after live creation');
              } else {
                console.error('❌ LIVME: Failed to re-add attendee after live creation:', reInsertError);
              }
            } else {
              console.log('✅ LIVME: Attendee verified in database after live creation');
            }
            
            // 最新データを取得
            await fetchLivesFromDatabase();
            console.log('🔄 LIVME: Live data refreshed after add verification');
            
          } catch (error) {
            console.error('⚠️ LIVME: Failed to verify/refresh after add:', error);
            // エラーでも一度リフレッシュを試行
            try {
              await fetchLivesFromDatabase();
              console.log('🔄 LIVME: Live data refreshed (fallback after add)');
            } catch (fallbackError) {
              console.error('❌ LIVME: Fallback refresh also failed:', fallbackError);
            }
          }
          
          return { success: true };
        } catch (apiError) {
          console.error('❌ LIVME: API create live error:', apiError);
          // APIエラーの場合はローカル作成にフォールバック
        }
      }

      // ローカル作成（フォールバック）
      console.log('➕ LIVME: Creating live locally...');
      
      const newLiveId = `local-live-${Date.now()}`;
      
      // 作成者として自動的に参加者に追加
      const creatorAttendee = {
        id: userId,
        name: currentUser.name,
        avatar: currentUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
        bio: currentUser.bio || '',
        user_id: currentUser.user_id,
        socialLinks: currentUser.socialLinks || {}
      };
      
      const newLive: Live = {
        id: newLiveId,
        ...liveData,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attendees: [creatorAttendee] // 作成者を必ず参加者として追加
      };

      // 即座にローカル更新
      setLives(prev => [newLive, ...prev]);
      
      // ローカルストレージに即座に保存
      setLives(current => {
        const livesToStore = current.map(live => ({
          id: live.id,
          artist: live.artist,
          date: live.date,
          venue: live.venue,
          description: live.description,
          image_url: live.imageUrl,
          created_by: live.createdBy,
          created_at: live.createdAt,
          updated_at: live.updatedAt
        }));
        storeLives(livesToStore);
        return current;
      });
      
      toast.success('ライブを作成しました');
      return { success: true };
      
    } catch (err: any) {
      console.error('❌ LIVME: Add live error:', err);
      toast.error('ライブの追加に失敗しました');
      return { success: false, error: 'ライブの追加に失敗しました' };
    }
  };

  // ライブ参加（ローカルファースト）
  const joinLive = async (liveId: string, userId: string) => {
    try {
      console.log('👥 LIVME: Joining live...', { liveId, userId });
      
      // 現在のユーザー情報を取得
      const currentUser = getStoredUser();
      if (!currentUser || currentUser.id !== userId) {
        console.error('❌ LIVME: User mismatch:', { currentUserId: currentUser?.id, requestedUserId: userId });
        toast.error('ユーザー認証エラーが発生しました');
        return { success: false, error: 'ユーザー認証エラー' };
      }

      // ライブがローカルにある場合はローカルで更新
      let joinResult = { success: false, alreadyJoined: false, liveFound: false };
      
      // 即座にUIを更新
      setLives(prev => prev.map(live => {
        if (live.id === liveId) {
          joinResult.liveFound = true;
          const isAlreadyJoined = live.attendees.some(a => a.id === userId);
          if (isAlreadyJoined) {
            console.log('ℹ️ LIVME: User already joined this live');
            joinResult = { success: false, alreadyJoined: true, liveFound: true };
            return live;
          }
          
          joinResult = { success: true, alreadyJoined: false, liveFound: true };
          
          // 参加者として追加
          const newAttendee = {
            id: userId,
            name: currentUser.name,
            avatar: currentUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
            bio: currentUser.bio || '',
            user_id: currentUser.user_id,
            socialLinks: currentUser.socialLinks || {}
          };

          console.log('✅ LIVME: Adding attendee to existing live');
          
          return {
            ...live,
            attendees: [...live.attendees, newAttendee]
          };
        }
        return live;
      }));

      // ライブがローカルに見つからない場合、データベースから取得して追加
      if (!joinResult.liveFound && getConnectionStatus() && !liveId.startsWith('local-')) {
        try {
          console.log('🔍 LIVME: Live not found locally, fetching from database...');
          
          // データベースからライブ詳細を取得
          const { data: liveData, error: liveError } = await safeSupabaseOperation(
            () => supabase
              .from('lives')
              .select('*')
              .eq('id', liveId)
              .single(),
            'Fetch live for join',
            null,
            15000
          );

          if (!liveError && liveData) {
            // 参加者を追加
            const newAttendee = {
              id: userId,
              name: currentUser.name,
              avatar: currentUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOTA5MDkwIi8+Cjwvc3ZnPgo=',
              bio: currentUser.bio || '',
              user_id: currentUser.user_id,
              socialLinks: currentUser.socialLinks || {}
            };

            const newLive: Live = {
              id: liveData.id,
              artist: liveData.artist,
              date: liveData.date,
              venue: liveData.venue,
              description: liveData.description || '',
              imageUrl: liveData.image_url || '',
              createdBy: liveData.created_by,
              createdAt: liveData.created_at,
              updatedAt: liveData.updated_at,
              attendees: [newAttendee] // 現在のユーザーを参加者として追加（他の参加者は次回DB同期で取得）
            };

            // 即座にライブを追加
            setLives(prev => [newLive, ...prev]);
            
            // ローカルストレージを即座に更新
            setLives(current => {
              const updatedLivesToStore = current.map(live => ({
                id: live.id,
                artist: live.artist,
                date: live.date,
                venue: live.venue,
                description: live.description,
                image_url: live.imageUrl,
                created_by: live.createdBy,
                created_at: live.createdAt,
                updated_at: live.updatedAt
              }));
              storeLives(updatedLivesToStore);
              return current;
            });

            joinResult = { success: true, alreadyJoined: false, liveFound: true };
          }
        } catch (dbError) {
          console.error('❌ LIVME: Database fetch failed:', dbError);
        }
      }

      if (joinResult.alreadyJoined) {
        toast.info('既に参加しています');
        return { success: false, error: 'Already joined' };
      }

      if (!joinResult.liveFound) {
        toast.error('ライブが見つかりませんでした');
        return { success: false, error: 'Live not found' };
      }

      if (joinResult.success) {
        toast.success('ライブに参加しました');
        
        // ローカルストレージを即座に更新
        setLives(current => {
          const livesToStore = current.map(live => ({
            id: live.id,
            artist: live.artist,
            date: live.date,
            venue: live.venue,
            description: live.description,
            image_url: live.imageUrl,
            created_by: live.createdBy,
            created_at: live.createdAt,
            updated_at: live.updatedAt
          }));
          storeLives(livesToStore);
          return current;
        });
        
        // 即座にデータベースに同期して確認
        if (getConnectionStatus() && !liveId.startsWith('local-')) {
          try {
            console.log('📡 LIVME: Syncing join to database immediately...');
            const { error } = await safeSupabaseOperation(
              () => supabase
                .from('live_attendees')
                .insert([{ live_id: liveId, user_id: userId }]),
              'Immediate join live sync',
              null,
              15000
            );
            
            if (!error) {
              console.log('✅ LIVME: Join successfully synced to database');
              
              // 挿入を確認するための検証クエリ
              const { data: verification, error: verifyError } = await safeSupabaseOperation(
                () => supabase
                  .from('live_attendees')
                  .select('*')
                  .eq('live_id', liveId)
                  .eq('user_id', userId)
                  .single(),
                'Verify join sync',
                null,
                10000
              );
              
              if (verification && !verifyError) {
                console.log('✅ LIVME: Join verification successful');
                // 即座にライブデータを更新
                await fetchLivesFromDatabase();
                console.log('🔄 LIVME: Live data refreshed after join verification');
              } else {
                console.error('❌ LIVME: Join verification failed:', verifyError);
                // 検証に失敗した場合、少し待ってからリフレッシュ
                setTimeout(async () => {
                  try {
                    await fetchLivesFromDatabase();
                    console.log('🔄 LIVME: Live data refreshed after delayed join');
                  } catch (refreshError) {
                    console.error('⚠️ LIVME: Failed to refresh after delayed join:', refreshError);
                  }
                }, 2000);
              }
            } else if (error.message.includes('duplicate') || error.code === '23505') {
              console.log('ℹ️ LIVME: User already joined this live (duplicate ignored)');
              // 重複の場合も最新データを取得
              await fetchLivesFromDatabase();
              console.log('🔄 LIVME: Live data refreshed after duplicate join');
            } else {
              console.error('❌ LIVME: Database join sync failed:', error);
              // エラーの場合、ローカル状態を元に戻す
              setLives(prev => prev.map(live => {
                if (live.id === liveId) {
                  return {
                    ...live,
                    attendees: live.attendees.filter(a => a.id !== userId)
                  };
                }
                return live;
              }));
              throw new Error('データベース同期に失敗しました');
            }
          } catch (syncError) {
            console.error('❌ LIVME: Join sync error:', syncError);
            // エラーの場合、ローカル状態を元に戻す
            setLives(prev => prev.map(live => {
              if (live.id === liveId) {
                return {
                  ...live,
                  attendees: live.attendees.filter(a => a.id !== userId)
                };
              }
              return live;
            }));
            throw syncError;
          }
        }
        
        return { success: true };
      }

      return { success: false, error: 'Join failed' };
    } catch (err: any) {
      console.error('❌ LIVME: Join live error:', err);
      toast.error('ライブ参加に失敗しました');
      return { success: false, error: 'ライブ参加に失敗しました' };
    }
  };

  // ライブ削除（作成者のみ）
  const deleteLive = async (liveId: string, userId: string) => {
    try {
      console.log('🗑️ LIVME: Deleting live...', { liveId, userId });
      
      // 権限チェック
      const liveToDelete = lives.find(live => live.id === liveId);
      if (!liveToDelete) {
        toast.error('ライブが見つかりませんでした');
        return { success: false, error: 'Live not found' };
      }

      if (liveToDelete.createdBy !== userId) {
        toast.error('このライブを削除する権限がありません');
        return { success: false, error: 'No permission' };
      }

      // 即座にローカルから削除
      const updatedLives = lives.filter(live => live.id !== liveId);
      setLives(updatedLives);
      
      // ローカルストレージを即座に更新
      setLives(current => {
        const livesToStore = current.map(live => ({
          id: live.id,
          artist: live.artist,
          date: live.date,
          venue: live.venue,
          description: live.description,
          image_url: live.imageUrl,
          created_by: live.createdBy,
          created_at: live.createdAt,
          updated_at: live.updatedAt
        }));
        storeLives(livesToStore);
        return current;
      });
      
      toast.success('ライブを削除しました');

      // バックグラウンドでデータベースからも削除し、その後最新データを取得
      if (getConnectionStatus() && !liveId.startsWith('local-')) {
        setTimeout(async () => {
          try {
            const { error } = await safeSupabaseOperation(
              () => supabase
                .from('lives')
                .delete()
                .eq('id', liveId)
                .eq('created_by', userId),
              'Background delete live',
              null,
              15000
            );
            
            if (!error) {
              // データベース削除成功の場合、最新データを取得
              try {
                await fetchLivesFromDatabase();
                console.log('🔄 LIVME: Live data refreshed after delete');
              } catch (refreshError) {
                console.error('⚠️ LIVME: Failed to refresh after delete:', refreshError);
              }
            } else {
              console.log('⚠️ LIVME: Background delete failed:', error);
            }
          } catch (bgError) {
            console.log('⚠️ LIVME: Background delete error:', bgError);
          }
        }, 500);
      }

      return { success: true };
    } catch (err: any) {
      console.error('❌ LIVME: Delete live error:', err);
      toast.error('ライブの削除に失敗しました');
      return { success: false, error: 'ライブの削除に失敗しました' };
    }
  };

  // データの再読み込み
  const refreshLives = async () => {
    try {
      setLoading(true);
      await fetchLivesFromDatabase();
    } catch (error) {
      console.error('❌ LIVME: Refresh lives error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 強制リセット（デバッグ用）
  const forceReset = async () => {
    console.log('🔄 LIVME: Force reset initiated');
    setLives([]);
    setError(null);
    setIsUsingFallback(true);
    
    // ローカルストレージもクリア
    const currentUser = getStoredUser();
    if (currentUser?.id) {
      storeLives([]);
    }
    
    // データを再読み込み
    setTimeout(() => {
      loadLocalLives();
      if (getConnectionStatus()) {
        fetchLivesFromDatabase();
      }
    }, 1000);
  };

  return {
    lives,
    loading,
    error,
    addLive,
    joinLive,
    deleteLive,
    refreshLives,
    forceReset,
    isUsingFallback
  };
}