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

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Background received command:', command);

  // 获取当前活动标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // 向 content script 发送消息执行对应操作
  // 将横杠替换成下划线以匹配 content script 的消息类型
  chrome.tabs.sendMessage(tab.id, { type: command.toUpperCase().replace(/-/g, '_') });
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

    case 'CLOSE_TAB':
      // 关闭发送消息的标签页
      if (sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id);
      }
      return false;

    default:
      return false;
  }
});

export {};
