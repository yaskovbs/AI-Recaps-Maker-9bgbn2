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
  private swRegistration: ServiceWorkerRegistration | null = null;

  // Check if push notifications are supported (mobile + desktop via Service Worker)
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  // Get the active Service Worker registration
  private async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.swRegistration) return this.swRegistration;

    if (!('serviceWorker' in navigator)) return null;

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      return this.swRegistration;
    } catch {
      return null;
    }
  }

  // Request notification permission (works on mobile and desktop)
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  // Send a notification via Service Worker (works on mobile and desktop, even in background)
  async sendNotification(title: string, options?: {
    body?: string;
    tag?: string;
    url?: string;
    requireInteraction?: boolean;
  }): Promise<boolean> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    // Try Service Worker notification first (works on mobile + background)
    const registration = await this.getRegistration();
    if (registration) {
      try {
        // Send message to SW to show notification
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body: options?.body || '',
            tag: options?.tag || 'default',
            url: options?.url || '/',
            requireInteraction: options?.requireInteraction || false,
          });
          return true;
        }

        // Fallback: use registration.showNotification directly
        await registration.showNotification(title, {
          body: options?.body || '',
          icon: '/android-chrome-192x192.png',
          badge: '/android-chrome-192x192.png',
          tag: options?.tag || 'default',
          data: { url: options?.url || '/' },
          dir: 'rtl',
          lang: 'he',
          requireInteraction: options?.requireInteraction || false,
        });
        return true;
      } catch (swError) {
        console.warn('SW notification failed, falling back to Notification API:', swError);
      }
    }

    // Fallback: direct Notification API (desktop only, foreground only)
    try {
      const notification = new Notification(title, {
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        body: options?.body || '',
        tag: options?.tag || 'default',
        dir: 'rtl',
        lang: 'he',
        requireInteraction: options?.requireInteraction || false,
      });

      notification.onclick = () => {
        window.focus();
        if (options?.url) {
          window.location.href = options.url;
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Notify when recap is complete (called from job processing)
  async notifyRecapComplete(userId: string, recapTitle: string, recapUrl: string) {
    // Check user preferences
    const prefs = await this.loadPreferences(userId);

    if (prefs.browserPush && prefs.recapComplete) {
      await this.sendNotification('הסיכום שלך מוכן! 🎬', {
        body: `הסיכום "${recapTitle}" הושלם בהצלחה. לחץ כאן לצפייה.`,
        tag: 'recap-complete',
        url: recapUrl,
        requireInteraction: true,
      });
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
