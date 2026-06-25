import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { H5_API_PROXY_TARGET } from './config/api.js';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(appDir, 'static');

function copyStaticToMpWeixin() {
  return {
    name: 'copy-static-to-mp-weixin',
    closeBundle() {
      const outputDirs = [
        path.resolve(appDir, 'dist/build/h5'),
        path.resolve(appDir, 'dist/dev/h5'),
        path.resolve(appDir, 'dist/build/mp-weixin'),
        path.resolve(appDir, 'dist/dev/mp-weixin'),
        path.resolve(appDir, 'unpackage/dist/dev/mp-weixin'),
      ];

      outputDirs.forEach((outputDir) => {
        if (!fs.existsSync(outputDir)) {
          return;
        }

        const targetDir = path.resolve(outputDir, 'static');
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.cpSync(staticDir, targetDir, { recursive: true });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [uni(), copyStaticToMpWeixin()],
    define: {
      __H5_API_BASE_URL__: JSON.stringify(process.env.VITE_H5_API_BASE_URL || ''),
    },
    server: {
      port: 5178,
      strictPort: true,
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || H5_API_PROXY_TARGET,
          changeOrigin: true,
        },
        '/uploads': {
          target: process.env.API_PROXY_TARGET || H5_API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});
