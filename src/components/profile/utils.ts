import { FormData, UserIdStatus } from './types';
import { VALIDATION_RULES } from './constants';

// モバイルデバイス検出関数
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // User Agentによる検出
  const userAgent = window.navigator.userAgent;
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Touch対応の検出
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUserAgent || hasTouchScreen;
};

// フォームバリデーション
export const validateForm = (formData: FormData, userIdStatus: UserIdStatus): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = '名前を入力してください';
  } else if (formData.name.trim().length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    errors.name = '名前は50文字以内で入力してください';
  }

  if (formData.bio.length > VALIDATION_RULES.BIO_MAX_LENGTH) {
    errors.bio = '自己紹介は200文字以内で入力してください';
  }

  // User ID validation (必須)
  if (!formData.user_id.trim()) {
    errors.user_id = 'ユーザーIDは必須です';
  } else if (!VALIDATION_RULES.USER_ID_PATTERN.test(formData.user_id)) {
    errors.user_id = 'ユーザーIDは3-20文字の半角英数字とアンダースコアのみ使用できます';
  }

  if (userIdStatus === 'taken') {
    errors.user_id = 'このユーザーIDは既に使用されています';
  }

  // SNSリンクのバリデーション（@記号の有無をチェック）
  if (formData.twitter && !formData.twitter.startsWith('@')) {
    errors.twitter = 'Twitter名は@から始まる必要があります';
  }
  if (formData.instagram && !formData.instagram.startsWith('@')) {
    errors.instagram = 'Instagram名は@から始まる必要があります';
  }
  if (formData.tiktok && !formData.tiktok.startsWith('@')) {
    errors.tiktok = 'TikTok名は@から始まる必要があります';
  }

  return errors;
};

// User ID フォーマット
export const formatUserId = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

// User ID バリデーション（リアルタイム）
export const validateUserId = async (userId: string): Promise<UserIdStatus> => {
  if (!userId) {
    return 'idle';
  }

  // Basic format validation
  if (!VALIDATION_RULES.USER_ID_PATTERN.test(userId)) {
    return 'error';
  }

  // Mock availability check - in real app this would call an API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, consider some IDs as taken
  const isAvailable = !VALIDATION_RULES.TAKEN_USER_IDS.includes(userId);
  
  return isAvailable ? 'available' : 'taken';
};

// User ID ステータス表示用のヘルパー
export const getUserIdStatusColor = (status: UserIdStatus): string => {
  switch (status) {
    case 'checking': return 'text-blue-500';
    case 'available': return 'text-green-500';
    case 'taken': return 'text-red-500';
    case 'error': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

export const getUserIdStatusIcon = (status: UserIdStatus): string | null => {
  switch (status) {
    case 'available': return '✓';
    case 'taken': return '✗';
    case 'error': return '!';
    default: return null;
  }
};

// ファイルバリデーション
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
    return { isValid: false, error: '画像サイズは5MB以下にしてください' };
  }

  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: '画像ファイルを選択してください' };
  }

  return { isValid: true };
};