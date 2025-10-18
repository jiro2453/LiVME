// プリセット画像一覧（動物、風景、幾何学模様など）
export const presetAvatars = [
  // 動物
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=150&h=150&fit=crop', // パンダ
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop', // 猫
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=150&h=150&fit=crop', // うさぎ
  'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=150&h=150&fit=crop', // ペンギン
  // 風景
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop', // 山
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=150&h=150&fit=crop', // 湖
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=150&h=150&fit=crop', // 海
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop', // 森
  // 幾何学・抽象
  'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=150&h=150&fit=crop', // 幾何学模様
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', // カラフル抽象
  'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?w=150&h=150&fit=crop', // グラデーション
  'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=150&h=150&fit=crop'  // パターン
];

// DnD用のアイテムタイプ
export const ItemTypes = {
  GALLERY_IMAGE: 'gallery_image'
};

// バリデーション用の定数
export const VALIDATION_RULES = {
  NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 200,
  USER_ID_PATTERN: /^[a-z0-9_]{3,20}$/,
  USER_ID_MIN_LENGTH: 3,
  USER_ID_MAX_LENGTH: 20,
  MAX_GALLERY_IMAGES: 6,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  TAKEN_USER_IDS: ['admin', 'test', 'user', 'livme', 'music']
};