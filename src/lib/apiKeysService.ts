import { supabase, getSessionOnce } from './supabase';

// AES-GCM encryption prevents plaintext-at-rest storage in the browser/database.
// This is client-side protection, not a zero-knowledge vault.
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

export interface SaveKeysResult {
  success: boolean;
  error?: string;
  dbSynced: boolean;
  dbError?: string;
  validations?: APIKeyValidationResult[];
}

export type APIKeyProvider = 'youtube' | 'google_search' | 'search_engine_id' | 'gemini';
export type APIKeyValidationCode = 'valid' | 'missing' | 'invalid' | 'forbidden' | 'quota_exceeded' | 'network_error' | 'pair_required';

export interface APIKeyValidationResult {
  provider: APIKeyProvider;
  valid: boolean;
  code: APIKeyValidationCode;
  message: string;
  checkedAt: string;
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
  private dbAvailable: boolean | null = null;
  private realtimeChannel: any = null;
  private syncCallbacks: Array<(keys: APIKeysData) => void> = [];

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
    if (!globalThis.crypto?.subtle) {
      throw new Error('Secure browser encryption is unavailable. API keys were not saved.');
    }
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
    } catch (error) {
      throw new Error('Unable to encrypt API keys securely.', { cause: error });
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

  // Read-only legacy migration path. New data is never encrypted with XOR.
  private decryptXOR(encrypted: string): string {
    try {
      const [salt, encoded] = encrypted.split('.');
      if (!salt || !encoded) return '';
      
      const step1 = atob(encoded);
      const step2 = step1
        .split('')
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ OLD_XOR_KEY.charCodeAt(i % OLD_XOR_KEY.length))
        )
        .join('');
      return atob(step2);
    } catch (error) {
      console.error('Decryption failed:', error);
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
    if (key.length < 8) return '●●●●●●●●';
    const visibleStart = Math.min(4, Math.floor(key.length * 0.2));
    const visibleEnd = Math.min(4, Math.floor(key.length * 0.1));
    const hiddenCount = key.length - visibleStart - visibleEnd;
    return `${key.substring(0, visibleStart)}${'●'.repeat(Math.min(hiddenCount, 8))}${key.substring(key.length - visibleEnd)}`;
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

  // Ensure auth session is valid before DB operations
  // Uses deduplicated getter to prevent lock contention
  // Manual refreshSession() removed — autoRefreshToken handles this
  private async ensureSession(): Promise<boolean> {
    try {
      const { data: { session } } = await getSessionOnce();
      return !!session;
    } catch {
      return false;
    }
  }

  // Test if the api_keys table is accessible in Supabase
  async testDbConnection(userId: string): Promise<{ connected: boolean; error?: string }> {
    try {
      const sessionValid = await this.ensureSession();
      if (!sessionValid) {
        this.dbAvailable = false;
        return { connected: false, error: 'אין סשן פעיל - יש להתחבר מחדש' };
      }

      const { error } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        this.dbAvailable = false;
        return { connected: false, error: `שגיאת מסד נתונים: ${error.message}` };
      }

      this.dbAvailable = true;
      return { connected: true };
    } catch (e: any) {
      this.dbAvailable = false;
      return { connected: false, error: e.message || 'שגיאה לא צפויה' };
    }
  }

  // Get current DB availability status
  isDbAvailable(): boolean | null {
    return this.dbAvailable;
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

  // Save to DB with retry (1 retry attempt)
  private async saveToDbWithRetry(userId: string, providers: { provider: string; key?: string }[]): Promise<{ success: boolean; error?: string }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // Ensure session is valid before each attempt
        const sessionValid = await this.ensureSession();
        if (!sessionValid) {
          return { success: false, error: 'סשן לא תקין - יש להתחבר מחדש' };
        }

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
          } else {
            const { error } = await supabase
              .from('api_keys')
              .delete()
              .eq('user_id', userId)
              .eq('provider', provider);
            if (error) throw error;
          }
        }

        this.dbAvailable = true;
        return { success: true };
      } catch (dbError: any) {
        console.warn(`DB save attempt ${attempt + 1} failed:`, dbError);
        if (attempt === 0) {
          // Wait briefly before retry
          await new Promise(r => setTimeout(r, 1000));
        } else {
          this.dbAvailable = false;
          return { success: false, error: dbError.message || 'שמירה במסד הנתונים נכשלה' };
        }
      }
    }
    return { success: false, error: 'שמירה במסד הנתונים נכשלה' };
  }

  // Save API keys - localStorage first (always works), then DB with retry and reporting
  async saveKeys(userId: string, keys: APIKeysData): Promise<SaveKeysResult> {
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
            return { success: false, dbSynced: false, error: `${provider}: ${validation.error}` };
          }
        }
      }

      // Provider validation is advisory. A validly-shaped key may return 403
      // because its API is not enabled yet or because it has referrer/IP
      // restrictions. Users must still be able to store it and fix the Google
      // configuration later.
      const validationResults = await this.validateKeys(keys);

      // Store keys only in the authenticated database. Persistent browser
      // storage is intentionally avoided because XSS can read client storage.
      const dbResult = await this.saveToDbWithRetry(userId, providers);
      if (!dbResult.success) {
        return { success: false, dbSynced: false, dbError: dbResult.error, error: dbResult.error || 'Secure cloud storage failed.', validations: validationResults };
      }
      if (dbResult.success) {
        await Promise.all(validationResults.map(result => supabase
          .from('api_keys')
          .update({
            validation_status: result.code,
            validation_message: result.message,
            last_validated_at: result.checkedAt,
          })
          .eq('user_id', userId)
          .eq('provider', result.provider)));
      }

      return {
        success: true,
        dbSynced: dbResult.success,
        dbError: dbResult.error,
        validations: validationResults,
      };
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      return { success: false, dbSynced: false, error: error.message || 'Failed to save API keys' };
    }
  }

  // Sync keys from localStorage to DB (manual retry)
  async syncToDb(userId: string): Promise<{ success: boolean; error?: string }> {
    const keys = await this.loadFromLocalStorage();
    const hasKeys = Object.values(keys).some(k => k && k.trim());
    if (!hasKeys) {
      return { success: false, error: 'אין מפתחות מקומיים לסנכרון' };
    }

    const providers = [
      { provider: 'youtube', key: keys.youtube },
      { provider: 'google_search', key: keys.googleSearch },
      { provider: 'search_engine_id', key: keys.searchEngineId },
      { provider: 'gemini', key: keys.gemini },
    ];

    return this.saveToDbWithRetry(userId, providers);
  }

  // Load API keys - try DB first, fall back to localStorage
  async loadKeys(userId: string): Promise<{ keys: APIKeysData; error?: string; fromDb: boolean }> {
    // Ensure session before DB attempt
    const sessionValid = await this.ensureSession();

    // Try DB first (only if session is valid)
    if (sessionValid) {
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

          this.dbAvailable = true;
          return { keys, fromDb: true };
        }

        // DB accessible but no keys found
        this.dbAvailable = true;
      } catch (dbError: any) {
        console.warn('DB load failed, using localStorage:', dbError);
        this.dbAvailable = false;
      }
    }

    return { keys: {}, fromDb: false, error: sessionValid ? 'API keys could not be loaded from secure storage.' : 'Sign in again to load API keys.' };
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
      return false;
    }

    return true;
  }

  private validationError(provider: APIKeyProvider, status: number, payload: unknown): APIKeyValidationResult {
    const serialized = JSON.stringify(payload).toLowerCase();
    const quota = status === 429 || serialized.includes('quota') || serialized.includes('dailylimitexceeded');
    const forbidden = status === 403 && !quota;
    return {
      provider,
      valid: false,
      code: quota ? 'quota_exceeded' : forbidden ? 'forbidden' : 'invalid',
      message: quota ? 'The key is valid but its quota is exhausted.' : forbidden ? 'The API is disabled or this key is not allowed to use it.' : 'The key or provider configuration is invalid.',
      checkedAt: new Date().toISOString(),
    };
  }

  async validateKey(provider: APIKeyProvider, key: string, companionKey?: string): Promise<APIKeyValidationResult> {
    const checkedAt = new Date().toISOString();
    const formatValidation = this.validateKeyFormat(provider, key.trim());
    if (!formatValidation.valid) {
      return { provider, valid: false, code: 'invalid', message: formatValidation.error || 'Invalid key format.', checkedAt };
    }

    if (provider === 'search_engine_id' && !companionKey) {
      return { provider, valid: false, code: 'pair_required', message: 'A Google Search API key is required with the Search Engine ID.', checkedAt };
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      let response: Response;
      if (provider === 'gemini') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key.trim())}`, { signal: controller.signal });
      } else if (provider === 'youtube') {
        response = await fetch(`https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=${encodeURIComponent(key.trim())}`, { signal: controller.signal });
      } else {
        const apiKey = provider === 'google_search' ? key.trim() : companionKey!;
        const cx = provider === 'search_engine_id' ? key.trim() : companionKey;
        if (!cx) {
          return { provider, valid: false, code: 'pair_required', message: 'A Search Engine ID is required with the Google Search API key.', checkedAt };
        }
        response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent('API validation')}&num=1`, { signal: controller.signal });
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return this.validationError(provider, response.status, payload);
      }
      return { provider, valid: true, code: 'valid', message: 'Validated successfully.', checkedAt };
    } catch {
      return { provider, valid: false, code: 'network_error', message: 'The provider could not be reached. Check the connection and try again.', checkedAt };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async validateKeys(keys: APIKeysData): Promise<APIKeyValidationResult[]> {
    const checks: Promise<APIKeyValidationResult>[] = [];
    if (keys.youtube?.trim()) checks.push(this.validateKey('youtube', keys.youtube));
    if (keys.gemini?.trim()) checks.push(this.validateKey('gemini', keys.gemini));
    if (keys.googleSearch?.trim() || keys.searchEngineId?.trim()) {
      if (!keys.googleSearch?.trim()) {
        checks.push(Promise.resolve({ provider: 'google_search', valid: false, code: 'pair_required', message: 'A Google Search API key is required with the Search Engine ID.', checkedAt: new Date().toISOString() }));
      } else if (!keys.searchEngineId?.trim()) {
        checks.push(Promise.resolve({ provider: 'search_engine_id', valid: false, code: 'pair_required', message: 'A Search Engine ID is required with the Google Search API key.', checkedAt: new Date().toISOString() }));
      } else {
        checks.push(this.validateKey('google_search', keys.googleSearch, keys.searchEngineId));
      }
    }
    const results = await Promise.all(checks);
    const searchResult = results.find(result => result.provider === 'google_search');
    if (searchResult && keys.searchEngineId?.trim()) {
      results.push({ ...searchResult, provider: 'search_engine_id' });
    }
    return results;
  }

  subscribeToSync(userId: string, callback: (keys: APIKeysData) => void): () => void {
    this.syncCallbacks.push(callback);

    if (!this.realtimeChannel) {
      this.realtimeChannel = supabase
        .channel('api-keys-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'api_keys',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const { keys } = await this.loadKeys(userId);
            this.syncCallbacks.forEach(cb => cb(keys));
          }
        )
        .subscribe();
    }

    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
      if (this.syncCallbacks.length === 0 && this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
        this.realtimeChannel = null;
      }
    };
  }

  unsubscribeFromSync(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    this.syncCallbacks = [];
  }
}

export const apiKeysService = new APIKeysService();
