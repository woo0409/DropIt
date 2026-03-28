/**
 * Content Script 主应用组件
 * 浮窗 + PeekView，一键 Push（无需表单）
 */

import { useEffect, useState } from 'react';
import FloatWidget from './components/FloatWidget';
import PeekView from './components/PeekView';
import Toast, { useToast } from './components/Toast';
import { useStackStore } from '../store/stackStore';

const ONBOARDED_KEY = 'dropit_onboarded';

export default function ContentApp() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ right: 20, bottom: 20 });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast, showToast } = useToast();

  const items = useStackStore((state) => state.items);
  const load = useStackStore((state) => state.load);
  const push = useStackStore((state) => state.push);
  const pop = useStackStore((state) => state.pop);

  // 初始化加载 + 检查首次安装引导
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();

    // 检查是否已完成引导
    chrome.storage.local.get([ONBOARDED_KEY], (result) => {
      if (!result[ONBOARDED_KEY]) {
        setShowOnboarding(true);
      }
    });
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
        showToast(`列表已满（${currentSettings.maxDepth}），请先清理`, 'warning');
        return;
      }

      await push({
        title: document.title,
        url: window.location.href,
        source: new URL(window.location.href).hostname,
      });

      // 保存成功
      showToast('保存成功！', 'success');

      // 隐藏引导
      if (showOnboarding) {
        setShowOnboarding(false);
        chrome.storage.local.set({ [ONBOARDED_KEY]: true });
      }

      // 检查是否需要关闭标签页
      if (currentSettings.closeAfterPush) {
        chrome.runtime.sendMessage({ type: 'CLOSE_TAB' });
      }
    } catch (error) {
      console.error('保存失败:', error);
      const msg = error instanceof Error && error.message.includes('扩展已更新')
        ? '扩展已更新，请刷新页面后重试'
        : error instanceof Error && error.message.includes('该链接已存在')
        ? '该链接已存在于列表中'
        : '保存失败，请重试';
      const type = error instanceof Error && error.message.includes('已存在') ? 'warning' : 'error';
      showToast(msg, type);
    }
  };

  // Pop 操作：弹出栈顶并打开
  const handlePop = async () => {
    // 从 store 获取最新状态，避免闭包捕获过期值
    const currentItems = useStackStore.getState().items;
    if (currentItems.length === 0) {
      showToast('列表是空的', 'warning');
      return;
    }
    const popped = await pop();
    if (popped) {
      window.open(popped.url, '_blank');
    }
  };

  // 双击最小化时隐藏引导
  const handleDoubleClickMinimize = () => {
    if (showOnboarding) {
      setShowOnboarding(false);
      chrome.storage.local.set({ [ONBOARDED_KEY]: true });
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
        onDoubleClickMinimize={handleDoubleClickMinimize}
      />

      {/* 首次安装引导 Tooltip */}
      {showOnboarding && !isExpanded && (
        <div
          className="fixed z-[10000] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm whitespace-nowrap dropit-onboarding-tooltip"
          style={{
            right: `${widgetPosition.right}px`,
            bottom: `${widgetPosition.bottom + 55}px`,
          }}
        >
          点击保存当前页面，双击最小化
          {/* 小箭头 */}
          <div
            className="absolute w-2 h-2 bg-gray-900 rotate-45"
            style={{
              right: '20px',
              bottom: '-4px',
            }}
          />
        </div>
      )}

      <PeekView
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onQuickPush={() => {
          handleQuickPush();
        }}
        widgetPosition={widgetPosition}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        position={widgetPosition}
      />
    </>
  );
}
