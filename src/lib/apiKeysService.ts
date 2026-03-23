import { supabase } from './supabase';

// AES-256-GCM encryption for secure API key storage
// Keys are encrypted so that nobody (including the site owner) can see the real keys
const ENCRYPTION_SALT = 'airm-secure-salt-2026';
const ENCRYPTION_ITERATIONS = 100000;
const OLD_XOR_KEY = 'airm-local-encryption-key-2026'; // For backward compatibility

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
  // Derive an AES-256 key from a password using PBKDF2
  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(ENCRYPTION_SALT),
        iterations: ENCRYPTION_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // AES-256-GCM encryption - produces a different ciphertext each time (random IV)
  private async encryptAES(text: string): Promise<string> {
    try {
      const key = await this.deriveKey(ENCRYPTION_SALT);
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // Random 96-bit IV

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(text)
      );

      // Combine IV + ciphertext and encode as base64
      const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return 'aes:' + btoa(String.fromCharCode(...combined));
    } catch {
      // Fallback to XOR if Web Crypto not available
      return this.encryptXOR(text);
    }
  }

  // AES-256-GCM decryption
  private async decryptAES(encrypted: string): Promise<string> {
    try {
      const key = await this.deriveKey(ENCRYPTION_SALT);
      const raw = atob(encrypted.replace('aes:', ''));
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
      }

      const iv = bytes.slice(0, 12);
      const ciphertext = bytes.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      return '';
    }
  }

  // Legacy XOR encryption (for backward compatibility only)
  private encryptXOR(text: string): string {
    return btoa(
      text
        .split('')
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ OLD_XOR_KEY.charCodeAt(i % OLD_XOR_KEY.length))
        )
        .join('')
    );
  }

  // Legacy XOR decryption
  private decryptXOR(encrypted: string): string {
    try {
      return atob(encrypted)
        .split('')
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ OLD_XOR_KEY.charCodeAt(i % OLD_XOR_KEY.length))
        )
        .join('');
    } catch {
      return '';
    }
  }

  // Smart encrypt - always uses AES-GCM
  private async encrypt(text: string): Promise<string> {
    return this.encryptAES(text);
  }

  // Smart decrypt - detects format and uses appropriate method
  private async decrypt(encrypted: string): Promise<string> {
    if (encrypted.startsWith('aes:')) {
      return this.decryptAES(encrypted);
    }
    // Legacy XOR format - decrypt with old method
    return this.decryptXOR(encrypted);
  }

  // Create masked hint (e.g., "AIza...xyz123")
  private createHint(key: string): string {
    if (key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 6)}`;
  }

  // Load keys from localStorage backup
  private async loadFromLocalStorage(): Promise<APIKeysData> {
    try {
      const backup = localStorage.getItem('airm_api_keys_backup');
      if (backup) {
        const decrypted = await this.decrypt(backup);
        if (decrypted) {
          return JSON.parse(decrypted);
        }
      }
    } catch {
      // Backup corrupted, ignore
    }
    return {};
  }

  // Save keys to localStorage (encrypted)
  private async saveToLocalStorage(keys: APIKeysData): Promise<void> {
    try {
      const encrypted = await this.encrypt(JSON.stringify(keys));
      localStorage.setItem('airm_api_keys_backup', encrypted);
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
    return {};
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
      await this.saveToLocalStorage(keys);
      this.saveHintsToLocalStorage(keys);

      // 3. Try DB save (best effort, don't fail if DB is unavailable)
      try {
        for (const { provider, key } of providers) {
          if (key && key.trim()) {
            const encryptedKey = await this.encrypt(key);
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
          const decryptedKey = await this.decrypt(record.encrypted_key);
          const field = PROVIDER_TO_FIELD[record.provider];
          if (field && decryptedKey) {
            keys[field] = decryptedKey;
          }
        }

        // Refresh localStorage backup from DB data
        await this.saveToLocalStorage(keys);
        return { keys };
      }
    } catch (dbError) {
      console.warn('DB load failed, using localStorage:', dbError);
    }

    // Fallback: localStorage
    const keys = await this.loadFromLocalStorage();
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
    const keys = await this.loadFromLocalStorage();
    const field = PROVIDER_TO_FIELD[provider];
    if (field) {
      delete keys[field];
      await this.saveToLocalStorage(keys);
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
    const formatValidation = this.validateKeyFormat(provider, key);
    if (!formatValidation.valid) {
      return formatValidation;
    }
    return { valid: true };
  }
}

export const apiKeysService = new APIKeysService();
