/**
 * Content Script 主应用组件
 * 包含 FloatWidget 和 PeekView
 */

import { useEffect, useState } from 'react';
import FloatWidget from './components/FloatWidget';
import PeekView from './components/PeekView';
import PushForm from './components/PushForm';
import { useStackStore } from '../store/stackStore';

export default function ContentApp() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPushForm, setShowPushForm] = useState(false);

  // 从 zustand store 获取数据
  const items = useStackStore((state) => state.items);
  const load = useStackStore((state) => state.load);

  // 初始化加载数据
  useEffect(() => {
    load();
  }, [load]);

  // 监听 storage 变化，同步更新
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
  }, [load]);

  const stackDepth = items.length;

  return (
    <>
      {/* 浮窗小部件 */}
      <FloatWidget
        count={stackDepth}
        isEmpty={stackDepth === 0}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {/* PeekView 面板 */}
      <PeekView
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onPush={() => {
          setShowPushForm(true);
          setIsExpanded(false);
        }}
      />

      {/* PushForm 压栈表单 */}
      <PushForm
        isOpen={showPushForm}
        onClose={() => setShowPushForm(false)}
        onSuccess={() => {
          setShowPushForm(false);
          setIsExpanded(true);
        }}
      />
    </>
  );
}
