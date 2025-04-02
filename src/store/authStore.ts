import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      set({ user: data.user });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    try {
      set({ loading: true, error: null });

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        try {
          // Create user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: authData.user.id,
                username,
              }
            ])
            .single();
          
          if (profileError) {
            // If profile creation fails, delete the auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw profileError;
          }

          // Create default user settings
          const { error: settingsError } = await supabase
            .from('user_settings')
            .insert([
              {
                user_id: authData.user.id,
              }
            ])
            .single();
          
          if (settingsError) {
            // If settings creation fails, clean up
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw settingsError;
          }

          set({ user: authData.user });
        } catch (error) {
          // Clean up on any error
          if (authData.user) {
            await supabase.auth.admin.deleteUser(authData.user.id);
          }
          throw error;
        }
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  initialize: async () => {
    try {
      set({ loading: true, error: null });
      
      // Get initial session
      const { data: { user } } = await supabase.auth.getUser();
      set({ user });
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user profile exists
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          // If no profile exists, create one with a generated username
          if (!profile) {
            const baseUsername = session.user.email?.split('@')[0] || 'user';
            const timestamp = Date.now().toString().slice(-4);
            const username = `${baseUsername}${timestamp}`;

            await supabase
              .from('user_profiles')
              .insert([
                {
                  user_id: session.user.id,
                  username,
                }
              ]);

            // Create default user settings
            await supabase
              .from('user_settings')
              .insert([
                {
                  user_id: session.user.id,
                }
              ]);
          }
        }
        set({ user: session?.user ?? null });
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));