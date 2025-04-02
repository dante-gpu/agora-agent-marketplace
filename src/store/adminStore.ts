import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  last_sign_in_at: string;
  banned: boolean;
  role: string | null;
}

export interface BotAnalytics {
  id: string;
  name: string;
  total_interactions: number;
  avg_response_time: number;
  accuracy_rating: number;
  daily_active_users: number;
}

export interface ContentReport {
  id: string;
  reporter: UserProfile;
  message: {
    content: string;
    created_at: string;
  };
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

interface AdminState {
  users: UserProfile[];
  botAnalytics: BotAnalytics[];
  reports: ContentReport[];
  loading: boolean;
  error: string | null;
  
  // User Management
  fetchUsers: () => Promise<void>;
  banUser: (userId: string, reason: string, expiresAt?: Date) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  setUserRole: (userId: string, role: 'admin' | 'moderator' | null) => Promise<void>;
  
  // Bot Analytics
  fetchBotAnalytics: () => Promise<void>;
  
  // Content Moderation
  fetchReports: () => Promise<void>;
  resolveReport: (reportId: string, action: 'resolve' | 'dismiss') => Promise<void>;
  deleteMessage: (messageId: string, reason: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  botAnalytics: [],
  reports: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user:auth.users(email, last_sign_in_at),
          role:user_roles(role),
          banned:user_bans(id)
        `);

      if (usersError) throw usersError;

      set({
        users: users.map(user => ({
          id: user.user_id,
          email: user.user.email,
          username: user.username,
          created_at: user.created_at,
          last_sign_in_at: user.user.last_sign_in_at,
          banned: user.banned !== null,
          role: user.role?.[0]?.role || null
        }))
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  banUser: async (userId: string, reason: string, expiresAt?: Date) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: userId,
          reason,
          expires_at: expiresAt?.toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  unbanUser: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('user_bans')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  setUserRole: async (userId: string, role: 'admin' | 'moderator' | null) => {
    try {
      set({ loading: true, error: null });
      
      if (role === null) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
        if (error) throw error;
      }

      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchBotAnalytics: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('bot_analytics')
        .select(`
          *,
          agent:agents(name)
        `);

      if (error) throw error;

      set({
        botAnalytics: data.map(analytics => ({
          id: analytics.id,
          name: analytics.agent.name,
          total_interactions: analytics.total_interactions,
          avg_response_time: analytics.avg_response_time,
          accuracy_rating: analytics.accuracy_rating,
          daily_active_users: analytics.daily_active_users
        }))
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchReports: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          reporter:user_profiles!reporter_id(username),
          message:chat_messages(content, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        reports: data.map(report => ({
          id: report.id,
          reporter: report.reporter,
          message: report.message,
          reason: report.reason,
          status: report.status,
          created_at: report.created_at
        }))
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  resolveReport: async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', reportId);

      if (error) throw error;
      await get().fetchReports();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  deleteMessage: async (messageId: string, reason: string) => {
    try {
      set({ loading: true, error: null });
      
      // Create moderation action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          moderator_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: 'delete_message',
          target_type: 'message',
          target_id: messageId,
          reason
        });

      if (actionError) throw actionError;

      // Delete message
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) throw deleteError;
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  }
}));