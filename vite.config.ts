import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
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
