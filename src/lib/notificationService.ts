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
      .select('notification_settings')
      .eq('user_id', userId)
      .single();

    const settings = prefs?.notification_settings as NotificationPreferences | null;

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
          notification_settings: preferences,
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
        .select('notification_settings')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data?.notification_settings || {
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
}

export const notificationService = new NotificationService();
