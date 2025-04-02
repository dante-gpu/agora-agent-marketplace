import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface UserSettings {
  id: string;
  theme: string;
  show_email: boolean;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: Record<string, string>;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
}

export interface AgentBookmark {
  id: string;
  agent_id: string;
  notes: string | null;
  created_at: string;
  agent: {
    name: string;
    description: string;
    image_url: string;
    category: string;
  };
}

export interface AgentHistory {
  id: string;
  agent_id: string;
  total_interactions: number;
  total_tokens: number;
  last_interaction_at: string;
  first_interaction_at: string;
  agent: {
    name: string;
    description: string;
    image_url: string;
    category: string;
  };
}

interface ProfileState {
  settings: UserSettings | null;
  bookmarks: AgentBookmark[];
  history: AgentHistory[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Bookmarks
  fetchBookmarks: () => Promise<void>;
  addBookmark: (agentId: string, notes?: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  updateBookmarkNotes: (bookmarkId: string, notes: string) => Promise<void>;
  
  // History
  fetchHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  settings: null,
  bookmarks: [],
  history: [],
  loading: false,
  error: null,
  initialized: false,

  fetchSettings: async () => {
    if (get().initialized) return;
    
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert({
              user_id: user.id
            })
            .select()
            .single();

          if (createError) throw createError;
          set({ settings: newSettings });
        } else {
          throw error;
        }
      } else {
        set({ settings: data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  updateSettings: async (settings) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      set({ settings: data });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchBookmarks: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_bookmarks')
        .select(`
          *,
          agent:agents(
            name,
            description,
            image_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ bookmarks: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addBookmark: async (agentId, notes) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_bookmarks')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          notes
        })
        .select(`
          *,
          agent:agents(
            name,
            description,
            image_url,
            category
          )
        `)
        .single();

      if (error) throw error;
      set(state => ({
        bookmarks: [data, ...state.bookmarks]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeBookmark: async (bookmarkId) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('agent_bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (error) throw error;
      set(state => ({
        bookmarks: state.bookmarks.filter(b => b.id !== bookmarkId)
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateBookmarkNotes: async (bookmarkId, notes) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_bookmarks')
        .update({ notes })
        .eq('id', bookmarkId)
        .eq('user_id', user.id)
        .select(`
          *,
          agent:agents(
            name,
            description,
            image_url,
            category
          )
        `)
        .single();

      if (error) throw error;
      set(state => ({
        bookmarks: state.bookmarks.map(b =>
          b.id === bookmarkId ? data : b
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchHistory: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_agent_history')
        .select(`
          *,
          agent:agents(
            name,
            description,
            image_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('last_interaction_at', { ascending: false });

      if (error) throw error;
      set({ history: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  clearHistory: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_agent_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      set({ history: [] });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));