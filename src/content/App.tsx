/**
 * Content Script 主应用组件
 * 浮窗 + PeekView，一键 Push（无需表单）
 */

import { useEffect, useState } from 'react';
import FloatWidget from './components/FloatWidget';
import PeekView from './components/PeekView';
import { useStackStore } from '../store/stackStore';

export default function ContentApp() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ right: 20, bottom: 20 });

  const items = useStackStore((state) => state.items);
  const load = useStackStore((state) => state.load);
  const push = useStackStore((state) => state.push);
  const pop = useStackStore((state) => state.pop);

  // 初始化加载
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  // 监听 storage 变化
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.dropit_items || changes.dropit_settings) {
        load();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听来自 background 的快捷键命令
  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      switch (message.type) {
        case 'PUSH_PAGE':
          handleQuickPush();
          break;
        case 'POP_PAGE':
          handlePop();
          break;
        case 'TOGGLE_PEEK':
          setIsExpanded((prev) => !prev);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 一键 Push：自动保存当前页面
  const handleQuickPush = async () => {
    try {
      // 获取最新状态
      const currentItems = useStackStore.getState().items;
      const currentSettings = useStackStore.getState().settings;

      // 检查栈是否已满
      if (currentItems.length >= currentSettings.maxDepth) {
        alert(`列表已满（${currentSettings.maxDepth}/${currentSettings.maxDepth}），请先清理`);
        return;
      }

      await push({
        title: document.title,
        url: window.location.href,
        source: new URL(window.location.href).hostname,
      });

      // 保存成功，检查是否需要关闭标签页
      if (currentSettings.closeAfterPush) {
        chrome.runtime.sendMessage({ type: 'CLOSE_TAB' });
      }
    } catch (error) {
      console.error('保存失败:', error);
      const msg = error instanceof Error && error.message.includes('扩展已更新')
        ? '扩展已更新，请刷新当前页面后重试'
        : error instanceof Error && error.message.includes('该链接已存在')
        ? '该链接已存在于稍后阅读列表中'
        : '保存失败，请重试';
      alert(msg);
    }
  };

  // Pop 操作：弹出栈顶并打开
  const handlePop = async () => {
    // 从 store 获取最新状态，避免闭包捕获过期值
    const currentItems = useStackStore.getState().items;
    if (currentItems.length === 0) {
      alert('列表是空的，没有可读取的页面');
      return;
    }
    const popped = await pop();
    if (popped) {
      window.open(popped.url, '_blank');
    }
  };

  return (
    <>
      <FloatWidget
        count={items.length}
        isEmpty={items.length === 0}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onPositionChange={setWidgetPosition}
      />

      <PeekView
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onQuickPush={() => {
          handleQuickPush();
        }}
        widgetPosition={widgetPosition}
      />
    </>
  );
}
