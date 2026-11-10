import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite 配置：React 插件 + dev server 端口 + /api 代理。
 * 代理只在 dev 有效（dev server 在跑才有转发）；build 之后是静态文件，代理自然失效。
 * 目标地址从 .env 读取，不写死在代码里。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
