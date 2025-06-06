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
  sendMessage: (
    content: string,
    isMarkdown?: boolean,
    agentId?: string
  ) => Promise<void>;
  fetchMessages: (agentId?: string) => Promise<void>;
  clearMessages: (agentId?: string) => Promise<void>;
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

      // Save user message
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

      // Determine bot response
      let botResponse: string;
      let botMarkdown = isMarkdown;

      if (agentId) {
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('slug')
          .eq('id', agentId)
          .single();

        if (agentError || !agentData) throw new Error('Agent not found');

        const slug = agentData.slug;
        if (slug === 'agent' || slug === 'image-generator') {
          console.log('[HUGGINGFACE] agent match: image-generator');
          const imageUrl = await generateImage(content);
          botResponse = `![Generated Image](${imageUrl})`;
          botMarkdown = true;
        } else if (
          slug === 'tokenomics-analys-agent' ||
          slug === 'audit-analys-agent' ||
          slug.startsWith('gpt-') ||
          slug.startsWith('claude-') ||
          slug.startsWith('gemini-') ||
          slug === 'stablelm-2' ||
          slug === 'app-creators' ||
          slug === 'deepseek-v3-fw' ||
          slug === 'grok-2'
        ) {
          botResponse = await queryLLM(slug, content);
          botMarkdown = true;
        } else {
          botResponse = 'No valid agent configuration found.';
        }
      } else {
        botResponse = 'No agent specified.';
      }

      // Save bot message
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

      // Update store
      set((state) => ({
        messages: [...state.messages, userMessage, botMessage],
      }));
    } catch (error) {
      console.error('[ChatStore Error]', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (agentId?: string) => {
    // Always clear messages when loading a new agent
    set({ messages: [], loading: false, error: null });
  },

  clearMessages: async (agentId?: string) => {
    try {
      set({ loading: true, error: null });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let del = supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);
      if (agentId) {
        del = del.eq('agent_id', agentId);
      }

      const { error } = await del;
      if (error) throw error;

      set({ messages: [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
