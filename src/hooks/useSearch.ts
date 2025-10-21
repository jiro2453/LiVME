import { useState, useCallback } from 'react';
import { Live } from '../types';
import { supabase, getStoredUser } from '../lib/supabase';

interface UseSearchResult {
  livesResults: Live[];
  loading: boolean;
  error: string | null;
  searchLives: (query: string) => Promise<void>;
  clearResults: () => void;
}

export function useSearch(): UseSearchResult {
  const [livesResults, setLivesResults] = useState<Live[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLives = useCallback(async (query: string) => {
    if (!query.trim()) {
      setLivesResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 現在のユーザーIDを取得
      const currentUser = getStoredUser();
      const currentUserId = currentUser?.id;
      
      if (!currentUserId || currentUserId.startsWith('local-user-')) {
        console.log('⚠️ No valid user ID for search, showing empty results');
        setLivesResults([]);
        return;
      }

      console.log(`🔍 Searching lives for user ${currentUserId} with query: "${query}"`);

      // まず、ユーザーが参加しているライブIDを取得
      const { data: userAttendance, error: attendanceError } = await supabase
        .from('live_attendees')
        .select('live_id')
        .eq('user_id', currentUserId);

      if (attendanceError) {
        throw attendanceError;
      }

      const userLiveIds = (userAttendance || []).map(item => item.live_id);
      
      if (userLiveIds.length === 0) {
        console.log('🔍 User is not attending any lives, search returns empty');
        setLivesResults([]);
        return;
      }

      // ユーザーが参加しているライブの中から検索
      const { data: livesData, error: livesError } = await supabase
        .from('lives')
        .select(`
          *,
          created_by_user:users!created_by(id, name, avatar)
        `)
        .in('id', userLiveIds)
        .or(`artist.ilike.%${query}%,venue.ilike.%${query}%`)
        .order('date', { ascending: false });

      if (livesError) {
        throw livesError;
      }

      // 参加者情報を取得
      const foundLiveIds = (livesData || []).map(live => live.id);
      let attendeesData: any[] = [];
      
      if (foundLiveIds.length > 0) {
        const { data, error: attendeesError } = await supabase
          .from('live_attendees')
          .select(`
            live_id,
            user_id,
            joined_at,
            user:users(id, name, avatar, bio, social_links)
          `)
          .in('live_id', foundLiveIds);

        if (attendeesError) {
          throw attendeesError;
        }
        
        attendeesData = data || [];
      }

      // データを結合
      const searchResults: Live[] = (livesData || []).map(live => ({
        id: live.id,
        artist: live.artist,
        date: live.date,
        venue: live.venue,
        description: live.description || '',
        imageUrl: live.image_url || '',
        createdBy: live.created_by,
        createdAt: live.created_at,
        updatedAt: live.updated_at,
        attendees: attendeesData
          .filter(attendee => attendee.live_id === live.id)
          .map(attendee => {
            const user = Array.isArray(attendee.user) ? attendee.user[0] : attendee.user;
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              bio: user.bio || '',
              socialLinks: user.social_links || {}
            };
          })
      }));

      console.log(`🔍 Search found ${searchResults.length} matching user lives`);
      setLivesResults(searchResults);
    } catch (err) {
      console.error('❌ Error searching user lives:', err);
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setLivesResults([]);
    setError(null);
  }, []);

  return {
    livesResults,
    loading,
    error,
    searchLives,
    clearResults
  };
}