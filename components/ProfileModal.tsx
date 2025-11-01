import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon
} from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '../hooks/useToast';
import { getUserByUserId, updateUserProfile, checkUserIdAvailability } from '../lib/api';
import type { User } from '../types';

// TikTok Icon Component
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Validation Rules
const VALIDATION_RULES = {
  MAX_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 200,
  MAX_GALLERY_IMAGES: 6,
  MIN_USER_ID_LENGTH: 3,
  MAX_USER_ID_LENGTH: 30,
  USER_ID_REGEX: /^[a-zA-Z0-9_]+$/,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// User ID Status Type
type UserIdStatus = 'available' | 'taken' | 'checking' | 'invalid' | 'idle';

// Form Data Interface
interface FormData {
  name: string;
  user_id: string;
  bio: string;
  link: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  avatar: string;
  galleryImages: string[];
}

// Errors Interface
interface FormErrors {
  name?: string;
  user_id?: string;
  bio?: string;
  link?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  currentUserId?: string;
  isOwnProfile: boolean;
}

// Preset avatar URLs
const presetAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Princess',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Missy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sammy',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentUserId,
  isOwnProfile,
}) => {
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    user_id: '',
    bio: '',
    link: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    avatar: '',
    galleryImages: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [userIdStatus, setUserIdStatus] = useState<UserIdStatus>('idle');
  const [isCheckingUserId, setIsCheckingUserId] = useState(false);

  const { toast } = useToast();
  const userIdCheckTimeout = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const originalUserId = useRef<string>('');

  // Load profile data
  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const userData = await getUserByUserId(userId);
      if (userData) {
        setDisplayUser(userData);
        originalUserId.current = userData.user_id;
        setFormData({
          name: userData.name || '',
          user_id: userData.user_id || '',
          bio: userData.bio || '',
          link: userData.link || '',
          instagram: userData.socialLinks?.instagram || '',
          twitter: userData.socialLinks?.twitter || '',
          tiktok: userData.socialLinks?.tiktok || '',
          avatar: userData.avatar || '',
          galleryImages: userData.galleryImages || [],
        });
        setSelectedAvatar(userData.avatar || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'エラー',
        description: 'プロフィールの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // User ID Status Helpers
  const getUserIdStatusColor = (status: UserIdStatus): string => {
    switch (status) {
      case 'available':
        return 'text-green-500';
      case 'taken':
        return 'text-red-500';
      case 'checking':
        return 'text-blue-500';
      case 'invalid':
        return 'text-orange-500';
      default:
        return 'text-gray-400';
    }
  };

  const getUserIdStatusIcon = (status: UserIdStatus): JSX.Element | null => {
    switch (status) {
      case 'available':
        return <Check className="w-3 h-3" />;
      case 'taken':
        return <X className="w-3 h-3" />;
      case 'invalid':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Validation
  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return '名前は必須です';
        if (value.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
          return `名前は${VALIDATION_RULES.MAX_NAME_LENGTH}文字以内で入力してください`;
        }
        break;

      case 'user_id':
        if (!value.trim()) return 'ユーザーIDは必須です';
        if (value.length < VALIDATION_RULES.MIN_USER_ID_LENGTH) {
          return `ユーザーIDは${VALIDATION_RULES.MIN_USER_ID_LENGTH}文字以上で入力してください`;
        }
        if (value.length > VALIDATION_RULES.MAX_USER_ID_LENGTH) {
          return `ユーザーIDは${VALIDATION_RULES.MAX_USER_ID_LENGTH}文字以内で入力してください`;
        }
        if (!VALIDATION_RULES.USER_ID_REGEX.test(value)) {
          return 'ユーザーIDは英数字とアンダースコアのみ使用できます';
        }
        break;

      case 'bio':
        if (value.length > VALIDATION_RULES.MAX_BIO_LENGTH) {
          return `自己紹介は${VALIDATION_RULES.MAX_BIO_LENGTH}文字以内で入力してください`;
        }
        break;

      case 'link':
        if (value && !value.match(/^https?:\/\/.+/)) {
          return '有効なURLを入力してください（https://...）';
        }
        break;
    }
    return undefined;
  };

  // Check User ID Availability (debounced)
  const checkUserId = useCallback(async (userId: string) => {
    if (userId === originalUserId.current) {
      setUserIdStatus('idle');
      return;
    }

    setIsCheckingUserId(true);
    setUserIdStatus('checking');

    try {
      const isAvailable = await checkUserIdAvailability(userId);
      setUserIdStatus(isAvailable ? 'available' : 'taken');
    } catch (error) {
      setUserIdStatus('invalid');
    } finally {
      setIsCheckingUserId(false);
    }
  }, []);

  // Handle Input Change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate field
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));

    // Check user ID availability
    if (field === 'user_id') {
      if (userIdCheckTimeout.current) {
        clearTimeout(userIdCheckTimeout.current);
      }

      const validationError = validateField('user_id', value);
      if (!validationError && value !== originalUserId.current) {
        userIdCheckTimeout.current = setTimeout(() => {
          checkUserId(value);
        }, 500);
      } else {
        setUserIdStatus(validationError ? 'invalid' : 'idle');
      }
    }
  };

  // Handle Avatar Selection
  const handleSelectAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
    setFormData(prev => ({ ...prev, avatar }));
    setShowAvatarSelector(false);
  };

  // Trigger File Upload
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerGalleryUpload = () => {
    galleryInputRef.current?.click();
  };

  // Handle Avatar File Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
      toast({
        title: 'エラー',
        description: 'ファイルサイズは5MB以下にしてください',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setSelectedAvatar(result);
      setFormData(prev => ({ ...prev, avatar: result }));
      setShowAvatarSelector(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle Gallery Upload
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentCount = formData.galleryImages.length;
    const availableSlots = VALIDATION_RULES.MAX_GALLERY_IMAGES - currentCount;

    if (files.length > availableSlots) {
      toast({
        title: 'エラー',
        description: `ギャラリーは最大${VALIDATION_RULES.MAX_GALLERY_IMAGES}枚までです`,
        variant: 'destructive',
      });
      return;
    }

    files.forEach(file => {
      if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
        toast({
          title: 'エラー',
          description: 'ファイルサイズは5MB以下にしてください',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove Gallery Image
  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  // Edit Gallery Image
  const handleEditGalleryImage = (index: number) => {
    // For now, just allow re-upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
        toast({
          title: 'エラー',
          description: 'ファイルサイズは5MB以下にしてください',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => {
          const newImages = [...prev.galleryImages];
          newImages[index] = result;
          return { ...prev, galleryImages: newImages };
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Save Profile
  const handleSave = async () => {
    // Validate all fields
    const newErrors: FormErrors = {};
    let hasErrors = false;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key as keyof FormData, formData[key as keyof FormData] as string);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      toast({
        title: 'エラー',
        description: '入力内容を確認してください',
        variant: 'destructive',
      });
      return;
    }

    if (userIdStatus === 'taken') {
      toast({
        title: 'エラー',
        description: 'このユーザーIDは既に使用されています',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (currentUserId) {
        await updateUserProfile(currentUserId, {
          name: formData.name,
          user_id: formData.user_id,
          bio: formData.bio,
          link: formData.link,
          avatar: formData.avatar,
          galleryImages: formData.galleryImages,
          socialLinks: {
            instagram: formData.instagram,
            twitter: formData.twitter,
            tiktok: formData.tiktok,
          },
        });

        toast({
          title: '保存しました',
          description: 'プロフィールを更新しました',
          variant: 'success',
        });

        setIsEditing(false);
        await loadProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'エラー',
        description: 'プロフィールの保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel Editing
  const handleCancel = () => {
    if (displayUser) {
      setFormData({
        name: displayUser.name || '',
        user_id: displayUser.user_id || '',
        bio: displayUser.bio || '',
        link: displayUser.link || '',
        instagram: displayUser.socialLinks?.instagram || '',
        twitter: displayUser.socialLinks?.twitter || '',
        tiktok: displayUser.socialLinks?.tiktok || '',
        avatar: displayUser.avatar || '',
        galleryImages: displayUser.galleryImages || [],
      });
      setSelectedAvatar(displayUser.avatar || '');
    }
    setErrors({});
    setUserIdStatus('idle');
    setIsEditing(false);
  };

  if (loading || !displayUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-28 h-28 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => isEditing && setShowAvatarSelector(true)}>
                <AvatarImage src={isEditing ? selectedAvatar : displayUser.avatar} />
                <AvatarFallback className="bg-gray-400 text-white text-3xl">
                  {(isEditing ? formData.name : displayUser.name)?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <Button
                  onClick={() => setShowAvatarSelector(true)}
                  variant="outline"
                  className="rounded-full border-2 border-primary bg-white text-primary hover:bg-primary/5 px-6 py-2"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  プロフィール画像を変更
                </Button>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label className="text-black font-medium text-center block">名前</Label>
              {isEditing ? (
                <>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-12 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                    placeholder="NAME"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-destructive text-sm"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </>
              ) : (
                <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4 text-black">
                  {displayUser.name}
                </div>
              )}
            </div>

            {/* User ID Field */}
            <div className="space-y-2">
              <Label className="text-black font-medium text-center block">ユーザーID *</Label>
              {isEditing ? (
                <>
                  <div className="relative">
                    {/* @ Mark */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      @
                    </div>

                    {/* Input Field */}
                    <Input
                      value={formData.user_id}
                      onChange={(e) => handleInputChange('user_id', e.target.value)}
                      className="h-12 pl-12 pr-12 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                      placeholder="例: music_lover123"
                    />

                    {/* Status Icon */}
                    {formData.user_id && (
                      <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center ${getUserIdStatusColor(userIdStatus)}`}>
                        {userIdStatus === 'checking' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          getUserIdStatusIcon(userIdStatus)
                        )}
                      </div>
                    )}
                  </div>
                  {errors.user_id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-destructive text-sm text-center"
                    >
                      {errors.user_id}
                    </motion.p>
                  )}
                </>
              ) : (
                <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                  <span className="text-gray-500 font-medium mr-2">@</span>
                  <span className={displayUser.user_id ? "text-black" : "text-gray-500"}>
                    {displayUser.user_id || '未設定'}
                  </span>
                </div>
              )}
            </div>

            {/* Bio Field */}
            <div className="space-y-2">
              <Label className="text-black font-medium text-center block">自己紹介</Label>
              {isEditing ? (
                <>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder={!formData.bio ? "未設定" : "自己紹介を入力してください"}
                    className="min-h-20 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-400"
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{formData.bio.length}/{VALIDATION_RULES.MAX_BIO_LENGTH}文字</span>
                    {errors.bio && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-destructive"
                      >
                        {errors.bio}
                      </motion.span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {displayUser.bio && (
                    <div className="min-h-20 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                      <span className="text-black">
                        {displayUser.bio}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Link Field */}
            <div className="space-y-2">
              <Label className="text-black font-medium text-center block">リンク</Label>
              {isEditing ? (
                <>
                  <Input
                    value={formData.link}
                    onChange={(e) => handleInputChange('link', e.target.value)}
                    placeholder="例: https://example.com"
                    className="h-12 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                  />
                  {errors.link && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-destructive text-sm text-center"
                    >
                      {errors.link}
                    </motion.p>
                  )}
                </>
              ) : (
                <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                  {displayUser.link ? (
                    <a
                      href={displayUser.link.startsWith('http') ? displayUser.link : `https://${displayUser.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {displayUser.link}
                    </a>
                  ) : (
                    <span className="text-gray-500">未設定</span>
                  )}
                </div>
              )}
            </div>

            {/* Gallery Section */}
            <div className="space-y-2">
              <Label className="text-black font-medium text-center block">
                {isEditing ? `ギャラリー（最大${VALIDATION_RULES.MAX_GALLERY_IMAGES}枚）` : 'ギャラリー'}
              </Label>

              {isEditing ? (
                <>
                  {/* Gallery Upload Button */}
                  <Button
                    onClick={triggerGalleryUpload}
                    variant="outline"
                    className="w-full h-12 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
                    disabled={formData.galleryImages.length >= VALIDATION_RULES.MAX_GALLERY_IMAGES}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    ギャラリーを追加
                  </Button>

                  {/* Gallery Images Grid/Flex */}
                  {formData.galleryImages.length > 0 && (
                    formData.galleryImages.length >= 3 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {formData.galleryImages.map((image, index) => (
                          <GalleryImageItem
                            key={`${image}-${index}`}
                            image={image}
                            index={index}
                            onRemove={handleRemoveGalleryImage}
                            onEdit={handleEditGalleryImage}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        {formData.galleryImages.map((image, index) => (
                          <div key={`${image}-${index}`} className="w-20 h-20">
                            <GalleryImageItem
                              image={image}
                              index={index}
                              onRemove={handleRemoveGalleryImage}
                              onEdit={handleEditGalleryImage}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  {displayUser.galleryImages && displayUser.galleryImages.length > 0 ? (
                    displayUser.galleryImages.length >= 3 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {displayUser.galleryImages.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-primary">
                            <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        {displayUser.galleryImages.map((image, index) => (
                          <div key={index} className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary">
                            <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="h-20 rounded-lg border-2 border-primary bg-white flex items-center justify-center">
                      <span className="text-gray-500">未設定</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* SNS Links Section */}
            <div className="space-y-4">
              <Label className="text-black font-medium text-center block">SNSリンク</Label>

              {/* Instagram */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="relative">
                    {/* SNS Icon */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                      <InstagramIcon className="w-4 h-4" />
                    </div>

                    {/* Input Field */}
                    <Input
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@livme"
                      className="h-12 pl-16 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                    />
                  </div>
                ) : (
                  <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mr-4">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                    <span className={displayUser.socialLinks?.instagram ? "text-black" : "text-gray-500"}>
                      {displayUser.socialLinks?.instagram || '未設定'}
                    </span>
                  </div>
                )}
              </div>

              {/* X (Twitter) */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                      <TwitterIcon className="w-4 h-4" />
                    </div>
                    <Input
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="@livme"
                      className="h-12 pl-16 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                    />
                  </div>
                ) : (
                  <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-4">
                      <TwitterIcon className="w-4 h-4" />
                    </div>
                    <span className={displayUser.socialLinks?.twitter ? "text-black" : "text-gray-500"}>
                      {displayUser.socialLinks?.twitter || '未設定'}
                    </span>
                  </div>
                )}
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                      <TikTokIcon />
                    </div>
                    <Input
                      value={formData.tiktok}
                      onChange={(e) => handleInputChange('tiktok', e.target.value)}
                      placeholder="@livme"
                      className="h-12 pl-16 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                    />
                  </div>
                ) : (
                  <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-4">
                      <TikTokIcon />
                    </div>
                    <span className={displayUser.socialLinks?.tiktok ? "text-black" : "text-gray-500"}>
                      {displayUser.socialLinks?.tiktok || '未設定'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex gap-3 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-primary text-white rounded-full px-8 py-3 hover:bg-primary/90"
                      disabled={isSaving || isCheckingUserId || userIdStatus === 'taken'}
                    >
                      {isSaving ? '保存中...' : '保存する'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 rounded-full px-6 py-3"
                      disabled={isSaving}
                    >
                      キャンセル
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-primary text-white rounded-full px-8 py-3 hover:bg-primary/90"
                  >
                    プロフィール編集
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Selector Modal */}
      <AnimatePresence>
        {showAvatarSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAvatarSelector(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="bg-background rounded-xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">プロフィール画像を選択</h3>
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Button */}
              <motion.button
                onClick={triggerFileUpload}
                className="w-full p-4 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">画像をアップロード</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF (最大5MB)</p>
                </div>
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {/* Preset Avatars */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-3">プリセット画像</p>
                <div className="grid grid-cols-3 gap-3">
                  {presetAvatars.map((avatar, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectAvatar(avatar)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 hover:border-primary transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        borderColor: selectedAvatar === avatar ? '#78B159' : 'transparent'
                      }}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar option ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar === avatar && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                        >
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Gallery Image Item Component
interface GalleryImageItemProps {
  image: string;
  index: number;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
}

const GalleryImageItem: React.FC<GalleryImageItemProps> = ({
  image,
  index,
  onRemove,
  onEdit,
}) => {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary group">
      <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />

      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={() => onEdit(index)}
          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
        >
          <Edit2 className="w-4 h-4 text-black" />
        </button>
        <button
          onClick={() => onRemove(index)}
          className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};
