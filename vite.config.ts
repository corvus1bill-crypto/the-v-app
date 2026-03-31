import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env so we can proxy to the configured API in development
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'https://the-v-app-production.up.railway.app';

  return {
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the backend to avoid CORS issues during local dev
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: true,
        ws: false,
      },
    },
  },
}
})
})
