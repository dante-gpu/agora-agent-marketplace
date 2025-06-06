import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tüm environment değişkenlerini .env dosyasından çekmek için
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  ssr: {
    noExternal: [
      '@solana/wallet-adapter-wallets',
      '@solana/wallet-adapter-walletconnect',
      '@walletconnect/client',
      '@walletconnect/web3-provider',
    ],
  },
});
