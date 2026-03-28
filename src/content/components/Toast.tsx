/**
 * Toast 通知组件
 * 用于操作反馈，替代 alert
 */

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  position: { right: number; bottom: number };
}

export default function Toast({ message, type, visible, position }: ToastProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // 等待退出动画完成后再移除
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  const getToastStyle = (): React.CSSProperties => ({
    position: 'fixed',
    right: `${position.right}px`,
    bottom: `${position.bottom + 60}px`, // 在浮窗上方
    zIndex: 10000,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  });

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-rose-600 text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-none ${getTypeStyles()}`}
      style={getToastStyle()}
    >
      <span>{getIcon()}</span>
      <span>{message}</span>
    </div>
  );
}

// Toast Hook 用于管理 toast 状态
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false,
  });

  let timer: ReturnType<typeof setTimeout> | null = null;

  const showToast = (message: string, type: ToastType = 'success', duration = 2500) => {
    // 清除之前的定时器
    if (timer) {
      clearTimeout(timer);
    }

    setToast({ message, type, visible: true });

    timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

  return { toast, showToast };
}
