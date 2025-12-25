import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['@mediapipe/hands', '@mediapipe/drawing_utils'],
  },
});