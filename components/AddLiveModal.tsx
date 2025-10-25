import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/useToast';
import { createLive, updateLive } from '../lib/api';
import type { Live } from '../types';

interface AddLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  editingLive?: Live | null;
}

export const AddLiveModal: React.FC<AddLiveModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess,
  editingLive,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [artistName, setArtistName] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingLive) {
      setTitle(editingLive.title);
      setDate(editingLive.date);
      setTime(editingLive.time || '');
      setVenue(editingLive.venue);
      setArtistName(editingLive.artist_name || '');
      setLink(editingLive.link || '');
    } else {
      resetForm();
    }
  }, [editingLive, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setVenue('');
    setArtistName('');
    setLink('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !venue) {
      toast({
        title: 'エラー',
        description: 'タイトル、日付、会場は必須です',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const liveData = {
        user_id: userId,
        title,
        date,
        time: time || undefined,
        venue,
        artist_name: artistName || undefined,
        link: link || undefined,
      };

      if (editingLive) {
        await updateLive(editingLive.id, liveData);
        toast({
          title: '更新しました',
          description: 'ライブ情報を更新しました',
          variant: 'success',
        });
      } else {
        await createLive(liveData);
        toast({
          title: '追加しました',
          description: '新しいライブを追加しました',
          variant: 'success',
        });
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: error.message || '操作に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingLive ? 'ライブ編集' : 'ライブ追加'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ライブタイトル"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">日付 *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">時間</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">会場 *</Label>
            <Input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="渋谷クラブクアトロ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artistName">アーティスト名</Label>
            <Input
              id="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="山田太郎"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">リンク</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : editingLive ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
