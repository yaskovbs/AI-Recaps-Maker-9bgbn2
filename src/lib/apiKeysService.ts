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

  // Save API keys to database
  async saveKeys(userId: string, keys: APIKeysData): Promise<{ success: boolean; error?: string }> {
    try {
      const providers = [
        { provider: 'youtube', key: keys.youtube },
        { provider: 'google_search', key: keys.googleSearch },
        { provider: 'search_engine_id', key: keys.searchEngineId },
        { provider: 'gemini', key: keys.gemini },
      ];

      for (const { provider, key } of providers) {
        if (key && key.trim()) {
          // Validate format
          const validation = this.validateKeyFormat(provider, key);
          if (!validation.valid) {
            return { success: false, error: `${provider}: ${validation.error}` };
          }

          // Encrypt and save
          const encryptedKey = this.encrypt(key);
          const keyHint = this.createHint(key);

          // Upsert (update if exists, insert if not)
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

      // Also save to localStorage as backup
      localStorage.setItem('airm_api_keys_backup', this.encrypt(JSON.stringify(keys)));

      return { success: true };
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      return { success: false, error: error.message || 'Failed to save API keys' };
    }
  }

  // Load API keys from database
  async loadKeys(userId: string): Promise<{ keys: APIKeysData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const keys: APIKeysData = {};

      if (data && data.length > 0) {
        for (const record of data) {
          const decryptedKey = this.decrypt(record.encrypted_key);
          
          switch (record.provider) {
            case 'youtube':
              keys.youtube = decryptedKey;
              break;
            case 'google_search':
              keys.googleSearch = decryptedKey;
              break;
            case 'search_engine_id':
              keys.searchEngineId = decryptedKey;
              break;
            case 'gemini':
              keys.gemini = decryptedKey;
              break;
          }
        }
      } else {
        // Try loading from localStorage backup
        const backup = localStorage.getItem('airm_api_keys_backup');
        if (backup) {
          try {
            const decrypted = this.decrypt(backup);
            const parsed = JSON.parse(decrypted);
            return { keys: parsed };
          } catch {
            // Backup corrupted, ignore
          }
        }
      }

      return { keys };
    } catch (error: any) {
      console.error('Error loading API keys:', error);
      return { keys: {}, error: error.message || 'Failed to load API keys' };
    }
  }

  // Get key hints (for display purposes)
  async getKeyHints(userId: string): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, key_hint')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const hints: Record<string, string> = {};
      if (data) {
        for (const record of data) {
          hints[record.provider] = record.key_hint;
        }
      }

      return hints;
    } catch (error) {
      console.error('Error getting key hints:', error);
      return {};
    }
  }

  // Delete a specific API key
  async deleteKey(userId: string, provider: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      return false;
    }
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
