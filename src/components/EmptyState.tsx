import React from 'react';
import { motion } from 'framer-motion';
import { Music, Plus, Search } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  type: 'future' | 'past' | 'search';
  searchQuery?: string;
  onAddClick: () => void;
}

export function EmptyState({ type, searchQuery, onAddClick }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'future':
        return {
          icon: <Music className="w-12 h-12 text-muted-foreground mb-4" />,
          title: 'まだ参加予定の公演がありません',
          description: '気になるライブや公演を追加して、\n音楽体験を記録していきましょう！',
          buttonText: '公演を追加'
        };
      case 'past':
        return {
          icon: <Music className="w-12 h-12 text-muted-foreground mb-4" />,
          title: 'まだ過去の公演記録がありません',
          description: '過去に参加した素晴らしいライブを追加して、\n思い出を振り返りましょう！',
          buttonText: '過去の公演を追加'
        };
      case 'search':
        return {
          icon: <Search className="w-12 h-12 text-muted-foreground mb-4" />,
          title: `"${searchQuery}" の検索結果がありません`,
          description: '別のキーワードで検索するか、\n新しい公演を追加してみてください。',
          buttonText: '公演を追加'
        };
    }
  };

  const content = getContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 px-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex flex-col items-center"
      >
        {content.icon}
        <h3 className="text-lg font-medium text-foreground mb-2">
          {content.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed whitespace-pre-line">
          {content.description}
        </p>
        <Button 
          onClick={onAddClick}
          className="rounded-full px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          {content.buttonText}
        </Button>
      </motion.div>
    </motion.div>
  );
}