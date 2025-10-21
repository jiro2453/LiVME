// Re-export types from main types file to avoid duplication
export type { User, Live, ProfileModalProps } from '../../types';

export interface FormData {
  name: string;
  bio: string;
  user_id: string;
  link: string;
  twitter: string;
  instagram: string;
  tiktok: string;
}

export type UserIdStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export interface DraggableGalleryImageProps {
  image: string;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
  isEditing: boolean;
}

export interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  title?: string;
}