import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Agile Octopus',
        short_name: 'Agile',
        description: 'Best time to use energy',
        theme_color: '#10002F',
      },
      pwaAssets: {
        config: 'pwa-assets.config.ts',
      },
    }),
  ],
});
