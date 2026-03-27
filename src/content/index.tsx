/**
 * Content Script 入口文件
 * 使用 Shadow DOM + React 渲染浮窗 UI
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ContentApp from './App';
// @ts-ignore - Vite 动态导入
import contentCss from './content.css?inline';

// Shadow Host ID
const SHADOW_HOST_ID = 'dropit-shadow-host';

/**
 * 创建 Shadow DOM 容器
 */
function createShadowHost(): ShadowRoot {
  // 检查是否已存在
  let host = document.getElementById(SHADOW_HOST_ID) as HTMLDivElement;
  if (!host) {
    host = document.createElement('div');
    host.id = SHADOW_HOST_ID;
    host.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483647;
      pointer-events: none;
    `;
    document.body.appendChild(host);
  }

  // 创建或获取 Shadow Root
  let shadowRoot = host.shadowRoot;
  if (!shadowRoot) {
    shadowRoot = host.attachShadow({ mode: 'open' });
  }

  return shadowRoot;
}

/**
 * 注入样式到 Shadow DOM
 */
function injectStyles(shadowRoot: ShadowRoot): void {
  // 检查是否已存在样式标签
  if (shadowRoot.getElementById('dropit-content-styles')) {
    return;
  }

  // 直接注入内联样式
  const style = document.createElement('style');
  style.id = 'dropit-content-styles';
  style.textContent = contentCss || '';
  shadowRoot.appendChild(style);
}

/**
 * 创建 React 根容器并渲染 App
 */
function mountApp(shadowRoot: ShadowRoot): void {
  // 创建或获取容器
  let container = shadowRoot.getElementById('dropit-root') as HTMLDivElement;
  if (!container) {
    container = document.createElement('div');
    container.id = 'dropit-root';
    container.style.cssText = 'pointer-events: auto;';
    shadowRoot.appendChild(container);
  }

  // 创建 React Root
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ContentApp />
    </React.StrictMode>
  );
}

/**
 * 初始化 Content Script
 */
function init() {
  // 等待 body 存在
  if (!document.body) {
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect();
        init();
      }
    });
    observer.observe(document.documentElement, { childList: true });
    return;
  }

  const shadowRoot = createShadowHost();
  injectStyles(shadowRoot);
  mountApp(shadowRoot);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 监听来自 background 和 popup 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('DropIt Content script received message:', message);

  switch (message.type) {
    case 'GET_PAGE_INFO':
      sendResponse({
        title: document.title,
        url: window.location.href,
      });
      return true;

    case 'SHOW_NOTIFICATION':
      // TODO: 显示页面内通知
      console.log('Notification:', message.payload);
      sendResponse({ success: true });
      return true;

    default:
      return false;
  }
});

export {};
