import { supabase } from './supabase';

export interface NotificationPreferences {
  browserPush: boolean;
  email: boolean;
  recapComplete: boolean;
  weeklyDigest: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async sendBrowserNotification(title: string, options?: NotificationOptions) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to send browser notification:', error);
    }
  }

  async notifyRecapComplete(userId: string, recapTitle: string, videoUrl: string) {
    // Get user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('notifications')
      .eq('user_id', userId)
      .maybeSingle();

    const settings = prefs?.notifications as NotificationPreferences | null;

    // Browser notification
    if (settings?.browserPush && settings?.recapComplete) {
      await this.sendBrowserNotification('🎉 הסיכום שלך מוכן!', {
        body: `הסיכום "${recapTitle}" הושלם בהצלחה. לחץ כאן לצפייה.`,
        tag: 'recap-complete',
        requireInteraction: true,
        data: { videoUrl },
      });
    }

    // Email notification (handled by backend Edge Function in production)
    if (settings?.email && settings?.recapComplete) {
      console.log('Email notification would be sent here');
      // In production: trigger Edge Function to send email
      // await supabase.functions.invoke('send-email', {
      //   body: { userId, recapTitle, videoUrl }
      // });
    }
  }

  async savePreferences(userId: string, preferences: NotificationPreferences) {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          notifications: preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      return false;
    }
  }

  async loadPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notifications')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data?.notifications || {
        browserPush: false,
        email: false,
        recapComplete: true,
        weeklyDigest: false,
      };
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      return {
        browserPush: false,
        email: false,
        recapComplete: true,
        weeklyDigest: false,
      };
    }
  }

  isPushSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!this.isPushSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: { title, options: { icon: '/favicon.ico', badge: '/favicon.ico', ...options } }
        });
        return true;
      } else {
        await this.sendBrowserNotification(title, options);
        return true;
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
