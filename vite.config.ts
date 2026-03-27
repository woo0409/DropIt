import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

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

// 用 PostCSS + Tailwind 编译 content.css
async function buildContentCSS(): Promise<string> {
  const cssPath = resolve(__dirname, 'src/content/content.css')
  const cssContent = fs.readFileSync(cssPath, 'utf-8')

  const result = await postcss([
    tailwindcss(),
    autoprefixer(),
  ]).process(cssContent, {
    from: cssPath,
    to: cssPath,
  })

  return result.css
}

// 插件：用 esbuild 将 content script 打包为纯净单一 IIFE
function rebuildContentIIFE() {
  return {
    name: 'rebuild-content-iife',
    async closeBundle() {
      const entry = resolve(__dirname, 'src/content/index.tsx')
      const out = resolve(__dirname, 'dist/content.js')

      try {
        // 1. 先用 PostCSS + Tailwind 编译 CSS
        const compiledCSS = await buildContentCSS()
        console.log(`[rebuild-content] compiled CSS size: ${compiledCSS.length} chars`)

        // 2. 读取原始入口文件，替换 CSS 导入为内联字符串
        let entryContent = fs.readFileSync(entry, 'utf-8')
        entryContent = entryContent.replace(
          /import\s+contentCss\s+from\s+['"]\.\/content\.css\?inline['"];?/,
          `const contentCss = ${JSON.stringify(compiledCSS)};`
        )

        // 3. 写入临时入口文件（放在 src/content/ 下，保持相对路径不变）
        const tempEntry = resolve(__dirname, 'src/content/.temp-entry.tsx')
        fs.writeFileSync(tempEntry, entryContent, 'utf-8')

        // 4. 用 esbuild 打包
        execSync(
          `npx esbuild "${tempEntry}" ` +
          `--bundle ` +
          `--define:process.env.NODE_ENV='"production"' ` +
          `--format=iife ` +
          `--global-name=DropIt ` +
          `--alias:@=${resolve(__dirname, 'src')} ` +
          `--outfile="${out}"`,
          { stdio: 'inherit' }
        )

        // 5. 清理临时文件
        fs.unlinkSync(tempEntry)

        const stat = fs.statSync(out)
        console.log(`[rebuild-content] content.js IIFE (${stat.size} bytes)`)
      } catch (err) {
        console.error('[rebuild-content] build failed:', err)
        // 清理可能残留的临时文件
        const tempEntry = resolve(__dirname, 'src/content/.temp-entry.tsx')
        if (fs.existsSync(tempEntry)) fs.unlinkSync(tempEntry)
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
