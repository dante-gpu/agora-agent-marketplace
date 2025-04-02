import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateResponse } from '../lib/chatbot';

export interface Message {
  id: string;
  content: string;
  is_bot: boolean;
  is_markdown: boolean;
  created_at: string;
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, isMarkdown?: boolean) => Promise<void>;
  fetchMessages: () => Promise<void>;
  clearMessages: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  sendMessage: async (content: string, isMarkdown = false) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          content,
          user_id: user.id,
          is_bot: false,
          is_markdown: isMarkdown
        })
        .select()
        .single();

      if (userError) throw userError;

      // Generate bot response
      const botResponse = await generateResponse(content);
      
      const { data: botMessage, error: botError } = await supabase
        .from('chat_messages')
        .insert({
          content: botResponse,
          user_id: user.id,
          is_bot: true,
          is_markdown: isMarkdown
        })
        .select()
        .single();

      if (botError) throw botError;

      set(state => ({
        messages: [...state.messages, userMessage, botMessage]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  clearMessages: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      set({ messages: [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  }
}));