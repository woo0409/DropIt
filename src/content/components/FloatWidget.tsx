/**
 * FloatWidget 浮窗组件
 * 右下角常驻小浮窗，显示稍后阅读数量
 * 支持拖拽移动位置，支持最小化模式
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface FloatWidgetProps {
  count: number;
  isEmpty: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onPositionChange: (position: { right: number; bottom: number }) => void;
}

const STORAGE_KEY = 'dropit_widget_minimized';

export default function FloatWidget({ count, isEmpty, isExpanded, onToggle, onPositionChange }: FloatWidgetProps) {
  const [position, setPosition] = useState({ right: 20, bottom: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载最小化状态
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY] !== undefined) {
        setIsMinimized(result[STORAGE_KEY]);
      }
    });
  }, []);

  // 保存最小化状态
  const saveMinimizedState = (minimized: boolean) => {
    chrome.storage.local.set({ [STORAGE_KEY]: minimized });
  };

  const getStyle = (): React.CSSProperties => ({
    position: 'fixed',
    right: `${position.right}px`,
    bottom: `${position.bottom}px`,
    zIndex: 9999,
    userSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'all 0.2s ease',
  });

  const getWidgetStyle = (): React.CSSProperties => ({
    width: isMinimized ? '16px' : 'auto',
    height: isMinimized ? '16px' : 'auto',
    opacity: isMinimized ? 0.5 : 1,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    didDrag.current = false;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    widgetStartPos.current = { x: position.right, y: position.bottom };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = dragStartPos.current.x - e.clientX;
    const deltaY = dragStartPos.current.y - e.clientY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      didDrag.current = true;
    }

    const newRight = Math.max(0, Math.min(window.innerWidth - 60, widgetStartPos.current.x + deltaX));
    const newBottom = Math.max(0, Math.min(window.innerHeight - 60, widgetStartPos.current.y + deltaY));

    const newPosition = { right: newRight, bottom: newBottom };
    setPosition(newPosition);
    onPositionChange(newPosition);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // 清理 clickTimer 防止内存泄漏
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const getColorClass = () => {
    if (isEmpty) return 'bg-gray-400 hover:bg-gray-500';
    if (isExpanded) return 'bg-purple-700 hover:bg-purple-800';
    return 'bg-violet-500 hover:bg-violet-600';
  };

  // 处理点击：区分单击和双击
  const handleClick = () => {
    if (didDrag.current) return;

    // 如果已有定时器，说明这是第二次点击（双击）
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      // 双击：切换最小化状态
      const newMinimized = !isMinimized;
      setIsMinimized(newMinimized);
      saveMinimizedState(newMinimized);
    } else {
      // 第一次点击：延迟 200ms 执行单击操作
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        // 单击：非最小化状态时触发展开/收起
        if (!isMinimized) {
          onToggle();
        }
      }, 200);
    }
  };

  // 悬停恢复大小
  const handleMouseEnter = () => {
    if (isMinimized) {
      setIsMinimized(false);
      saveMinimizedState(false);
    }
  };

  return (
    <div
      className={`dropit-float-widget ${getColorClass()} text-white font-semibold rounded-full shadow-lg flex items-center justify-center dropit-fade-in`}
      style={{ ...getStyle(), ...getWidgetStyle() }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      title={isMinimized ? '双击展开' : isEmpty ? '稍后阅读' : `${count} 篇稍后阅读，双击最小化`}
    >
      {!isMinimized && (
        <div className="px-3 py-2 text-sm min-w-[32px] text-center">
          {isEmpty ? '📖' : `[${count}]`}
        </div>
      )}
    </div>
  );
}
