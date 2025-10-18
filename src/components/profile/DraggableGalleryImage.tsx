import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';
import { Menu, Trash2, Pencil } from 'lucide-react';
import { DraggableGalleryImageProps } from './types';
import { ItemTypes } from './constants';

export const DraggableGalleryImage: React.FC<DraggableGalleryImageProps> = ({
  image,
  index,
  onMove,
  onRemove,
  onEdit,
  isEditing
}) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.GALLERY_IMAGE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: isEditing
  });

  const [, drop] = useDrop({
    accept: ItemTypes.GALLERY_IMAGE,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
    canDrop: isEditing
  });

  const ref = useRef<HTMLDivElement>(null);
  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative aspect-square rounded-lg overflow-hidden bg-gray-200 ${
        isEditing ? 'cursor-move' : ''
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <img
        src={image}
        alt={`Gallery image ${index + 1}`}
        className="w-full h-full object-cover"
      />
      {isEditing && (
        <>
          {/* ドラッグハンドル - 左上 */}
          <div 
            className="absolute top-1 left-1 p-1.5 text-white rounded-md shadow-lg touch-manipulation cursor-move"
            style={{
              minWidth: '28px',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="画像を移動"
          >
            <Menu className="w-4 h-4" />
          </div>
          
          {/* 右上のボタングループ - 縦並び */}
          <div className="absolute top-1 right-1 flex flex-col gap-1">
            {/* 編集ボタン */}
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(index);
                }}
                className="p-1.5 text-white rounded-md shadow-lg touch-manipulation hover:text-gray-200 transition-colors"
                style={{ 
                  minWidth: '28px',
                  minHeight: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="画像を編集"
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
            )}
            
            {/* 削除ボタン */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(index);
              }}
              className="p-1.5 text-white rounded-md shadow-lg touch-manipulation hover:text-gray-200 transition-colors"
              style={{ 
                minWidth: '28px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="画像を削除"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};