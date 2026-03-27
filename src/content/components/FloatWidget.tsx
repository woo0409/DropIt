/**
 * FloatWidget 浮窗组件
 * 右下角常驻小浮窗，显示栈深度
 * 支持拖拽移动位置
 */

import { useState, useRef, useEffect } from 'react';

interface FloatWidgetProps {
  count: number;
  isEmpty: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

// 默认位置（右下角）
const DEFAULT_POSITION = {
  right: 20,
  bottom: 20,
};

export default function FloatWidget({ count, isEmpty, isExpanded, onToggle }: FloatWidgetProps) {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ x: 0, y: 0 });

  // 计算显示样式
  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      position: 'fixed',
      right: `${position.right}px`,
      bottom: `${position.bottom}px`,
      zIndex: 9999,
      userSelect: 'none',
      cursor: isDragging ? 'grabbing' : 'grab',
    };

    if (isDragging) {
      style.transition = 'none';
    } else {
      style.transition = 'all 0.2s ease';
    }

    return style;
  };

  // 鼠标按下开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键

    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    widgetStartPos.current = { x: position.right, y: position.bottom };

    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 鼠标移动
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = dragStartPos.current.x - e.clientX;
    const deltaY = e.clientY - dragStartPos.current.y;

    const newRight = Math.max(0, Math.min(window.innerWidth - 60, widgetStartPos.current.x + deltaX));
    const newBottom = Math.max(0, Math.min(window.innerHeight - 60, widgetStartPos.current.y + deltaY));

    setPosition({ right: newRight, bottom: newBottom });
  };

  // 鼠标释放
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 根据状态确定颜色
  const getColorClass = () => {
    if (isEmpty) {
      return 'bg-gray-500 hover:bg-gray-600';
    }
    // 展开时显示不同的色调
    if (isExpanded) {
      return 'bg-teal-600 hover:bg-teal-700';
    }
    return 'bg-emerald-500 hover:bg-emerald-600';
  };

  // 点击切换展开状态（排除拖拽操作）
  const handleClick = () => {
    // 如果刚刚在拖拽，不触发点击
    if (isDragging) return;
    onToggle();
  };

  return (
    <div
      className={`dropit-float-widget ${getColorClass()} text-white font-semibold rounded-full shadow-lg flex items-center justify-center dropit-fade-in`}
      style={getStyle()}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title={isEmpty ? '栈为空' : `栈深度: ${count}`}
    >
      <div className="px-3 py-2 text-sm min-w-[32px] text-center">
        [{count}]
      </div>
    </div>
  );
}
