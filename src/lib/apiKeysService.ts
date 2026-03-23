import { supabase } from './supabase';

// Simple encryption for client-side storage (not for production-level security)
// In production, use server-side encryption with proper key management
const ENCRYPTION_KEY = 'airm-local-encryption-key-2026'; // Should be from env in production

interface APIKey {
  id: string;
  user_id: string;
  provider: string;
  encrypted_key: string;
  key_hint: string;
  is_active: boolean;
  last_validated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface APIKeysData {
  youtube?: string;
  googleSearch?: string;
  searchEngineId?: string;
  gemini?: string;
}

// Map between provider names and APIKeysData field names
const PROVIDER_TO_FIELD: Record<string, keyof APIKeysData> = {
  youtube: 'youtube',
  google_search: 'googleSearch',
  search_engine_id: 'searchEngineId',
  gemini: 'gemini',
};

const FIELD_TO_PROVIDER: Record<string, string> = {
  youtube: 'youtube',
  googleSearch: 'google_search',
  searchEngineId: 'search_engine_id',
  gemini: 'gemini',
};

class APIKeysService {
  // Simple XOR encryption (for demo - use proper encryption in production)
  private encrypt(text: string): string {
    return btoa(
      text
        .split('')
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
        )
        .join('')
    );
  }

  private decrypt(encrypted: string): string {
    try {
      return atob(encrypted)
        .split('')
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
        )
        .join('');
    } catch {
      return '';
    }
  }

  // Create masked hint (e.g., "AIza...xyz123")
  private createHint(key: string): string {
    if (key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 6)}`;
  }

  // Load keys from localStorage backup
  private loadFromLocalStorage(): APIKeysData {
    try {
      const backup = localStorage.getItem('airm_api_keys_backup');
      if (backup) {
        const decrypted = this.decrypt(backup);
        return JSON.parse(decrypted);
      }
    } catch {
      // Backup corrupted, ignore
    }
    return {};
  }

  // Save keys to localStorage
  private saveToLocalStorage(keys: APIKeysData): void {
    try {
      localStorage.setItem('airm_api_keys_backup', this.encrypt(JSON.stringify(keys)));
    } catch (e) {
      console.warn('Failed to save API keys to localStorage:', e);
    }
  }

  // Save hints to localStorage
  private saveHintsToLocalStorage(keys: APIKeysData): void {
    try {
      const hints: Record<string, string> = {};
      const providers = [
        { provider: 'youtube', key: keys.youtube },
        { provider: 'google_search', key: keys.googleSearch },
        { provider: 'search_engine_id', key: keys.searchEngineId },
        { provider: 'gemini', key: keys.gemini },
      ];
      for (const { provider, key } of providers) {
        if (key && key.trim()) {
          hints[provider] = this.createHint(key);
        }
      }
      localStorage.setItem('airm_api_key_hints', JSON.stringify(hints));
    } catch (e) {
      console.warn('Failed to save key hints to localStorage:', e);
    }
  }

  // Load hints from localStorage
  private loadHintsFromLocalStorage(): Record<string, string> {
    try {
      const stored = localStorage.getItem('airm_api_key_hints');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Corrupted, ignore
    }

    // Last resort: generate from stored keys
    const keys = this.loadFromLocalStorage();
    const hints: Record<string, string> = {};
    const providers = [
      { provider: 'youtube', key: keys.youtube },
      { provider: 'google_search', key: keys.googleSearch },
      { provider: 'search_engine_id', key: keys.searchEngineId },
      { provider: 'gemini', key: keys.gemini },
    ];
    for (const { provider, key } of providers) {
      if (key && key.trim()) {
        hints[provider] = this.createHint(key);
      }
    }
    return hints;
  }

  // Validate API key format (basic validation)
  validateKeyFormat(provider: string, key: string): { valid: boolean; error?: string } {
    if (!key || key.trim().length === 0) {
      return { valid: false, error: 'API key is required' };
    }

    switch (provider) {
      case 'youtube':
      case 'google_search':
      case 'gemini':
        if (!key.startsWith('AIza') && key.length < 30) {
          return { valid: false, error: 'Invalid Google API key format' };
        }
        break;
      case 'search_engine_id':
        if (key.length < 10) {
          return { valid: false, error: 'Invalid Search Engine ID format' };
        }
        break;
    }

    return { valid: true };
  }

  // Save API keys - localStorage first (always works), then DB (best effort)
  async saveKeys(userId: string, keys: APIKeysData): Promise<{ success: boolean; error?: string }> {
    try {
      const providers = [
        { provider: 'youtube', key: keys.youtube },
        { provider: 'google_search', key: keys.googleSearch },
        { provider: 'search_engine_id', key: keys.searchEngineId },
        { provider: 'gemini', key: keys.gemini },
      ];

      // 1. Validate all keys first
      for (const { provider, key } of providers) {
        if (key && key.trim()) {
          const validation = this.validateKeyFormat(provider, key);
          if (!validation.valid) {
            return { success: false, error: `${provider}: ${validation.error}` };
          }
        }
      }

      // 2. Save to localStorage FIRST (primary, always works)
      this.saveToLocalStorage(keys);
      this.saveHintsToLocalStorage(keys);

      // 3. Try DB save (best effort, don't fail if DB is unavailable)
      try {
        for (const { provider, key } of providers) {
          if (key && key.trim()) {
            const encryptedKey = this.encrypt(key);
            const keyHint = this.createHint(key);

            const { error } = await supabase
              .from('api_keys')
              .upsert(
                {
                  user_id: userId,
                  provider,
                  encrypted_key: encryptedKey,
                  key_hint: keyHint,
                  is_active: true,
                },
                {
                  onConflict: 'user_id,provider',
                }
              );

            if (error) throw error;
          }
        }
      } catch (dbError) {
        console.warn('DB save failed (keys saved to localStorage):', dbError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      return { success: false, error: error.message || 'Failed to save API keys' };
    }
  }

  // Load API keys - try DB first, fall back to localStorage
  async loadKeys(userId: string): Promise<{ keys: APIKeysData; error?: string }> {
    // Try DB first
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const keys: APIKeysData = {};

        for (const record of data) {
          const decryptedKey = this.decrypt(record.encrypted_key);
          const field = PROVIDER_TO_FIELD[record.provider];
          if (field) {
            keys[field] = decryptedKey;
          }
        }

        // Refresh localStorage backup from DB data
        this.saveToLocalStorage(keys);
        return { keys };
      }
    } catch (dbError) {
      console.warn('DB load failed, using localStorage:', dbError);
    }

    // Fallback: localStorage
    const keys = this.loadFromLocalStorage();
    return { keys };
  }

  // Get key hints (for display purposes)
  async getKeyHints(userId: string): Promise<Record<string, string>> {
    // Try DB first
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, key_hint')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const hints: Record<string, string> = {};
        for (const record of data) {
          hints[record.provider] = record.key_hint;
        }
        return hints;
      }
    } catch (dbError) {
      console.warn('DB hints failed, using localStorage:', dbError);
    }

    // Fallback: localStorage
    return this.loadHintsFromLocalStorage();
  }

  // Delete a specific API key
  async deleteKey(userId: string, provider: string): Promise<boolean> {
    // Remove from localStorage
    const keys = this.loadFromLocalStorage();
    const field = PROVIDER_TO_FIELD[provider];
    if (field) {
      delete keys[field];
      this.saveToLocalStorage(keys);
    }

    // Remove from hints localStorage
    try {
      const hintsStr = localStorage.getItem('airm_api_key_hints');
      if (hintsStr) {
        const hints = JSON.parse(hintsStr);
        delete hints[provider];
        localStorage.setItem('airm_api_key_hints', JSON.stringify(hints));
      }
    } catch {
      // ignore
    }

    // Try DB delete (best effort)
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) throw error;
    } catch (dbError) {
      console.warn('DB delete failed:', dbError);
    }

    return true;
  }

  // Validate API key by making a test request
  async validateKey(provider: string, key: string): Promise<{ valid: boolean; error?: string }> {
    // Basic format validation first
    const formatValidation = this.validateKeyFormat(provider, key);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    // In production, make actual API calls to validate
    // For now, just return format validation
    return { valid: true };
  }
}

export const apiKeysService = new APIKeysService();
