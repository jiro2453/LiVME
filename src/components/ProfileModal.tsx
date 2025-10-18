import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, ExternalLink, User, Camera, Check, Upload, Image, MapPin, Bug, Loader2, Trash2, Plus } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { DatabaseErrorDebug } from './DatabaseErrorDebug';
import { LiveCard } from './LiveCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AdSlot } from './AdSlot';
import instagramIcon from 'figma:asset/2701450987b923309cd46b9ff536dccf8b5279ef.png';
import xIcon from 'figma:asset/60334a3695e4d7c94f8800699c7f2b365f0951d9.png';
import tiktokIcon from 'figma:asset/69e18633047e5c183db56b8e6c727deeaf5b843c.png';
import { groupLivesByYearMonth, formatYearMonth } from '../utils/liveGrouping';

// Extracted components and utilities
import { ProfileModalProps, FormData, UserIdStatus, User } from './profile/types';
import { presetAvatars, VALIDATION_RULES } from './profile/constants';
import { InstagramIcon, TwitterIcon, TikTokIcon } from './profile/SNSIcons';
import { DraggableGalleryImage } from './profile/DraggableGalleryImage';
import { ImageCropModal } from './profile/ImageCropModal';
import { 
  isMobileDevice, 
  validateForm, 
  formatUserId, 
  validateUserId, 
  getUserIdStatusColor, 
  getUserIdStatusIcon,
  validateImageFile 
} from './profile/utils';

export function ProfileModal({ user, currentUser, lives = [], onClose, onUpdateUser, onViewLive }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);
  const [showErrorDebug, setShowErrorDebug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // DnD backend selection based on device type
  const dndBackend = isMobileDevice() ? TouchBackend : HTML5Backend;
  const dndOptions = isMobileDevice() ? { enableMouseEvents: true } : {};
  
  // Image gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    return user.images || [];
  });
  const [showImageGallery, setShowImageGallery] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  
  // Image crop states
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [cropType, setCropType] = useState<'avatar' | 'gallery'>('avatar');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  // 表示用のユーザーデータ（リアルタイム更新）
  const [displayUser, setDisplayUser] = useState(user);
  
  const [formData, setFormData] = useState<FormData>({
    name: user.name,
    bio: user.bio || '',
    user_id: user.user_id || '',
    link: user.link || '',
    twitter: user.socialLinks?.twitter || '',
    instagram: user.socialLinks?.instagram || '',
    tiktok: user.socialLinks?.tiktok || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUserId, setIsCheckingUserId] = useState(false);
  const [userIdStatus, setUserIdStatus] = useState<UserIdStatus>('idle');

  // デバウンス用のタイマー参照
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // モバイル判定は削除（スクロール機能を完全に無効化するため）

  // propsのuserが変更されたときに表示用データと入力フォームを更新
  // ただし、編集中は更新しない（ユーザーの編集内容を保持）
  useEffect(() => {
    // 編集中でない場合のみ更新
    if (!isEditing) {
      setDisplayUser(user);
      setFormData({
        name: user.name,
        bio: user.bio || '',
        user_id: user.user_id || '',
        link: user.link || '',
        twitter: user.socialLinks?.twitter || '',
        instagram: user.socialLinks?.instagram || '',
        tiktok: user.socialLinks?.tiktok || ''
      });
      setSelectedAvatar(user.avatar);
      setUploadedImage(null);
      
      // ギャラリー画像を確実に更新
      const userImages = user.images || [];
      console.log('🖼️ ProfileModal: Setting gallery images:', userImages.length, userImages);
      setGalleryImages(userImages);
    } else {
      console.log('⏸️ ProfileModal: Skipping update - currently editing');
    }
  }, [user, isEditing]);

  // 自分のプロフィールかどうかを判定
  const isOwnProfile = currentUser?.id === user.id;

  // このユーザーが参加している公演を取得
  const userLives = lives.filter(live => 
    live.attendees.some(attendee => attendee.id === user.id)
  );

  // 昨日の日付を取得
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // 公演を過去と未来に分ける
  const futureLives = userLives
    .filter(live => new Date(live.date) > yesterday)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const pastLives = userLives
    .filter(live => new Date(live.date) <= yesterday)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group past lives by year and month
  const groupedPastLives = groupLivesByYearMonth(pastLives);

  // Generate default values for accordion (all sections open)
  const accordionDefaultValues = Object.keys(groupedPastLives)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map(year => 
      Object.keys(groupedPastLives[year])
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map(month => `${year}-${month}`)
    ).flat();

  const handleSave = async () => {
    const validationErrors = validateForm(formData, userIdStatus);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedUser: User = {
        ...user,
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        user_id: formData.user_id.trim(),
        link: formData.link.trim() || undefined,
        avatar: selectedAvatar,
        images: galleryImages,
        socialLinks: {
          twitter: formData.twitter.trim() || undefined,
          instagram: formData.instagram.trim() || undefined,
          tiktok: formData.tiktok.trim() || undefined,
        }
      };

      // Manual save triggered

      // 即座にローカル表示を更新（楽観的更新）
      setDisplayUser(updatedUser);

      // AuthContextの高速更新を実行
      const updates = {
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        user_id: formData.user_id.trim(),
        link: formData.link.trim() || undefined,
        avatar: selectedAvatar,
        images: galleryImages,
        socialLinks: {
          twitter: formData.twitter.trim() || undefined,
          instagram: formData.instagram.trim() || undefined,
          tiktok: formData.tiktok.trim() || undefined,
        }
      };
      await onUpdateUser(updates);
      
      // Profile update successful
      
      // クリーンアップと終了処理
      setIsEditing(false);
      setShowAvatarSelector(false);
      
      // 成功フィードバック
      toast.success('プロフィールを保存しました', { 
        duration: 2000 
      });
      
    } catch (error: any) {
      setSaveError(error);
      
      // データベース制約エラーの場合はエラーデバッグを表示
      if (error?.message?.includes('constraint') || 
          error?.message?.includes('not-null') ||
          error?.message?.includes('violates')) {
        setShowErrorDebug(true);
      }
      
      // エラーが発生した場合は元の表示に戻す
      setDisplayUser(user);
      // エラーメッセージを表示
      toast.error('プロフィール保存に失敗しました', {
        description: error?.message || '不明なエラーが発生しました'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    
    setFormData({
      name: user.name,
      bio: user.bio || '',
      user_id: user.user_id || '',
      link: user.link || '',
      twitter: user.socialLinks?.twitter || '',
      instagram: user.socialLinks?.instagram || '',
      tiktok: user.socialLinks?.tiktok || ''
    });
    setSelectedAvatar(user.avatar);
    setUploadedImage(null);
    setGalleryImages(user.images || []);
    setErrors({});
    setSaveError(null);
    setIsEditing(false);
    setShowAvatarSelector(false);
    setShowImageGallery(false);
    setDisplayUser(user);
  };

  const handleInputChange = (field: string, value: string) => {
    // User ID specific formatting
    if (field === 'user_id') {
      value = formatUserId(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // 即座にローカルプレビューを更新
    const previewUser = {
      ...displayUser,
      [field === 'twitter' || field === 'instagram' || field === 'tiktok' 
        ? 'socialLinks' 
        : field]: 
      field === 'twitter' || field === 'instagram' || field === 'tiktok' 
        ? { ...displayUser.socialLinks || {}, [field]: value.trim() || undefined }
        : value.trim() || (field === 'bio' || field === 'user_id' ? undefined : displayUser[field as keyof User])
    };
    setDisplayUser(previewUser);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setUploadedImage(null);
    
    // アバターのリアルタイムプレビュー（編集中のみ）
    if (isEditing) {
      setDisplayUser(prev => ({ ...prev, avatar: avatarUrl }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        // クロップモーダルを表示
        setCropImageSrc(imageUrl);
        setCropType('avatar');
        setShowImageCrop(true);
        setShowAvatarSelector(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Gallery image handlers
  const handleGalleryImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (galleryImages.length >= VALIDATION_RULES.MAX_GALLERY_IMAGES) {
      toast.error('画像は最大6枚まで登録できます');
      return;
    }

    const file = files[0]; // 一枚ずつ処理
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        // クロップモーダルを表示
        setCropImageSrc(imageUrl);
        setCropType('gallery');
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);
  };

  const handleReorderGalleryImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...galleryImages];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    setGalleryImages(newImages);
  };

  const triggerGalleryUpload = () => {
    galleryFileInputRef.current?.click();
  };

  // ギャラリー画像編集ハンドラー
  const handleEditGalleryImage = (index: number) => {
    const imageToEdit = galleryImages[index];
    if (imageToEdit) {
      setCropImageSrc(imageToEdit);
      setCropType('gallery');
      setEditingImageIndex(index);
      setShowImageCrop(true);
    }
  };

  const retryProfileUpdate = async () => {
    setShowErrorDebug(false);
    setSaveError(null);
    await handleSave();
  };

  // Image crop complete handlers
  const handleCropComplete = (croppedImage: string) => {
    if (cropType === 'avatar') {
      setSelectedAvatar(croppedImage);
      setUploadedImage(croppedImage);
      setShowImageCrop(false);
      
      if (isEditing) {
        setDisplayUser(prev => ({ ...prev, avatar: croppedImage }));
      }
      
      setShowAvatarSelector(true); // アバターセレクターに戻る
    } else if (cropType === 'gallery') {
      if (editingImageIndex !== null) {
        // 既存画像の編集
        const newImages = [...galleryImages];
        newImages[editingImageIndex] = croppedImage;
        setGalleryImages(newImages);
        
        // Gallery image edited
      } else {
        // 新規画像追加
        if (galleryImages.length >= VALIDATION_RULES.MAX_GALLERY_IMAGES) {
          toast.error('画像は最大6枚まで登録できます');
          return;
        }
        
        const newImages = [...galleryImages, croppedImage];
        setGalleryImages(newImages);
      }
    }
    
    setShowImageCrop(false);
    setCropImageSrc('');
    setEditingImageIndex(null);
  };

  const handleCropCancel = () => {
    setShowImageCrop(false);
    setCropImageSrc('');
    setEditingImageIndex(null);
    if (cropType === 'avatar') {
      setShowAvatarSelector(true); // アバターセレクターに戻る
    }
  };

  // LiveCardクリック時のハンドラー
  const handleLiveClick = (live: any) => {
    if (onViewLive) {
      onViewLive(live);
    }
  };

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // User ID validation with debouncing
  useEffect(() => {
    if (!formData.user_id || formData.user_id === user.user_id) {
      setUserIdStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUserId(true);
      setUserIdStatus('checking');
      
      try {
        const status = await validateUserId(formData.user_id);
        setUserIdStatus(status);
        
        if (status === 'error') {
          setErrors(prev => ({
            ...prev,
            user_id: 'ユーザーIDは3-20文字の半角英数字とアンダースコアのみ使用できます'
          }));
        } else if (status === 'taken') {
          setErrors(prev => ({
            ...prev,
            user_id: 'このユーザーIDは既に使用されています'
          }));
        } else if (status === 'available') {
          setErrors(prev => ({ ...prev, user_id: '' }));
        }
      } catch (error) {
        setUserIdStatus('error');
        setErrors(prev => ({
          ...prev,
          user_id: 'ユーザーIDの確認に失敗しました'
        }));
      } finally {
        setIsCheckingUserId(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.user_id, user.user_id]);

  return (
    <>
      <DndProvider backend={dndBackend} options={dndOptions}>
        <div className="w-full bg-background min-h-screen">
          <div className="bg-background rounded-2xl p-6 mx-4 mt-4">
            {/* Error Alert */}
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200"
              >
                <div className="flex items-center gap-2 text-red-800 mb-1">
                  <Bug className="w-4 h-4" />
                  <span className="text-sm font-medium">保存エラー</span>
                </div>
                <div className="text-xs text-red-700">
                  {saveError?.message || '不明なエラーが発生しました'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrorDebug(true)}
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  詳細を表示
                </Button>
              </motion.div>
            )}

            {/* Profile Avatar */}
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
                  <img
                    src={isEditing ? selectedAvatar : displayUser.avatar}
                    alt={displayUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* User Name and Bio - Immediately after avatar for other users */}
            {!isOwnProfile && (
              <div className="text-center mb-6 px-4">
                <h1 className="text-xl font-medium text-black mb-3 text-center">
                  {displayUser.name}
                </h1>
                {/* Bio for other users - right after name */}
                {displayUser.bio && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <p className="text-sm text-gray-600 leading-relaxed text-center px-4">
                      {displayUser.bio}
                    </p>
                  </motion.div>
                )}

                {/* Link for other users */}
                {displayUser.link && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex justify-center"
                  >
                    <a
                      href={displayUser.link.startsWith('http') ? displayUser.link : `https://${displayUser.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {displayUser.link}
                    </a>
                  </motion.div>
                )}

                {/* SNS Links for other users */}
                {(displayUser.socialLinks?.instagram || displayUser.socialLinks?.twitter || displayUser.socialLinks?.tiktok) && (
                  <div className="flex justify-center items-center gap-4 mb-4">
                    {displayUser.socialLinks?.instagram && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="cursor-pointer"
                        onClick={() => window.open(`https://instagram.com/${displayUser.socialLinks.instagram?.replace('@', '')}`, '_blank')}
                        style={{ 
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'block',
                          width: '35px',
                          height: '35px'
                        }}
                      >
                        <img
                          src={instagramIcon}
                          alt="Instagram"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            borderRadius: '0',
                            padding: '0',
                            margin: '0',
                            display: 'block'
                          }}
                        />
                      </motion.div>
                    )}
                    {displayUser.socialLinks?.twitter && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="cursor-pointer"
                        onClick={() => window.open(`https://twitter.com/${displayUser.socialLinks.twitter?.replace('@', '')}`, '_blank')}
                        style={{ 
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'block',
                          width: '35px',
                          height: '35px'
                        }}
                      >
                        <img
                          src={xIcon}
                          alt="X (Twitter)"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            borderRadius: '0',
                            padding: '0',
                            margin: '0',
                            display: 'block'
                          }}
                        />
                      </motion.div>
                    )}
                    {displayUser.socialLinks?.tiktok && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="cursor-pointer"
                        onClick={() => window.open(`https://tiktok.com/${displayUser.socialLinks.tiktok?.replace('@', '')}`, '_blank')}
                        style={{ 
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'block',
                          width: '35px',
                          height: '35px'
                        }}
                      >
                        <img
                          src={tiktokIcon}
                          alt="TikTok"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            borderRadius: '0',
                            padding: '0',
                            margin: '0',
                            display: 'block'
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Image Gallery for other users */}
                {galleryImages && galleryImages.length > 0 && (
                  <div className="mb-4">
                    <div className={galleryImages.length >= 3 ? "grid grid-cols-3 gap-2" : "flex justify-center gap-2"}>
                      {galleryImages.map((image, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`aspect-square rounded-lg overflow-hidden bg-gray-200 ${galleryImages.length < 3 ? "w-20 h-20" : ""}`}
                        >
                          <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Avatar Button (only show when editing own profile) */}
            {isOwnProfile && isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center items-center mb-6"
              >
                <Button
                  onClick={() => setShowAvatarSelector(true)}
                  variant="outline"
                  className="rounded-full border-2 border-primary bg-white text-primary hover:bg-primary/5 px-6 py-2"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  プロフィール画像を変更
                </Button>
              </motion.div>
            )}

            {/* Edit Profile Button (only show for own profile) */}
            {isOwnProfile && (
              <div className="flex justify-center items-center mb-8">
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="rounded-full px-6 py-3"
                      disabled={isSaving}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-primary text-white rounded-full px-8 py-3 hover:bg-primary/90"
                      disabled={isSaving || isCheckingUserId || userIdStatus === 'taken'}
                    >
                      {isSaving ? '保存中...' : '保存する'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-white rounded-full px-8 py-3 hover:bg-primary/90"
                  >
                    プロフィールを編集する
                  </Button>
                )}
              </div>
            )}

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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">プロフィール画像を選択</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAvatarSelector(false)}
                        className="rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* ファイルアップロードボタン */}
                    <div className="mb-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
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
                    </div>

                    {/* アップロードした画像のプレビュー */}
                    {uploadedImage && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">アップロードした画像</p>
                        <motion.button
                          onClick={() => handleAvatarSelect(uploadedImage)}
                          className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedAvatar === uploadedImage 
                              ? 'border-primary' 
                              : 'border-transparent hover:border-primary/50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <img
                            src={uploadedImage}
                            alt="Uploaded avatar"
                            className="w-full h-full object-cover"
                          />
                          {selectedAvatar === uploadedImage && (
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
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">プリセット画像</p>
                      <div className="grid grid-cols-3 gap-3">
                        {presetAvatars.map((avatarUrl, index) => (
                          <motion.button
                            key={index}
                            onClick={() => handleAvatarSelect(avatarUrl)}
                            className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                              selectedAvatar === avatarUrl 
                                ? 'border-primary' 
                                : 'border-transparent hover:border-primary/50'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={avatarUrl}
                              alt={`Avatar ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {selectedAvatar === avatarUrl && (
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

                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={() => setShowAvatarSelector(false)}
                        className="w-full rounded-lg bg-primary text-primary-foreground"
                      >
                        選択完了
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields - Only show for own profile editing */}
            {isOwnProfile && (
              <div className="space-y-6">
                {/* User Name */}
                <div className="space-y-2">
                  <Label className="text-black font-medium text-center block">名前</Label>
                  {isEditing ? (
                    <div className="space-y-1">
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
                    </div>
                  ) : (
                    <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4 text-black">
                      {displayUser.name}
                    </div>
                  )}
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <Label className="text-black font-medium text-center block">ユーザーID *</Label>
                  {isEditing ? (
                    <div className="space-y-1">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          @
                        </div>
                        <Input
                          value={formData.user_id}
                          onChange={(e) => handleInputChange('user_id', e.target.value)}
                          className="h-12 pl-12 pr-12 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                          placeholder="例: music_lover123"
                        />
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
                      <p className="text-xs text-gray-600 text-center">
                        3-20文字、半角英数字とアンダースコアのみ
                      </p>
                      {errors.user_id && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-destructive text-sm text-center"
                        >
                          {errors.user_id}
                        </motion.p>
                      )}
                    </div>
                  ) : (
                    <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                      <span className="text-gray-500 font-medium mr-2">@</span>
                      <span className={displayUser.user_id ? "text-black" : "text-gray-500"}>
                        {displayUser.user_id || '未設定'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-black font-medium text-center block">自己紹介</Label>
                  {isEditing ? (
                    <div className="space-y-1">
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder={!formData.bio ? "未設定" : "自己紹介を入力してください"}
                        className="min-h-20 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-400"
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formData.bio.length}/200文字</span>
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
                    </div>
                  ) : (
                    displayUser.bio && (
                      <div className="min-h-20 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                        <span className="text-black">
                          {displayUser.bio}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label className="text-black font-medium text-center block">リンク</Label>
                  {isEditing ? (
                    <div className="space-y-1">
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
                    </div>
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

                {/* Image Gallery Section */}
                <div className="space-y-2">
                  <Label className="text-black font-medium text-center block">
                    {isEditing ? 'ギャラリー（最大6枚）' : 'ギャラリー'}
                  </Label>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Upload button */}
                      <div>
                        <input
                          ref={galleryFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryImageUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={triggerGalleryUpload}
                          variant="outline"
                          className="w-full h-12 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
                          disabled={galleryImages.length >= VALIDATION_RULES.MAX_GALLERY_IMAGES}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          ギャラリーを追加
                        </Button>
                      </div>

                      {/* Gallery grid */}
                      {galleryImages.length > 0 && (
                        <div className={galleryImages.length >= 3 ? "grid grid-cols-3 gap-2" : "flex justify-center gap-2"}>
                          {galleryImages.map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className={galleryImages.length < 3 ? "w-20 h-20" : ""}
                            >
                              <DraggableGalleryImage
                                image={image}
                                index={index}
                                onMove={handleReorderGalleryImages}
                                onRemove={handleRemoveGalleryImage}
                                onEdit={handleEditGalleryImage}
                                isEditing={true}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {galleryImages.length > 0 ? (
                        <div className={galleryImages.length >= 3 ? "grid grid-cols-3 gap-2" : "flex justify-center gap-2"}>
                          {galleryImages.map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className={galleryImages.length < 3 ? "w-20 h-20" : ""}
                            >
                              <DraggableGalleryImage
                                image={image}
                                index={index}
                                onMove={() => {}} // 表示モードでは並び替え無効
                                onRemove={() => {}} // 表示モードでは削除無効
                                isEditing={false}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-20 rounded-lg border-2 border-primary bg-white flex items-center justify-center">
                          <span className="text-gray-500">未設定</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SNS Links */}
                <div className="space-y-4">
                  <Label className="text-black font-medium text-center block">SNSリンク</Label>
                  
                  {/* Instagram */}
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                            <InstagramIcon />
                          </div>
                          <Input
                            value={formData.instagram}
                            onChange={(e) => handleInputChange('instagram', e.target.value)}
                            placeholder="@livme"
                            className="h-12 pl-16 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                          />
                        </div>
                        {errors.instagram && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-destructive text-sm"
                          >
                            {errors.instagram}
                          </motion.p>
                        )}
                      </div>
                    ) : (
                      <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mr-4">
                          <InstagramIcon />
                        </div>
                        <span className={displayUser.socialLinks?.instagram ? "text-black" : "text-gray-500"}>
                          {displayUser.socialLinks?.instagram || '未設定'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Twitter */}
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                            <TwitterIcon />
                          </div>
                          <Input
                            value={formData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                            placeholder="@livme"
                            className="h-12 pl-16 rounded-lg border-2 border-primary bg-white text-black placeholder:text-gray-500"
                          />
                        </div>
                        {errors.twitter && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-destructive text-sm"
                          >
                            {errors.twitter}
                          </motion.p>
                        )}
                      </div>
                    ) : (
                      <div className="h-12 rounded-lg border-2 border-primary bg-white flex items-center justify-center px-4">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-4">
                          <TwitterIcon />
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
                      <div className="space-y-1">
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
                        {errors.tiktok && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-destructive text-sm"
                          >
                            {errors.tiktok}
                          </motion.p>
                        )}
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
              </div>
            )}

            {/* Lives Section - Using LiveCard Component */}
            {(futureLives.length > 0 || Object.keys(groupedPastLives).length > 0) && (
              <div className="mt-8 space-y-6">
                {/* Future Lives */}
                {futureLives.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-sm text-black font-medium text-center block sticky top-0 bg-background py-2 z-10">参加予定の公演</Label>
                    <div className="space-y-3 px-1">
                      {futureLives.map((live, index) => (
                        <motion.div
                          key={live.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div 
                            className="cursor-pointer"
                            onClick={() => handleLiveClick(live)}
                          >
                            <LiveCard
                              live={live}
                              onJoin={() => {}}
                              onViewAttendees={() => handleLiveClick(live)}
                              onDelete={() => {}}
                              isJoined={live.attendees.some(attendee => attendee.id === user.id)}
                              isPast={false}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Lives with Accordion */}
                {Object.keys(groupedPastLives).length > 0 && (
                  <div className="space-y-4">
                    <span 
                      className="text-sm text-black font-medium text-center block sticky top-0 bg-background py-2 z-10"
                      style={{
                        fontFamily: '"M PLUS 1", "Meiryo", "メイリオ", "Hiragino Sans", "ヒラギノ角ゴシック Pro", "Yu Gothic Medium", "游ゴシック Medium", "Yu Gothic", "游ゴシック", sans-serif',
                        fontWeight: 500,
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility'
                      }}
                    >
                      過去の参加公演
                    </span>
                    <div className="px-1">
                      <Accordion type="multiple" className="w-full" defaultValue={accordionDefaultValues}>
                        {Object.keys(groupedPastLives)
                          .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years descending
                          .map(year => 
                            Object.keys(groupedPastLives[year])
                              .sort((a, b) => parseInt(b) - parseInt(a)) // Sort months descending
                              .map(month => {
                                const monthLives = groupedPastLives[year][month];
                                const accordionValue = `${year}-${month}`;
                                
                                return (
                                  <AccordionItem key={accordionValue} value={accordionValue}>
                                    <AccordionTrigger className="hover:no-underline">
                                      <span className="text-base font-medium">
                                        {formatYearMonth(year, month)}
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-3 pt-2">
                                        {monthLives.map((live, index) => (
                                          <motion.div
                                            key={live.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * index }}
                                          >
                                            <div 
                                              className="cursor-pointer"
                                              onClick={() => handleLiveClick(live)}
                                            >
                                              <LiveCard
                                                live={live}
                                                onJoin={() => {}}
                                                onViewAttendees={() => handleLiveClick(live)}
                                                onDelete={() => {}}
                                                isJoined={live.attendees.some(attendee => attendee.id === user.id)}
                                                isPast={true}
                                              />
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })
                          ).flat()}
                      </Accordion>
                    </div>
                    
                    {/* 広告枠: プロフィール画面のライブ一覧末尾 */}
                    <div className="mt-4">
                      <AdSlot
                        variant="native"
                        enabled={false}
                        isModalOpen={false}
                        slotId={`ad-profile-${user.id}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Debug Modal */}
          <AnimatePresence>
            {showErrorDebug && saveError && (
              <DatabaseErrorDebug
                error={saveError}
                onClose={() => setShowErrorDebug(false)}
                onRetry={retryProfileUpdate}
              />
            )}
          </AnimatePresence>

          {/* Image Crop Modal */}
          <AnimatePresence>
            {showImageCrop && cropImageSrc && (
              <ImageCropModal
                imageSrc={cropImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
                aspectRatio={cropType === 'avatar' ? 1 : undefined} // 正方形はアバターのみ
                title={cropType === 'avatar' ? 'プロフィール画像を編集' : 'ギャラリー画像を編集'}
              />
            )}
          </AnimatePresence>
        </div>
      </DndProvider>
    </>
  );
}