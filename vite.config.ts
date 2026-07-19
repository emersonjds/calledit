import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // @solana/web3.js needs a global Buffer that Vite externalizes in the browser.
    nodePolyfills({ globals: { Buffer: true } }),
    VitePWA({
      registerType: 'autoUpdate',
      // Do not register a workbox SW: MSW owns the service worker in this demo
      // (two SWs at the same scope would fight and break the mocked /api backend).
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Called It',
        short_name: 'Called It',
        description: 'Prove you called it first — live, on-chain-verified match predictions.',
        theme_color: '#0B0F14',
        background_color: '#0B0F14',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'out', // drag-and-drop this folder onto Netlify
    chunkSizeWarningLimit: 1500,
  },
});
