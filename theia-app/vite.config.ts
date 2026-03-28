import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@alive-studio/runtime-client': path.resolve(__dirname, '../packages/runtime-client/src/index.ts'),
      '@alive-studio/shared-types': path.resolve(__dirname, '../packages/shared-types/src/index.ts'),
      '@alive-studio/launcher': path.resolve(__dirname, '../plugins/alive-launcher/src/index.ts'),
      '@alive-studio/trace': path.resolve(__dirname, '../plugins/alive-trace/src/index.ts'),
      '@alive-studio/signals': path.resolve(__dirname, '../plugins/alive-signals/src/index.ts'),
      '@alive-studio/state': path.resolve(__dirname, '../plugins/alive-state/src/index.ts'),
      '@alive-studio/logs': path.resolve(__dirname, '../plugins/alive-logs/src/index.ts')
    }
  }
})
