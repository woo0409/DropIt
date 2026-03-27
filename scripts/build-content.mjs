#!/usr/bin/env node
// build-content.mjs - 将 content script 打包为纯净 IIFE
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const entry = path.join(root, 'src/content/index.tsx')
const out = path.join(root, 'dist/content.js')

// 先把 src/content/index.tsx 复制一份为临时 mjs（esbuild 需要）
// 由于我们已经有 dist/src/content.js（Vite build 的产物），直接拿那个
// 问题：那个包含 import 语法，需要把 import 替换成内联

const viteContentJs = path.join(root, 'dist/src/content.js')
const stackStoreJs = path.join(root, 'dist/assets/stackStore-BFyjQL81.js')

if (!fs.existsSync(viteContentJs)) {
  console.error('[build-content] Vite build not found, run npm run build first')
  process.exit(1)
}

let content = fs.readFileSync(viteContentJs, 'utf-8')
const chunk = fs.readFileSync(stackStoreJs, 'utf-8')

// 找到 import 语句并内联
// 格式: import {...} from "../assets/stackStore-BFyjQL81.js";
const importRegex = /import\{[^}]*\}from"\.\.\/assets\/stackStore-[^"]+"/g

if (!importRegex.test(content)) {
  console.log('[build-content] No import to replace, content.js already clean')
  process.exit(0)
}

// Reset regex lastIndex
importRegex.lastIndex = 0

// 提取 named imports（实际使用的是 r, t, h, C, S 这几个）
const namedImports = content.match(/import\{([^}]*)\}/)
const importNames = namedImports ? namedImports[1].split(',').map(s => s.trim()) : []

// 构建 IIFE：把 chunk 代码包起来，并模拟 exports
const exportsProxy = `
var __esModule = ${chunk.includes('__esModule') ? 'true' : 'false'};
`
  + chunk
  + `\nvar import_stackStore = {`
  + importNames.map(name => `"${name.trim()}": ${name.trim()}`).join(', ')
  + `};\n`

const newContent = content.replace(importRegex, exportsProxy)

// 清理残留的 export 语句（如果有）
const cleaned = newContent
  .replace(/^export\{[^}]*\};/gm, '')
  .replace(/^export\s+/gm, '// export ')
  .trimStart()

fs.writeFileSync(out, cleaned)

const stat = fs.statSync(out)
console.log(`[build-content] content.js rebuilt as IIFE (${stat.size} bytes)`)
