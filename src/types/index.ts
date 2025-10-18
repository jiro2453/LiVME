// User type definition
export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  user_id?: string; // Optional unique user ID
  images?: string[]; // Gallery images (max 6)
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Live type definition
export interface Live {
  id: string;
  artist: string;
  date: string; // ISO date string
  venue: string;
  description: string;
  imageUrl: string;
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  attendees: User[];
}

// Live attendee relationship
export interface LiveAttendee {
  liveId: string;
  userId: string;
  joinedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form data types
export interface LiveFormData {
  artist: string;
  date: string;
  venue: string;
  description: string;
  imageUrl: string;
}

export interface UserFormData {
  name: string;
  bio: string;
  avatar: string;
  user_id?: string;
  images?: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Search types
export interface SearchFilters {
  artist?: string;
  venue?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResults {
  lives: Live[];
  users: User[];
  total: number;
}

// Notification types
export interface NotificationSettings {
  liveReminders: boolean;
  newLiveNotifications: boolean;
  emailNotifications: boolean;
}

export interface AppSettings {
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Component prop types
export interface LiveCardProps {
  live: Live;
  onJoin: () => void;
  onViewAttendees: () => void;
  onDelete?: () => void;
  isJoined: boolean;
  isPast: boolean;
}

export interface ProfileModalProps {
  user: User;
  currentUser: User;
  lives: Live[];
  onClose: () => void;
  onUpdateUser: (user: User) => void;
}

export interface AddLiveModalProps {
  onClose: () => void;
  onAdd: (liveData: Omit<Live, 'id' | 'attendees'>) => void;
  isPastMode: boolean;
}

// Hook return types
export interface UseLivesReturn {
  lives: Live[];
  loading: boolean;
  error: string | null;
  addLive: (liveData: Omit<Live, 'id' | 'attendees'>, userId: string) => Promise<{ success: boolean; error?: string }>;
  joinLive: (liveId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  deleteLive: (liveId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  refreshLives: () => Promise<void>;
}

export interface UseSearchReturn {
  livesResults: Live[];
  loading: boolean;
  error: string | null;
  searchLives: (query: string) => Promise<void>;
  clearResults: () => void;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  isMockMode: boolean;
}

// Database types (matching Supabase schema)
export interface DbUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  user_id: string | null;
  images: string[] | null;
  social_links: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DbLive {
  id: string;
  artist: string;
  date: string;
  venue: string;
  description: string;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbLiveAttendee {
  live_id: string;
  user_id: string;
  joined_at: string;
}

// Utility types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};