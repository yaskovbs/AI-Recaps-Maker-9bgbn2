import { supabase } from './supabase';

export interface LearningPreferences {
  continuousLearning: boolean;
  globalLearning: boolean;
}

const STORAGE_KEY = 'airm_learning_prefs';

const DEFAULT_PREFS: LearningPreferences = {
  continuousLearning: true,
  globalLearning: false,
};

class LearningService {
  // Save to localStorage
  private saveToLocalStorage(preferences: LearningPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save learning prefs to localStorage:', e);
    }
  }

  // Load from localStorage
  private loadFromLocalStorage(): LearningPreferences | null {
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

  async savePreferences(userId: string, preferences: LearningPreferences): Promise<boolean> {
    // 1. Save to localStorage FIRST (always works)
    this.saveToLocalStorage(preferences);

    // 2. Try DB save (best effort) - update the learning_profiles table
    try {
      const { error } = await supabase
        .from('learning_profiles')
        .upsert({
          user_id: userId,
          continuous_learning_enabled: preferences.continuousLearning,
          continuous_learning_consent: preferences.continuousLearning,
          global_learning_opt_in: preferences.globalLearning,
          global_learning_consented_at: preferences.globalLearning ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.warn('Failed to save learning preferences to DB (saved to localStorage):', error);
      return true; // Still success because localStorage worked
    }
  }

  async loadPreferences(userId: string): Promise<LearningPreferences> {
    // 1. Try DB first
    try {
      const { data, error } = await supabase
        .from('learning_profiles')
        .select('continuous_learning_enabled, global_learning_opt_in')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const prefs: LearningPreferences = {
          continuousLearning: data.continuous_learning_enabled ?? true,
          globalLearning: data.global_learning_opt_in ?? false,
        };
        // Sync to localStorage
        this.saveToLocalStorage(prefs);
        return prefs;
      }
    } catch (error) {
      console.warn('Failed to load learning preferences from DB:', error);
    }

    // 2. Fallback: localStorage
    const localPrefs = this.loadFromLocalStorage();
    if (localPrefs) {
      return localPrefs;
    }

    // 3. Defaults
    return { ...DEFAULT_PREFS };
  }

  async resetProfile(userId: string): Promise<boolean> {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);

    // Try DB reset (best effort)
    try {
      const { error } = await supabase
        .from('learning_profiles')
        .update({
          continuous_learning_enabled: true,
          continuous_learning_consent: false,
          global_learning_opt_in: false,
          global_learning_consented_at: null,
          total_recaps: 0,
          favorite_genres: [],
          preferred_duration_seconds: null,
          metadata: {},
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to reset learning profile in DB:', error);
    }

    return true;
  }
}

export const learningService = new LearningService();
