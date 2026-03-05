/// <reference types="vitest/config" />

import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, './src/renderer/src'),
      }
    },
    esbuild: {
      // pure: ['console.log'],
      // drop: ["console", "debugger"],
    },
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    },
    plugins: [react(), tailwindcss(), tsconfigPaths()]
  }
})
