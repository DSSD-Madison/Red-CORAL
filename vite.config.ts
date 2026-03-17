import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import * as child from 'child_process'

const commitHash = child.execSync('git rev-parse --short HEAD').toString().trim()

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const firebaseProjectId = env.VITE_FIREBASE_PROJECT_ID
  const functionsRegion = env.VITE_FUNCTIONS_REGION || 'us-central1'
  const functionsEmulatorPort = env.VITE_FUNCTIONS_EMULATOR_PORT || '5001'

  return {
    plugins: [react(), tsconfigPaths()],
    define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(commitHash), 'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(Date.now()) },
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: firebaseProjectId
        ? {
            '/api/chat': {
              target: `http://127.0.0.1:${functionsEmulatorPort}`,
              changeOrigin: true,
              rewrite: () => `/${firebaseProjectId}/${functionsRegion}/chat`,
            },
          }
        : undefined,
    },
  }
})
