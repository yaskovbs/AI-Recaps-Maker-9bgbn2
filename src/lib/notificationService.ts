import { supabase } from './supabase';

export interface NotificationPreferences {
  browserPush: boolean;
  email: boolean;
  recapComplete: boolean;
  weeklyDigest: boolean;
}

const STORAGE_KEY = 'airm_notification_prefs';

const DEFAULT_PREFS: NotificationPreferences = {
  browserPush: false,
  email: false,
  recapComplete: true,
  weeklyDigest: false,
};

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Check if push notifications are supported (not supported on most mobile browsers without SW)
  isPushSupported(): boolean {
    return 'Notification' in window;
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
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('notification_settings')
      .eq('user_id', userId)
      .single();

    const settings = prefs?.notification_settings as NotificationPreferences | null;

    if (settings?.browserPush && settings?.recapComplete) {
      await this.sendBrowserNotification('הסיכום שלך מוכן!', {
        body: `הסיכום "${recapTitle}" הושלם בהצלחה. לחץ כאן לצפייה.`,
        tag: 'recap-complete',
        requireInteraction: true,
        data: { videoUrl },
      });
    }

    if (settings?.email && settings?.recapComplete) {
      console.log('Email notification would be sent here');
    }
  }

  // Save to localStorage
  private saveToLocalStorage(preferences: NotificationPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save notification prefs to localStorage:', e);
    }
  }

  // Load from localStorage
  private loadFromLocalStorage(): NotificationPreferences | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // corrupted
    }
    return null;
  }

  async savePreferences(userId: string, preferences: NotificationPreferences): Promise<boolean> {
    // 1. Save to localStorage FIRST (always works)
    this.saveToLocalStorage(preferences);

    // 2. Try DB save (best effort)
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
      console.warn('Failed to save notification preferences to DB (saved to localStorage):', error);
      return true; // Still success because localStorage worked
    }
  }

  async loadPreferences(userId: string): Promise<NotificationPreferences> {
    // 1. Try DB first
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.notification_settings) {
        const prefs = data.notification_settings as NotificationPreferences;
        // Sync to localStorage
        this.saveToLocalStorage(prefs);
        return prefs;
      }
    } catch (error) {
      console.warn('Failed to load notification preferences from DB:', error);
    }

    // 2. Fallback: localStorage
    const localPrefs = this.loadFromLocalStorage();
    if (localPrefs) {
      return localPrefs;
    }

    // 3. Defaults
    return { ...DEFAULT_PREFS };
  }
}

export const notificationService = new NotificationService();
