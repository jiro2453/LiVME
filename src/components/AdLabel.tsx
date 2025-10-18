import React from 'react';

/**
 * AdLabel - 広告ラベルコンポーネント
 * 
 * 用途: 広告枠に「広告」ラベルを明示的に表示
 * 配色: 控えめなグレー背景に濃いグレーテキスト
 * サイズ: コンパクトで目立ちすぎない
 */
export const AdLabel: React.FC = () => {
  return (
    <div 
      className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs"
      style={{
        backgroundColor: '#E5E7EB',
        color: '#6B7280',
        fontSize: '10px',
        fontWeight: '500',
        letterSpacing: '0.05em'
      }}
    >
      広告
    </div>
  );
};
