import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSessionOnce, supabase } from './supabase';
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
  signup: (email: string, password: string, username: string) => Promise<'authenticated' | 'confirmation-required'>;
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
      try { setUser(JSON.parse(stored)); } catch (e) { /* corrupted, ignore */ }
    }

    // Safety timeout — if INITIAL_SESSION never fires, stop loading after 5s
    const timeout = setTimeout(() => {
      if (!mounted) return;
      void getSessionOnce().then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error('Session restore error:', error);
        if (data.session?.user) void handleAuthUser(data.session.user);
        else {
          setUser(null);
          localStorage.removeItem('airm_user');
          setIsLoading(false);
        }
      });
    }, 5000);

    // The listener handles normal auth events. If the initial event is missed,
    // the timeout below verifies the persisted Supabase session before clearing UI state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        clearTimeout(timeout);

        console.log('Auth state change:', event, session?.user?.id);

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Do not await Supabase queries inside onAuthStateChange; doing so can
          // contend with the auth client's internal session lock.
          void handleAuthUser(session.user);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setUser(null);
          localStorage.removeItem('airm_user');
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
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthUser = async (authUser: SupabaseUser) => {
    try {
      // Get or create user profile
      const { data: initialProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      let profile = initialProfile;

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

      const userData: User = {
        id: authUser.id,
        email: profile?.email || authUser.email || '',
        username: profile?.username || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        createdAt: profile?.created_at || authUser.created_at,
      };
      setUser(userData);
      localStorage.setItem('airm_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error handling auth user:', error);
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        username: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        createdAt: authUser.created_at,
      };
      setUser(fallbackUser);
      localStorage.setItem('airm_user', JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
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
            'Google OAuth is not enabled. Configure Google under Auth > Providers in the OnSpace/Supabase dashboard.'
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

      // Supabase returns a user without a session when email confirmation is
      // enabled. That is a successful signup, not an application error.
      if (!authData.session) {
        setUser(null);
        localStorage.removeItem('airm_user');
        return 'confirmation-required';
      }

      await handleAuthUser(authData.user);
      return 'authenticated';

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
      localStorage.removeItem('recap_draft');
      localStorage.removeItem('last_job_id');
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout even if Supabase fails
      setUser(null);
      localStorage.removeItem('airm_user');
      localStorage.removeItem('recap_draft');
      localStorage.removeItem('last_job_id');
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
