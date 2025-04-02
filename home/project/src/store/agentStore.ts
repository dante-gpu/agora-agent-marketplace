import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Agent {
  id: string;
  name: string;
  description: string;
  price: number;
  creator: string;
  image_url: string;
  category: string;
  rating: number;
  deployments: number;
  created_at: string;
  slug: string;
  technical_specs: Record<string, any>;
  status: string;
  updated_at: string;
}

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  createAgent: (agent: Omit<Agent, 'id' | 'rating' | 'deployments' | 'created_at' | 'updated_at' | 'slug'>) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  getAgentBySlug: (slug: string) => Promise<Agent | null>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  
  fetchAgents: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ agents: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  createAgent: async (agent) => {
    try {
      set({ loading: true, error: null });
      
      // Generate slug from name
      const slug = agent.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const { data, error } = await supabase
        .from('agents')
        .insert([{
          ...agent,
          slug,
          rating: 0,
          deployments: 0,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        agents: [data, ...state.agents]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  updateAgent: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === id ? { ...agent, ...data } : agent
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  getAgentBySlug: async (slug) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));