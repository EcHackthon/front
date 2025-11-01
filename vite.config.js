import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발용 프록시: /api 로 시작하는 요청을 백엔드로 전달합니다.
    proxy: {
      '/api': {
        target: 'https://back-ieck.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://back-ieck.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
