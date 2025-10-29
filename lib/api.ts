import { supabase } from './supabase';
import type { User, Live } from '../types';

// User API
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

export const getUserByUserId = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data;
};

// Live API
export const getLivesByUserId = async (userId: string): Promise<Live[]> => {
  const { data, error } = await supabase
    .from('lives')
    .select('*')
    .eq('created_by', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching lives:', error);
    return [];
  }

  return data || [];
};

export const getAllLives = async (): Promise<Live[]> => {
  const { data, error } = await supabase
    .from('lives')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching all lives:', error);
    return [];
  }

  return data || [];
};

export const createLive = async (live: Omit<Live, 'id' | 'created_at' | 'updated_at'>): Promise<Live | null> => {
  const { data, error } = await supabase
    .from('lives')
    .insert(live)
    .select()
    .single();

  if (error) {
    console.error('Error creating live:', error);
    return null;
  }

  return data;
};

export const updateLive = async (liveId: string, updates: Partial<Live>): Promise<Live | null> => {
  const { data, error } = await supabase
    .from('lives')
    .update(updates)
    .eq('id', liveId)
    .select()
    .single();

  if (error) {
    console.error('Error updating live:', error);
    return null;
  }

  return data;
};

export const deleteLive = async (liveId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('lives')
    .delete()
    .eq('id', liveId);

  if (error) {
    console.error('Error deleting live:', error);
    return false;
  }

  return true;
};

// Get users attending the same live event
export const getUsersAttendingSameLive = async (live: Live): Promise<string[]> => {
  // 現在のSupabaseセッションユーザーを確認
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  console.log('Supabaseセッションユーザー:', currentUser?.id);

  console.log('検索条件:', {
    artist: live.artist,
    venue: live.venue,
    date: live.date,
    dateType: typeof live.date
  });

  // まず、すべてのライブを取得して比較
  const { data: allLives, error: allError } = await supabase
    .from('lives')
    .select('*');

  if (allError) {
    console.error('全ライブ取得エラー:', allError);
  }

  if (!allError && allLives) {
    console.log('データベース内の全ライブ数:', allLives.length);
    console.log('全ライブデータ（最初の3件）:', allLives.slice(0, 3));
    console.log('同じアーティストのライブ:');
    const sameArtist = allLives.filter(l =>
      l.artist?.toLowerCase().includes('suchmos') ||
      'suchmos'.includes(l.artist?.toLowerCase())
    );
    console.log('Suchmosのライブ件数:', sameArtist.length);
    console.log('Suchmosの全ライブ:', sameArtist);

    // created_byの一覧を確認
    const createdByList = sameArtist.map(l => l.created_by);
    console.log('Suchmosライブのcreated_byリスト:', createdByList);
    console.log('ユニークなcreated_by数:', new Set(createdByList).size);

    sameArtist.forEach((l, index) => {
      console.log(`[${index + 1}]`, {
        id: l.id,
        artist: l.artist,
        venue: l.venue,
        date: l.date,
        dateType: typeof l.date,
        created_by: l.created_by,
        matches_artist: l.artist === live.artist,
        matches_venue: l.venue === live.venue,
        matches_date: l.date === live.date,
        date_comparison: `DB: ${l.date} vs Query: ${live.date}`
      });
    });
  }

  const { data, error } = await supabase
    .from('lives')
    .select('created_by')
    .eq('artist', live.artist)
    .eq('venue', live.venue)
    .eq('date', live.date);

  if (error) {
    console.error('Error fetching attendees:', error);
    return [];
  }

  console.log('データベースから取得したライブ件数:', data?.length || 0);
  console.log('取得したデータ:', data);

  // Return unique user IDs
  const userIds = data.map(l => l.created_by);
  const uniqueUserIds = [...new Set(userIds)];
  console.log('ユニークなユーザーID:', uniqueUserIds);

  return uniqueUserIds;
};

// Follow API
export const followUser = async (followerId: string, followingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    console.error('Error following user:', error);
    return false;
  }

  return true;
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: followerId, following_id: followingId });

  if (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }

  return true;
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .match({ follower_id: followerId, following_id: followingId })
    .single();

  if (error) {
    return false;
  }

  return !!data;
};

export const getFollowerCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }

  return count || 0;
};

export const getFollowingCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    console.error('Error getting following count:', error);
    return 0;
  }

  return count || 0;
};

// Storage API
export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export const deleteImage = async (path: string): Promise<boolean> => {
  const { error } = await supabase.storage
    .from('images')
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
};
