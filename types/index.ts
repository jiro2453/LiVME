export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  images?: string[];
  social_links?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Live {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time?: string;
  venue: string;
  artist_name?: string;
  link?: string;
  created_at: string;
  updated_at: string;
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
