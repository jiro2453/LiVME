import { supabase } from './supabase';
import { Live, User } from '../types';

// Supabase接続テスト
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Checking Supabase connection...');
    
    // Simple health check query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection check failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection check error:', error);
    return false;
  }
}

// ユーザー関連API
export async function fetchUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function fetchUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// ライブ関連API
export async function fetchLives(): Promise<Live[]> {
  try {
    // ライブ情報と作成者情報を取得
    const { data: livesData, error: livesError } = await supabase
      .from('lives')
      .select(`
        *,
        created_by_user:users!created_by(id, name, avatar)
      `)
      .order('date', { ascending: false });

    if (livesError) {
      throw livesError;
    }

    // 参加者情報を取得
    const { data: attendeesData, error: attendeesError } = await supabase
      .from('live_attendees')
      .select(`
        live_id,
        user_id,
        joined_at,
        user:users(id, name, avatar, bio, social_links)
      `);

    if (attendeesError) {
      throw attendeesError;
    }

    // データを結合
    const lives: Live[] = (livesData || []).map(live => ({
      id: live.id,
      artist: live.artist,
      date: live.date,
      venue: live.venue,
      description: live.description || '',
      imageUrl: live.image_url || '',
      createdBy: live.created_by,
      createdAt: live.created_at,
      updatedAt: live.updated_at,
      attendees: (attendeesData || [])
        .filter(attendee => attendee.live_id === live.id)
        .map(attendee => ({
          id: attendee.user.id,
          name: attendee.user.name,
          avatar: attendee.user.avatar,
          bio: attendee.user.bio || '',
          socialLinks: attendee.user.social_links || {}
        }))
    }));

    return lives;
  } catch (error) {
    console.error('Error fetching lives:', error);
    throw error;
  }
}

// 重複チェック関数
async function findExistingLive(artist: string, date: string, venue: string): Promise<Live | null> {
  try {
    const { data, error } = await supabase
      .from('lives')
      .select(`
        *,
        created_by_user:users!created_by(id, name, avatar)
      `)
      .eq('artist', artist)
      .eq('date', date)
      .eq('venue', venue)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No duplicate found
      }
      throw error;
    }

    // 参加者情報を取得
    const { data: attendeesData, error: attendeesError } = await supabase
      .from('live_attendees')
      .select(`
        live_id,
        user_id,
        joined_at,
        user:users(id, name, avatar, bio, social_links)
      `)
      .eq('live_id', data.id);

    if (attendeesError) {
      throw attendeesError;
    }

    const existingLive: Live = {
      id: data.id,
      artist: data.artist,
      date: data.date,
      venue: data.venue,
      description: data.description || '',
      imageUrl: data.image_url || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      attendees: (attendeesData || []).map(attendee => ({
        id: attendee.user.id,
        name: attendee.user.name,
        avatar: attendee.user.avatar,
        bio: attendee.user.bio || '',
        socialLinks: attendee.user.social_links || {}
      }))
    };

    return existingLive;
  } catch (error) {
    console.error('Error checking for existing live:', error);
    throw error;
  }
}

export async function createLive(liveData: Omit<Live, 'id' | 'attendees'>, userId: string): Promise<{ live: Live; isExisting: boolean }> {
  try {
    // まず重複チェックを実行
    const existingLive = await findExistingLive(liveData.artist, liveData.date, liveData.venue);
    
    if (existingLive) {
      // 既存のライブが見つかった場合、ユーザーが既に参加しているかチェック
      const isAlreadyJoined = existingLive.attendees.some(attendee => attendee.id === userId);
      
      if (!isAlreadyJoined) {
        // 参加していない場合は参加者として追加
        await joinLive(existingLive.id, userId);
        
        // 参加者を更新してライブデータを返す
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar, bio, social_links')
          .eq('id', userId)
          .single();

        if (!userError && userData) {
          existingLive.attendees.push({
            id: userData.id,
            name: userData.name,
            avatar: userData.avatar,
            bio: userData.bio || '',
            socialLinks: userData.social_links || {}
          });
        }
      }
      
      console.log('✅ Found existing live, joined as attendee:', existingLive.id);
      return { live: existingLive, isExisting: true };
    }

    // 重複がない場合は新しいライブを作成
    const { data, error } = await supabase
      .from('lives')
      .insert([{
        artist: liveData.artist,
        date: liveData.date,
        venue: liveData.venue,
        description: liveData.description,
        image_url: liveData.imageUrl,
        created_by: userId
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 作成者を自動的に参加者に追加
    const { error: attendeeError } = await supabase
      .from('live_attendees')
      .insert([{
        live_id: data.id,
        user_id: userId
      }]);

    if (attendeeError) {
      console.error('❌ Failed to add creator as attendee:', attendeeError);
      
      // 重複エラーの場合は無視（既に参加済み）
      if (!attendeeError.message.includes('duplicate') && attendeeError.code !== '23505') {
        // 重複以外のエラーの場合、ライブ作成をロールバック
        console.error('❌ Critical: Creator attendee insertion failed, rolling back live creation');
        await supabase.from('lives').delete().eq('id', data.id);
        throw new Error('ライブ作成時の参加者登録に失敗しました');
      } else {
        console.log('ℹ️ Creator already registered as attendee (duplicate ignored)');
      }
    } else {
      console.log('✅ Creator successfully added as attendee for live:', data.id);
      
      // 挿入を確認するための検証クエリ
      try {
        const { data: verification, error: verifyError } = await supabase
          .from('live_attendees')
          .select('*')
          .eq('live_id', data.id)
          .eq('user_id', userId)
          .single();
        
        if (verification && !verifyError) {
          console.log('✅ Creator attendee insertion verified successfully');
        } else {
          console.error('⚠️ Creator attendee verification failed:', verifyError);
          // 検証に失敗した場合は再試行
          const { error: retryError } = await supabase
            .from('live_attendees')
            .upsert([{ live_id: data.id, user_id: userId }]);
          
          if (!retryError) {
            console.log('✅ Creator attendee re-insertion successful');
          } else {
            console.error('❌ Creator attendee re-insertion failed:', retryError);
          }
        }
      } catch (verifyErr) {
        console.error('❌ Creator attendee verification error:', verifyErr);
      }
    }

    // 作成されたライブデータを返す
    const createdLive: Live = {
      id: data.id,
      artist: data.artist,
      date: data.date,
      venue: data.venue,
      description: data.description || '',
      imageUrl: data.image_url || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      attendees: [] // 後で更新される
    };

    console.log('✅ Created new live:', createdLive.id);
    return { live: createdLive, isExisting: false };
  } catch (error) {
    console.error('Error creating live:', error);
    throw error;
  }
}

export async function joinLive(liveId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_attendees')
      .insert([{
        live_id: liveId,
        user_id: userId
      }]);

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
  } catch (error) {
    console.error('Error joining live:', error);
    throw error;
  }
}

export async function leaveLive(liveId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_attendees')
      .delete()
      .eq('live_id', liveId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error leaving live:', error);
    throw error;
  }
}

export async function deleteLive(liveId: string, userId: string): Promise<void> {
  try {
    // Check if user is the creator
    const { data: liveData, error: fetchError } = await supabase
      .from('lives')
      .select('created_by')
      .eq('id', liveId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (liveData.created_by !== userId) {
      throw new Error('このライブを削除する権限がありません');
    }

    // Delete the live (CASCADE will delete attendees)
    const { error } = await supabase
      .from('lives')
      .delete()
      .eq('id', liveId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting live:', error);
    throw error;
  }
}

// 検索API
export async function searchLives(query: string): Promise<Live[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    // アーティスト名と会場名で検索
    const { data: livesData, error: livesError } = await supabase
      .from('lives')
      .select(`
        *,
        created_by_user:users!created_by(id, name, avatar)
      `)
      .or(`artist.ilike.%${query}%,venue.ilike.%${query}%`)
      .order('date', { ascending: false });

    if (livesError) {
      throw livesError;
    }

    // 参加者情報を取得
    const liveIds = (livesData || []).map(live => live.id);
    let attendeesData: any[] = [];
    
    if (liveIds.length > 0) {
      const { data, error: attendeesError } = await supabase
        .from('live_attendees')
        .select(`
          live_id,
          user_id,
          joined_at,
          user:users(id, name, avatar, bio, social_links)
        `)
        .in('live_id', liveIds);

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
        .map(attendee => ({
          id: attendee.user.id,
          name: attendee.user.name,
          avatar: attendee.user.avatar,
          bio: attendee.user.bio || '',
          socialLinks: attendee.user.social_links || {}
        }))
    }));

    return searchResults;
  } catch (error) {
    console.error('Error searching lives:', error);
    throw error;
  }
}