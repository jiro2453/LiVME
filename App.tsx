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
import { Button } from './components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './components/ui/accordion';
import { Plus, User as UserIcon, Settings, Calendar } from 'lucide-react';
import { getLivesByUserId, deleteLive } from './lib/api';
import { groupLivesByMonth } from './utils/liveGrouping';
import { useToast } from './hooks/useToast';
import type { Live } from './types';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddLiveModalOpen, setIsAddLiveModalOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | undefined>();
  const [editingLive, setEditingLive] = useState<Live | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadLives();
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

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const groupedLives = groupLivesByMonth(lives);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-primary">LIVME</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenProfile}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="プロフィール"
              >
                <UserIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="設定"
              >
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Add Live Button */}
          <div className="flex items-center justify-between">
            <h2>マイライブ</h2>
            <Button onClick={() => setIsAddLiveModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              ライブ追加
            </Button>
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
                          isOwner={true}
                          onEdit={handleEditLive}
                          onDelete={handleDeleteLive}
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
