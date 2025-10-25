export interface User {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  avatar?: string;
  images?: any; // jsonb
  social_links?: any; // jsonb
  created_at: string;
  updated_at: string;
}

export interface Live {
  id: string;
  artist: string;
  date: string;
  venue: string;
  description?: string;
  image_url?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface LiveAttendee {
  live_id: string;
  user_id: string;
  joined_at?: string;
  updated_at?: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export interface LiveGroup {
  [key: string]: Live[];
}
