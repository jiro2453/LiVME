import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, BellOff, Smartphone, Globe, Shield, HelpCircle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useNotifications } from '../hooks/useNotifications';
import { VersionInfo } from './VersionInfo';
import { toast } from 'sonner@2.0.3';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { permission, requestPermission, showNotification } = useNotifications();
  const [settings, setSettings] = useState({
    liveReminders: true,
    newLiveNotifications: true,
    emailNotifications: false,
    darkMode: false
  });

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && !permission.granted) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }
    
    setSettings(prev => ({ ...prev, liveReminders: enabled }));
    
    if (enabled && permission.granted) {
      showNotification('🎵 LIVMEからの通知', {
        body: 'ライブ開催前にお知らせします！',
        tag: 'test-notification'
      });
    }
  };

  const testNotification = () => {
    if (permission.granted) {
      showNotification('🎵 テスト通知', {
        body: 'LIVMEの通知が正常に動作しています！',
        tag: 'test-notification'
      });
    } else {
      toast.error('通知許可が必要です');
    }
  };

  const getNotificationStatus = () => {
    if (permission.granted) return { text: '許可済み', color: 'text-green-600' };
    if (permission.denied) return { text: '拒否済み', color: 'text-red-600' };
    return { text: '未設定', color: 'text-yellow-600' };
  };

  const notificationStatus = getNotificationStatus();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">設定</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Notification Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5" />
                <h3 className="font-medium">通知設定</h3>
              </div>

              <Card className="p-4 space-y-4">
                {/* Notification Permission Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">通知許可状況</div>
                    <div className={`text-xs ${notificationStatus.color}`}>
                      {notificationStatus.text}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {permission.granted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testNotification}
                      >
                        テスト
                      </Button>
                    )}
                    {!permission.granted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestPermission}
                      >
                        許可
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Live Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">ライブリマインダー</div>
                    <div className="text-xs text-muted-foreground">
                      開催前日と1時間前に通知
                    </div>
                  </div>
                  <Switch
                    checked={settings.liveReminders}
                    onCheckedChange={handleNotificationToggle}
                  />
                </div>

                {/* New Live Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">新着ライブ通知</div>
                    <div className="text-xs text-muted-foreground">
                      フォロー中のユーザーの新規ライブ
                    </div>
                  </div>
                  <Switch
                    checked={settings.newLiveNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, newLiveNotifications: checked }))
                    }
                  />
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">メール通知</div>
                    <div className="text-xs text-muted-foreground">
                      重要な更新をメールで受信
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
              </Card>
            </div>

            {/* App Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-medium">アプリ設定</h3>
              </div>

              <Card className="p-4 space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">ダークモード</div>
                    <div className="text-xs text-muted-foreground">
                      画面テーマの切り替え
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, darkMode: checked }))
                    }
                  />
                </div>
              </Card>
            </div>

            {/* Version Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5" />
                <h3 className="font-medium">バージョン情報</h3>
                <Badge variant="default" className="bg-green-600 text-white text-xs">
                  v1.0.0 正式リリース
                </Badge>
              </div>

              <VersionInfo />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={onClose} className="flex-1">
                完了
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}