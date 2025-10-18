import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    prompt: false
  });

  useEffect(() => {
    if ('Notification' in window) {
      updatePermissionState();
    }
  }, []);

  const updatePermissionState = () => {
    const current = Notification.permission;
    setPermission({
      granted: current === 'granted',
      denied: current === 'denied',
      prompt: current === 'default'
    });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('このブラウザは通知機能をサポートしていません');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      updatePermissionState();

      if (permission === 'granted') {
        toast.success('通知を許可しました');
        return true;
      } else {
        toast.error('通知が拒否されました');
        return false;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      toast.error('通知許可の取得に失敗しました');
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Show notification error:', error);
    }
  };

  const scheduleNotification = (title: string, body: string, scheduledTime: Date) => {
    const now = new Date();
    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    if (timeUntilNotification <= 0) {
      // Already passed
      return;
    }

    // Schedule for up to 24 hours in advance
    if (timeUntilNotification > 24 * 60 * 60 * 1000) {
      return;
    }

    setTimeout(() => {
      showNotification(title, {
        body,
        tag: `live-reminder-${scheduledTime.getTime()}`,
        requireInteraction: true
      });
    }, timeUntilNotification);
  };

  const scheduleLiveReminders = (artist: string, venue: string, date: string) => {
    const liveDate = new Date(date);
    const now = new Date();

    // 1 day before
    const oneDayBefore = new Date(liveDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(20, 0, 0, 0); // 8 PM

    // 1 hour before  
    const oneHourBefore = new Date(liveDate);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    if (oneDayBefore > now) {
      scheduleNotification(
        '🎵 明日はライブです！',
        `${artist} @ ${venue} - 忘れずに準備しましょう`,
        oneDayBefore
      );
    }

    if (oneHourBefore > now) {
      scheduleNotification(
        '🎤 ライブ開始1時間前！',
        `${artist} @ ${venue} - もうすぐ開始です`,
        oneHourBefore
      );
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleLiveReminders
  };
}