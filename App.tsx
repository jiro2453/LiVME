import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { AuthScreen } from './components/auth/AuthScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AddLiveModal } from './components/AddLiveModal';
import { LiveCard } from './components/LiveCard';
import { EmptyState } from './components/EmptyState';
import { SocialIcons } from './components/SocialIcons';
import { ShareModal } from './components/ShareModal';
import { LiveAttendeesModal } from './components/LiveAttendeesModal';
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './components/ui/accordion';
import { Plus, User as UserIcon, LogOut, Calendar, Search } from 'lucide-react';
import { getLivesByUserId, deleteLive, getUserByUserId, getUsersAttendingSameLive } from './lib/api';
import { groupLivesByMonth } from './utils/liveGrouping';
import { useToast } from './hooks/useToast';
import type { Live, User } from './types';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddLiveModalOpen, setIsAddLiveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | undefined>();
  const [editingLive, setEditingLive] = useState<Live | null>(null);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [attendeeUserIds, setAttendeeUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadLives();
      loadProfileUser();
    }
  }, [user]);

  // Handle URL parameters for profile sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileUserId = params.get('profile');

    if (profileUserId) {
      setViewingUserId(profileUserId);
      setIsProfileModalOpen(true);
    }
  }, []);

  const loadLives = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const livesData = await getLivesByUserId(user.id);
      setLives(livesData);
    } catch (error) {
      console.error('Error loading lives:', error);
      toast({
        title: 'エラー',
        description: 'ライブ情報の読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfileUser = async () => {
    if (!user) return;

    try {
      const userData = await getUserByUserId(user.user_id);
      setProfileUser(userData);
    } catch (error) {
      console.error('Error loading profile user:', error);
    }
  };

  const handleDeleteLive = async (liveId: string) => {
    if (!confirm('本当に削除しますか?')) return;

    try {
      const success = await deleteLive(liveId);
      if (success) {
        toast({
          title: '削除しました',
          description: 'ライブ情報を削除しました',
          variant: 'success',
        });
        loadLives();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ライブ情報の削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleEditLive = (live: Live) => {
    setEditingLive(live);
    setIsAddLiveModalOpen(true);
  };

  const handleCloseAddLiveModal = () => {
    setIsAddLiveModalOpen(false);
    setEditingLive(null);
  };

  const handleOpenProfile = () => {
    if (user) {
      setViewingUserId(user.user_id);
      setIsProfileModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'ログアウトしました',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ログアウトに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleLiveClick = async (live: Live) => {
    setSelectedLive(live);
    setIsAttendeesModalOpen(true);

    // Fetch attendees for this live event
    try {
      const attendees = await getUsersAttendingSameLive(live);
      setAttendeeUserIds(attendees);
    } catch (error) {
      console.error('Error loading attendees:', error);
      toast({
        title: 'エラー',
        description: '参加者情報の読み込みに失敗しました',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const groupedLives = groupLivesByMonth(lives);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-10"></div>
            <img src="/LiVME_2.png" alt="LiVME" className="h-14 w-auto" />
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenProfile}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="プロフィール"
              >
                <UserIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-28 w-28">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gray-400 text-white text-3xl">
                {profileUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-[15.75px] font-semibold">{profileUser?.name}</h2>
              <p className="text-[12.25px] text-gray-500">@ {profileUser?.user_id}</p>
            </div>
            <SocialIcons
              socialLinks={profileUser?.social_links}
              onShare={() => setIsShareModalOpen(true)}
            />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="アーティスト名・会場名で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-primary rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 参加公演 Section */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">参加公演</h2>
            <button
              onClick={() => setIsAddLiveModalOpen(true)}
              className="p-2 bg-primary text-white rounded-full hover:bg-primary/90"
              aria-label="ライブ追加"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Lives List */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : lives.length === 0 ? (
            <EmptyState
              message="ライブ情報がありません。追加してみましょう！"
              icon={<Calendar className="h-12 w-12 mb-4 text-gray-400" />}
            />
          ) : (
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedLives)}>
              {Object.entries(groupedLives).map(([month, monthLives]) => (
                <AccordionItem key={month} value={month}>
                  <AccordionTrigger>{month}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {monthLives.map((live) => (
                        <LiveCard
                          key={live.id}
                          live={live}
                          isOwner={true}
                          onEdit={handleEditLive}
                          onDelete={handleDeleteLive}
                          onClick={handleLiveClick}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setViewingUserId(undefined);
          // Clear URL parameter
          window.history.replaceState({}, '', window.location.pathname);
        }}
        userId={viewingUserId || user?.user_id}
        currentUserId={user?.id}
        isOwnProfile={!viewingUserId || viewingUserId === user?.user_id}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenProfile={handleOpenProfile}
      />

      <AddLiveModal
        isOpen={isAddLiveModalOpen}
        onClose={handleCloseAddLiveModal}
        userId={user.id}
        onSuccess={loadLives}
        editingLive={editingLive}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userId={user.user_id}
      />

      {selectedLive && (
        <LiveAttendeesModal
          isOpen={isAttendeesModalOpen}
          onClose={() => {
            setIsAttendeesModalOpen(false);
            setSelectedLive(null);
          }}
          live={selectedLive}
          attendeeUserIds={attendeeUserIds}
        />
      )}

      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
