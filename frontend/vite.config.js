import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL?.trim();

  if (mode === 'production') {
    if (!apiUrl) {
      throw new Error('Set VITE_API_URL to the deployed backend URL before building for production.');
    }

    let parsedApiUrl;
    try {
      parsedApiUrl = new URL(apiUrl);
    } catch {
      throw new Error('VITE_API_URL must be a valid absolute HTTPS URL.');
    }

    if (parsedApiUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedApiUrl.hostname)) {
      throw new Error('VITE_API_URL must use a public HTTPS backend URL in production.');
    }
  }

  return {
    plugins: [react()],
    base: '/',
  };
})
