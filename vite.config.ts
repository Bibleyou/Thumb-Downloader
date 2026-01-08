
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Isso permite que o código use process.env.API_KEY no navegador
    'process.env': process.env
  }
});
