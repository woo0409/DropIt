# DropIt 📖

> 极简栈式稍后阅读 — 看到好文章，一键扔进来，闲下来慢慢读。

## 这是什么

DropIt 是一个 Chrome 浏览器扩展，只解决一件事：**一键保存，按顺序读**。

不做 GTD、不做看板、不做 Pocket。像一摞杂志，先存的先读。

## 功能

- **一键保存** — 点击浮窗或 `Alt+P`，自动保存当前页面
- **按序读取** — `Alt+O` 弹出最近保存的页面，打开并移除
- **查看列表** — `Alt+L` 展开所有保存的页面
- **拖拽浮窗** — 拖到屏幕任意位置
- **双击最小化** — 缩成小圆点，悬停恢复
- **自动关闭** — 保存后自动关闭当前标签页
- **跨设备同步** — 数据通过 chrome.storage.sync 同步

## 安装

1. 下载 [最新 Release](../../releases) 或 clone 本仓库
2. 运行 `npm install && npm run build`
3. 打开 `chrome://extensions`，开启开发者模式
4. 点击「加载已解压的扩展程序」，选择 `dist/` 目录

## 使用

| 操作 | 方式 |
|------|------|
| 保存当前页面 | 点击浮窗「📥 保存」或 `Alt+P` |
| 读取最近一条 | 点击「📤 读取」或 `Alt+O` |
| 打开/关闭列表 | 点击浮窗或 `Alt+L` |
| 删除某条 | 悬停出现 ✕，点击确认 |
| 最小化浮窗 | 双击浮窗 |
| 移动浮窗 | 拖拽 |

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- zustand
- chrome.storage API
- Manifest V3

## 开发

```bash
npm install
npm run build    # 构建 dist/
npm run dev      # 开发模式（需配合 Chrome 扩展加载）
```

## License

MIT
