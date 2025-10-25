import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ProfileRing } from './ProfileRing';
import { SocialIcons } from './SocialIcons';
import { ShareModal } from './ShareModal';
import { LiveCard } from './LiveCard';
import { EmptyState } from './EmptyState';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { getUserByUserId, getLivesByUserId, followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount } from '../lib/api';
import { groupLivesByMonth } from '../utils/liveGrouping';
import type { User, Live } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  currentUserId?: string;
  isOwnProfile: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentUserId,
  isOwnProfile,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editUserId, setEditUserId] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editTiktok, setEditTiktok] = useState('');

  const { toast } = useToast();

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
        setUser(userData);
        setEditName(userData.name);
        setEditUserId(userData.user_id);
        setEditBio(userData.bio || '');
        setEditInstagram(userData.social_links?.instagram || '');
        setEditTwitter(userData.social_links?.twitter || '');
        setEditTiktok(userData.social_links?.tiktok || '');

        // Load lives
        const livesData = await getLivesByUserId(userData.id);
        setLives(livesData);

        // Load follow status
        if (currentUserId && userData.id !== currentUserId) {
          const following = await isFollowing(currentUserId, userData.id);
          setIsFollowingUser(following);
        }

        // Load counts
        const followers = await getFollowerCount(userData.id);
        const following = await getFollowingCount(userData.id);
        setFollowerCount(followers);
        setFollowingCount(following);
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

  const handleFollow = async () => {
    if (!currentUserId || !user) return;

    try {
      if (isFollowingUser) {
        await unfollowUser(currentUserId, user.id);
        setIsFollowingUser(false);
        setFollowerCount(prev => prev - 1);
        toast({
          title: 'フォロー解除しました',
          variant: 'success',
        });
      } else {
        await followUser(currentUserId, user.id);
        setIsFollowingUser(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: 'フォローしました',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'フォロー操作に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    // Profile update logic will be added with image upload functionality
    toast({
      title: '実装中',
      description: 'プロフィール更新機能は後ほど実装されます',
    });
  };

  if (loading || !user) {
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

  const groupedLives = groupLivesByMonth(lives);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <div className="space-y-6 py-4">
            {/* Profile Header - Center Aligned */}
            <div className="flex flex-col items-center space-y-4">
              <ProfileRing avatarUrl={user.avatar_url} name={user.name} size="lg" />

              {isEditing ? (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label>名前</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="名前"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ユーザーID</Label>
                    <Input
                      value={editUserId}
                      onChange={(e) => setEditUserId(e.target.value)}
                      placeholder="user_id"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>自己紹介</Label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="自己紹介"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instagram (@なし)</Label>
                    <Input
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      placeholder="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>X (Twitter) (@なし)</Label>
                    <Input
                      value={editTwitter}
                      onChange={(e) => setEditTwitter(e.target.value)}
                      placeholder="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>TikTok (@なし)</Label>
                    <Input
                      value={editTiktok}
                      onChange={(e) => setEditTiktok(e.target.value)}
                      placeholder="username"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="flex-1">
                      保存
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 w-full">
                  <h2>{user.name}</h2>
                  <p className="text-gray-500">@{user.user_id}</p>
                  <p className="text-gray-600">{user.bio || '未設定'}</p>

                  <div className="flex justify-center gap-6 py-2">
                    <div className="text-center">
                      <div className="font-semibold">{followerCount}</div>
                      <div className="text-gray-500">フォロワー</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{followingCount}</div>
                      <div className="text-gray-500">フォロー中</div>
                    </div>
                  </div>

                  <SocialIcons
                    socialLinks={user.social_links}
                    onShare={() => setIsShareModalOpen(true)}
                  />

                  <div className="flex gap-2 pt-4">
                    {isOwnProfile ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="flex-1"
                      >
                        プロフィール編集
                      </Button>
                    ) : (
                      <Button
                        onClick={handleFollow}
                        variant={isFollowingUser ? 'outline' : 'default'}
                        className="flex-1"
                      >
                        {isFollowingUser ? 'フォロー中' : 'フォロー'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lives Section */}
            <div className="space-y-4">
              <h3>公演リスト</h3>

              {lives.length === 0 ? (
                <EmptyState message="公演情報がありません" />
              ) : (
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedLives).map(([month, monthLives]) => (
                    <AccordionItem key={month} value={month}>
                      <AccordionTrigger>{month}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {monthLives.map((live) => (
                            <LiveCard
                              key={live.id}
                              live={live}
                              isOwner={isOwnProfile}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userId={user.user_id}
      />
    </>
  );
};
