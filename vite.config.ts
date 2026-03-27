import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// 插件：移动 popup.html
function movePopupHtml() {
  return {
    name: 'move-popup-html',
    closeBundle() {
      const srcPath = resolve(__dirname, 'dist/src/popup.html')
      const destPath = resolve(__dirname, 'dist/popup.html')
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath)
        fs.rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true })
      }
    },
  }
}

// 插件：用 esbuild 将 content script 打包为纯净单一 IIFE
function rebuildContentIIFE() {
  return {
    name: 'rebuild-content-iife',
    closeBundle() {
      const entry = resolve(__dirname, 'src/content/index.tsx')
      const out = resolve(__dirname, 'dist/content.js')

      try {
        execSync(
          `npx esbuild "${entry}" ` +
          `--bundle ` +
          `--define:process.env.NODE_ENV='"production"' ` +
          `--format=iife ` +
          `--global-name=DropIt ` +
          `--alias:@=${resolve(__dirname, 'src')} ` +
          `--outfile="${out}"`,
          { stdio: 'inherit' }
        )
        const stat = fs.statSync(out)
        console.log(`[rebuild-content] content.js IIFE (${stat.size} bytes)`)
      } catch {
        console.error('[rebuild-content] esbuild failed')
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    rebuildContentIIFE(),
    movePopupHtml(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js'
          return '[name].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
