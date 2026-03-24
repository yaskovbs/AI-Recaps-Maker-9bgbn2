import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isGoogleOAuthConfigured, googleClientId } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Read localStorage for instant UI before async auth check
    const stored = localStorage.getItem('airm_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* corrupted, ignore */ }
    }

    // Single listener handles ALL auth events — no separate getSession() call
    // This prevents the race condition between checkAuth() and onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await handleAuthUser(session.user);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('airm_user');
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthUser = async (authUser: SupabaseUser) => {
    try {
      // Get or create user profile
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If profile doesn't exist (OAuth user), create it
      if (profileError && profileError.code === 'PGRST116') {
        const username = authUser.user_metadata?.full_name || 
                        authUser.user_metadata?.name || 
                        authUser.email?.split('@')[0] || 
                        'User';

        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            username,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Profile creation error:', insertError);
          // Might already exist from trigger, try fetching again
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          profile = existingProfile || newProfile;
        } else {
          profile = newProfile;
        }

        // Initialize wallet and learning for new OAuth user
        if (profile) {
          await supabase.from('credits_wallet').insert({
            user_id: authUser.id,
            balance: 5,
          });

          await supabase.from('learning_profiles').insert({
            user_id: authUser.id,
          });
        }
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          avatar: profile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          createdAt: profile.created_at,
        };
        setUser(userData);
        localStorage.setItem('airm_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error handling auth user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Check if Google OAuth credentials are configured
      if (!isGoogleOAuthConfigured) {
        console.warn('⚠️ Google OAuth credentials not configured in .env file (VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_SECRET)');
        console.warn('⚠️ Also make sure credentials are configured in OnSpace/Supabase dashboard under Auth > Providers > Google');
      }

      console.log('🔵 Starting Google OAuth login...');
      console.log('🔵 Redirect URL:', window.location.origin);
      if (googleClientId) {
        console.log('🔵 Using Google Client ID:', googleClientId.substring(0, 20) + '...');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);

        // Check if it's a configuration error
        if (error.message.includes('not enabled') || error.message.includes('provider')) {
          throw new Error(
            'Google OAuth לא מוגדר במערכת. יש להגדיר VITE_GOOGLE_CLIENT_ID ו-VITE_GOOGLE_CLIENT_SECRET בקובץ .env ' +
            'וגם בלוח הבקרה של OnSpace/Supabase תחת Auth > Providers > Google'
          );
        }

        throw error;
      }

      console.log('✅ OAuth initiated, redirecting to Google...', data);

      // Don't set loading state - user will be redirected to Google
      // Auth state will be handled by onAuthStateChange when they return
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      throw new Error(error.message || 'התחברות עם Google נכשלה. נסה שוב מאוחר יותר.');
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);

      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      // Wait a bit for auth to fully process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create user profile (now that user is authenticated)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile already exists (from trigger), ignore error
        if (!profileError.message?.includes('duplicate') && !profileError.code?.includes('23505')) {
          throw profileError;
        }
      }

      // Create user data
      const userData: User = {
        id: authData.user.id,
        email,
        username,
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      localStorage.setItem('airm_user', JSON.stringify(userData));

      // Initialize gamification and wallet for new user
      const { error: walletError } = await supabase
        .from('credits_wallet')
        .insert({
          user_id: authData.user.id,
          balance: 5, // Welcome bonus
        });

      if (walletError) console.error('Wallet creation error:', walletError);

      const { error: learningError } = await supabase
        .from('learning_profiles')
        .insert({
          user_id: authData.user.id,
        });

      if (learningError) console.error('Learning profile creation error:', learningError);

    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from login');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      const userData: User = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
      };

      setUser(userData);
      localStorage.setItem('airm_user', JSON.stringify(userData));

    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔴 Starting logout...');
      setIsLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      // Clear local state
      setUser(null);
      localStorage.removeItem('airm_user');
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout even if Supabase fails
      setUser(null);
      localStorage.removeItem('airm_user');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: data.username,
          avatar_url: data.avatar,
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('airm_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback for cache issues - return default values
    console.warn('⚠️ useAuth called outside AuthProvider - using fallback');
    return {
      user: null,
      isLoading: false,
      login: async () => {},
      loginWithGoogle: async () => {},
      signup: async () => {},
      logout: async () => {
        localStorage.clear();
        window.location.href = '/login';
      },
      updateProfile: async () => {},
    };
  }
  return context;
}
