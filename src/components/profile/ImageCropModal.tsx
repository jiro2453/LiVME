import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Crop, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { toast } from 'sonner@2.0.3';
import { ImageCropModalProps } from './types';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1, // デフォルトは正方形
  title = "画像を編集"
}) => {
  const [crop, setCrop] = useState<CropType>({
    unit: '%',
    x: 35,
    y: 35,
    width: 30,
    height: 30
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // モバイル用 Instagram風の状態管理
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, imgX: 0, imgY: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [minScale, setMinScale] = useState(1); // 動的に設定される最小スケール
  const cropAreaRef = useRef<HTMLDivElement>(null);

  // モバイル端末検出
  const isMobile = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // モバイルでのスクロール防止
  useEffect(() => {
    if (isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isMobile]);

  // Instagram風 - 画像の初期位置とスケールを設定
  const initializeImageTransform = useCallback(() => {
    if (!imgRef.current || !cropAreaRef.current || !containerRef.current) return;
    
    const img = imgRef.current;
    const cropArea = cropAreaRef.current;
    const container = containerRef.current;
    
    // 要素のサイズを正確に取得
    const containerRect = container.getBoundingClientRect();
    const cropRect = cropArea.getBoundingClientRect();
    
    // 画像の元のサイズ（transform適用前）
    const imgWidth = img.offsetWidth || img.clientWidth;
    const imgHeight = img.offsetHeight || img.clientHeight;
    
    // 画像とクロップエリアのアスペクト比
    const imageAspect = imgWidth / imgHeight;
    const cropAspect = cropRect.width / cropRect.height;
    
    // 画像がクロップエリアを完全にカバーする最小スケールを計算
    let calculatedMinScale = 1;
    if (imageAspect > cropAspect) {
      // 画像の方が横長 → 高さを基準にスケール
      calculatedMinScale = cropRect.height / imgHeight;
    } else {
      // 画像の方が縦長 → 幅を基準にスケール  
      calculatedMinScale = cropRect.width / imgWidth;
    }
    
    // 最小スケールを大幅に下げて設定（より自由なズームアウトを可能にする）
    const finalMinScale = Math.max(calculatedMinScale * 0.3, 0.2);
    
    setMinScale(finalMinScale);
    setImageScale(finalMinScale);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // モバイル用タッチイベントハンドラー
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // 単一タッチ - ドラッグ開始
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
        imgX: imagePosition.x,
        imgY: imagePosition.y
      });
    } else if (e.touches.length === 2) {
      // 2本指タッチ - ピンチ開始
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastPinchDistance(distance);
      setIsDragging(false);
    }
  }, [imagePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // ドラッグ中
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      setImagePosition({
        x: dragStart.imgX + deltaX,
        y: dragStart.imgY + deltaY
      });
    } else if (e.touches.length === 2 && lastPinchDistance > 0) {
      // ピンチ中
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = currentDistance / lastPinchDistance;
      const newScale = Math.max(minScale, Math.min(imageScale * scaleChange, 3));
      
      setImageScale(newScale);
      setLastPinchDistance(currentDistance);
    }
  }, [isDragging, dragStart, imageScale, lastPinchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLastPinchDistance(0);
  }, []);

  // ズームコントロール
  const handleZoomChange = useCallback((value: number[]) => {
    const newScale = Math.max(minScale, value[0]);
    setImageScale(newScale);
  }, [minScale]);

  const resetImageTransform = useCallback(() => {
    initializeImageTransform();
  }, [initializeImageTransform]);

  // Instagram風クロップの実行（完全修正版）
  const getCroppedImageInstagramStyle = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!imgRef.current || !cropAreaRef.current || !containerRef.current) {
        reject(new Error('必要な要素が見つかりません'));
        return;
      }

      const img = imgRef.current;
      const cropArea = cropAreaRef.current;
      const container = containerRef.current;
      
      // Canvas作成
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context を取得できません'));
        return;
      }

      // 出力サイズ設定（高解像度）
      const outputSize = 1024;
      canvas.width = outputSize;
      canvas.height = aspectRatio === 1 ? outputSize : outputSize / aspectRatio;

      // 要素の位置とサイズを取得
      const containerRect = container.getBoundingClientRect();
      const cropRect = cropArea.getBoundingClientRect();
      
      // 画像の元のサイズ（transform適用前）
      const originalImgWidth = img.offsetWidth || img.clientWidth;
      const originalImgHeight = img.offsetHeight || img.clientHeight;
      
      // コンテナの中心位置
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;
      
      // クロップエリアの中心位置（コンテナ基準）
      const cropCenterXInContainer = cropRect.left - containerRect.left + cropRect.width / 2;
      const cropCenterYInContainer = cropRect.top - containerRect.top + cropRect.height / 2;
      
      // 画像の中心位置（変形後、コンテナ基準）
      const imageCenterXInContainer = containerCenterX + imagePosition.x;
      const imageCenterYInContainer = containerCenterY + imagePosition.y;
      
      // 画像中心からクロップ中心への相対距離（コンテナ座標系）
      const offsetX = cropCenterXInContainer - imageCenterXInContainer;
      const offsetY = cropCenterYInContainer - imageCenterYInContainer;
      
      // 画像のネイティブ座標系への変換比率
      const scaleToNative = img.naturalWidth / originalImgWidth;
      
      // オフセットをネイティブ座標系に変換（スケールを考慮）
      const nativeOffsetX = (offsetX / imageScale) * scaleToNative;
      const nativeOffsetY = (offsetY / imageScale) * scaleToNative;
      
      // ネイティブ画像上でのクロップ中心位置
      const nativeCropCenterX = (img.naturalWidth / 2) + nativeOffsetX;
      const nativeCropCenterY = (img.naturalHeight / 2) + nativeOffsetY;
      
      // クロップ領域のサイズ（ネイティブ座標系）
      const nativeCropWidth = (cropRect.width / imageScale) * scaleToNative;
      const nativeCropHeight = (cropRect.height / imageScale) * scaleToNative;
      
      // ソース領域の左上座標
      const sourceX = nativeCropCenterX - nativeCropWidth / 2;
      const sourceY = nativeCropCenterY - nativeCropHeight / 2;
      
      // デバッグ情報（開発時のみ）
      if (typeof window !== 'undefined' && (window as any).livmeEnvironment === 'development') {
        console.log('🎯 Crop Debug Info:', {
          originalImageSize: { width: originalImgWidth, height: originalImgHeight },
          nativeImageSize: { width: img.naturalWidth, height: img.naturalHeight },
          containerSize: { width: containerRect.width, height: containerRect.height },
          cropArea: { width: cropRect.width, height: cropRect.height },
          transform: { scale: imageScale, position: imagePosition },
          centers: {
            container: { x: containerCenterX, y: containerCenterY },
            image: { x: imageCenterXInContainer, y: imageCenterYInContainer },
            crop: { x: cropCenterXInContainer, y: cropCenterYInContainer }
          },
          offsets: { x: offsetX, y: offsetY },
          nativeOffsets: { x: nativeOffsetX, y: nativeOffsetY },
          nativeCropCenter: { x: nativeCropCenterX, y: nativeCropCenterY },
          sourceRegion: { x: sourceX, y: sourceY, width: nativeCropWidth, height: nativeCropHeight },
          outputSize: { width: canvas.width, height: canvas.height },
          scaleToNative: scaleToNative
        });
      }
      
      // 描画実行
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        nativeCropWidth,
        nativeCropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Blob変換
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('画像の変換に失敗しました'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('ファイル��読み込みに失敗しました'));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  }, [imageScale, imagePosition, aspectRatio]);

  // PC版用のクロップ処理
  const getCroppedImg = useCallback((image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    });
  }, []);

  const handleCropComplete = async () => {
    try {
      let croppedImage: string;
      
      if (isMobile) {
        croppedImage = await getCroppedImageInstagramStyle();
      } else {
        if (!imgRef.current || !completedCrop) {
          throw new Error('PC版のクロップデータが不足しています');
        }
        croppedImage = await getCroppedImg(imgRef.current, completedCrop);
      }
      
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('クロップエラー:', error);
      toast.error('画像の編集に失敗しました');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={`bg-white rounded-2xl w-full h-full flex flex-col ${
          isMobile 
            ? 'p-0 max-h-screen' 
            : 'p-6 max-w-lg max-h-[90vh] m-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between ${isMobile ? 'p-4 border-b border-gray-200' : 'mb-4'} shrink-0`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <h3 className="font-medium text-black">
            {title}
          </h3>
          
          <Button
            onClick={handleCropComplete}
            size="sm"
            className="bg-primary text-white px-4"
          >
            完了
          </Button>
        </div>

        {/* Instagram風モバイルクロップエリア */}
        {isMobile ? (
          <div className="flex-1 flex flex-col">
            {/* メイン画像エリア */}
            <div 
              ref={containerRef}
              className="flex-1 bg-black relative overflow-hidden flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            >
              {/* 固定クロップエリア（画面中央） */}
              <div 
                ref={cropAreaRef}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg z-10 pointer-events-none"
                style={{
                  width: 'min(320px, 85vw)',
                  height: aspectRatio === 1 ? 'min(320px, 85vw)' : `min(${320 / aspectRatio}px, ${85 / aspectRatio}vw)`
                }}
              >
                {/* グリッド線 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30"></div>
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30"></div>
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30"></div>
                </div>
              </div>

              {/* 操作可能な画像 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="編集対象"
                  className="max-w-none max-h-none select-none"
                  style={{
                    transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                  onLoad={initializeImageTransform}
                  draggable={false}
                />
              </div>

              {/* 半透明オーバーレイ（クロップエリア外） */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 上部 */}
                <div className="absolute top-0 left-0 right-0 bg-black/60" style={{ height: 'calc(50% - min(160px, 42.5vw))' }}></div>
                {/* 下部 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60" style={{ height: 'calc(50% - min(160px, 42.5vw))' }}></div>
                {/* 左側 */}
                <div 
                  className="absolute bg-black/60" 
                  style={{ 
                    top: 'calc(50% - min(160px, 42.5vw))', 
                    left: 0, 
                    width: 'calc(50% - min(160px, 42.5vw))', 
                    height: 'min(320px, 85vw)' 
                  }}
                ></div>
                {/* 右側 */}
                <div 
                  className="absolute bg-black/60" 
                  style={{ 
                    top: 'calc(50% - min(160px, 42.5vw))', 
                    right: 0, 
                    width: 'calc(50% - min(160px, 42.5vw))', 
                    height: 'min(320px, 85vw)' 
                  }}
                ></div>
              </div>
            </div>

            {/* コントロールエリア */}
            <div className="bg-white p-4 space-y-4">
              {/* ズームスライダー */}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-gray-500" />
                <Slider
                  value={[imageScale]}
                  onValueChange={handleZoomChange}
                  min={minScale}
                  max={3}
                  step={0.1}
                  className="flex-1 zoom-slider"
                />
                <ZoomIn className="w-4 h-4 text-gray-500" />
              </div>

              {/* リセットボタン */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetImageTransform}
                  className="text-primary border-primary"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  リセット
                </Button>
              </div>

              {/* 操作説明 */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  ドラッグで移動 • ピンチでズーム
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* PC版は従来のReactCrop */
          <div className="flex-1 flex items-center justify-center mb-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={aspectRatio}
                className="max-w-full max-h-full"
                minWidth={50}
                minHeight={50}
                keepSelection={true}
                ruleOfThirds={true}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="��ロップ対象"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    maxHeight: '60vh'
                  }}
                  onLoad={() => {
                    if (imgRef.current) {
                      setTimeout(() => {
                        if (imgRef.current) {
                          const rect = imgRef.current.getBoundingClientRect();
                          const { width, height } = rect;
                          const minDimension = Math.min(width, height);
                          const initialSize = minDimension * 0.4;
                          
                          const x = (width - initialSize) / 2;
                          const y = (height - initialSize) / 2;
                          
                          setCrop({
                            unit: 'px',
                            x: Math.max(0, x),
                            y: Math.max(0, y),
                            width: initialSize,
                            height: aspectRatio === 1 ? initialSize : initialSize / aspectRatio
                          });
                        }
                      }, 100);
                    }
                  }}
                />
              </ReactCrop>
            </div>
          </div>
        )}

        {/* PC版のみ - ア��ションボタン */}
        {!isMobile && (
          <div className="flex gap-3 shrink-0">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCropComplete}
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              disabled={!completedCrop}
            >
              <Crop className="mr-2 w-4 h-4" />
              完了
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};