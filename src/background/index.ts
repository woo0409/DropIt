/**
 * Background Service Worker
 *
 * 职责：
 * - 监听扩展安装/更新事件
 * - 处理快捷键命令
 * - 维护跨标签页状态同步
 * - 处理通知和提醒
 */

console.log('DropIt Background Service Worker initialized');

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('DropIt installed for the first time');
    // 可以在这里初始化默认设置
  } else if (details.reason === 'update') {
    console.log('DropIt updated to version:', chrome.runtime.getManifest().version);
  }
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // 处理不同类型的消息
  switch (message.type) {
    case 'GET_TAB_INFO':
      // 返回当前标签页信息
      if (sender.tab) {
        sendResponse({
          title: sender.tab.title,
          url: sender.tab.url,
          id: sender.tab.id,
        });
      }
      return true;

    default:
      return false;
  }
});

export {};
