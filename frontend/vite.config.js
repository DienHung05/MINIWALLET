import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy mọi request /api -> Sails backend (http://localhost:1337)
// => frontend gọi axios baseURL '/api' là chạm tới backend, không lo CORS khi dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
    },
  },
});
