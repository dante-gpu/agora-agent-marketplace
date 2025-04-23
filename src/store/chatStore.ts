import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateImage } from '../lib/huggingface';
import { queryLLM } from '../lib/llm';

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
  sendMessage: (content: string, isMarkdown?: boolean, agentId?: string) => Promise<void>;
  fetchMessages: (agentId?: string) => Promise<void>;
  clearMessages: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,
  error: null,

  sendMessage: async (content, isMarkdown = false, agentId) => {
    try {
      set({ loading: true, error: null });
      console.log('[sendMessage]', { content, isMarkdown, agentId });

      const {
        data: { user: supaUser },
      } = await supabase.auth.getUser();

      const user = supaUser?.id
        ? { id: supaUser.id }
        : { id: '00000000-0000-0000-0000-000000000000' };

      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          content,
          user_id: user.id,
          agent_id: agentId,
          is_bot: false,
          is_markdown: isMarkdown,
        })
        .select()
        .single();

      if (userError) throw userError;

      let botResponse: string;
      let botMarkdown = isMarkdown;

      if (agentId) {
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('slug')
          .eq('id', agentId)
          .single();

        console.log('[agentId]', agentId);
        console.log('[agentData]', agentData);
        console.log('[agentError]', agentError);

        if (agentError || !agentData) throw new Error('Agent not found');

        if (agentData.slug === 'agent' || agentData.slug === 'image-generator') {
          console.log('[HUGGINGFACE] agent match: image-generator');
          const imageUrl = await generateImage(content);
          botResponse = `![Generated Image](${imageUrl})`;
          botMarkdown = true;
        } else if (
          agentData.slug.startsWith('gpt-') ||
          agentData.slug.startsWith('claude-') ||
          agentData.slug.startsWith('gemini-') ||
          agentData.slug === 'stablelm-2' ||
          agentData.slug === 'app-creators' 

        ) {
          botResponse = await queryLLM(agentData.slug, content);
          botMarkdown = true;
        } else {
          botResponse = 'No valid agent configuration found.';
        }
      } else {
        botResponse = 'No agent specified.';
      }

      const { data: botMessage, error: botError } = await supabase
        .from('chat_messages')
        .insert({
          content: botResponse,
          user_id: user.id,
          agent_id: agentId,
          is_bot: true,
          is_markdown: botMarkdown,
        })
        .select()
        .single();

      if (botError) throw botError;

      set((state) => ({ messages: [...state.messages, userMessage, botMessage] }));
    } catch (error) {
      console.error('[ChatStore Error]', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (agentId?: string) => {
    try {
      set({ loading: true, error: null });
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id);

      if (error) throw error;
      set({ messages: [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
