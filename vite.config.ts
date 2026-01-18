import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import * as child from 'child_process'

const commitHash = child.execSync('git rev-parse --short HEAD').toString().trim()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(commitHash), 'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(Date.now()) },
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
