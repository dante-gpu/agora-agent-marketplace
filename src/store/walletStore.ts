import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PublicKey } from '@solana/web3.js';

interface WalletState {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  error: string | null;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  address: null,
  connecting: false,
  error: null,

  connectWallet: async (address: string) => {
    try {
      set({ connecting: true, error: null });

      // Validate Solana address
      new PublicKey(address);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update user profile with wallet address
      const { error } = await supabase
        .from('user_profiles')
        .update({
          wallet_address: address,
          wallet_connected_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        connected: true,
        address,
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ connecting: false });
    }
  },

  disconnectWallet: async () => {
    try {
      set({ connecting: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Remove wallet address from profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          wallet_address: null,
          wallet_connected_at: null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        connected: false,
        address: null,
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ connecting: false });
    }
  },
}));