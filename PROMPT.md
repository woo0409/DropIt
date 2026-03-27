你好！我们要开发一个叫 DropIt 的 Chrome 浏览器扩展，基于栈的任务管理工具。

核心概念：用户被打断时一键 push 当前任务/页面到栈中，闲下来 pop 恢复，同时支持稍后阅读。

技术栈：React 18 + TypeScript + Vite + Tailwind CSS + zustand + chrome.storage + Shadow DOM + Manifest V3

请完成 Phase 1 的全部工作：

1. 项目初始化：用 Vite 创建 React + TS 项目，安装 Tailwind CSS、zustand
2. 创建 Chrome Manifest V3 配置（manifest.json）
3. 创建 TypeScript 类型定义（src/types/index.ts）：
   - StackItem: id(string), type('task'|'read'), title(string), url?(string), note?(string), priority('high'|'medium'|'low'), pushedAt(number), source(string)
   - StackData: items(StackItem[]), settings({ maxDepth: number, reminderThresholds: number[] })
4. 创建 chrome.storage 封装（src/utils/storage.ts）：push, pop, peek, remove, getSettings, updateSettings
5. 创建 uuid 工具（src/utils/id.ts）
6. 创建 zustand store（src/store/stackStore.ts）：封装所有栈操作，从 storage 读写
7. 创建占位文件：src/background/index.ts, src/content/index.ts

重要要求：
- manifest.json 用 Manifest V3，content_scripts 和 background(service_worker) 都配置好
- Tailwind CSS 用当前推荐方式配置
- storage 层同时支持 sync 和 local
- 类型定义要严谨，全部导出
- zustand store 持久化连接到 chrome.storage
- 完成后自行验证 npm run build 能成功编译

完成后运行：openclaw system event --text "Done: DropIt Phase 1 基础框架搭建完成" --mode now
