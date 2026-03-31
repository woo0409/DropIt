/**
 * PeekView 栈列表组件
 * 显示稍后阅读列表，支持弹栈、删除、拖拽排序
 */

import { useState, useEffect, useRef } from 'react';
import { useStackStore } from '../../store/stackStore';
import { StackItem } from '../../types';
import Sortable from 'sortablejs';

interface PeekViewProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickPush: () => void;
  widgetPosition: { right: number; bottom: number };
}

// 删除确认状态
interface DeleteConfirmState {
  itemId: string | null;
  timestamp: number;
}

// 格式化挂起时长
function formatDuration(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

export default function PeekView({ isOpen, onClose, onQuickPush, widgetPosition }: PeekViewProps) {
  const items = useStackStore((state) => state.items);
  const pop = useStackStore((state) => state.pop);
  const remove = useStackStore((state) => state.remove);
  const reorder = useStackStore((state) => state.reorder);

  // 删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    itemId: null,
    timestamp: 0,
  });

  // 列表容器 ref（用于 SortableJS）
  const listRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  // 检查确认是否超时（2秒）
  useEffect(() => {
    if (deleteConfirm.itemId) {
      const timer = setTimeout(() => {
        setDeleteConfirm({ itemId: null, timestamp: 0 });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirm.itemId]);

  // 初始化 SortableJS 拖拽排序
  useEffect(() => {
    if (!isOpen || !listRef.current) return;

    // 清理之前的实例
    if (sortableRef.current) {
      sortableRef.current.destroy();
      sortableRef.current = null;
    }

    // 创建 Sortable 实例
    sortableRef.current = Sortable.create(listRef.current, {
      animation: 150,
      handle: '.dropit-drag-handle',
      ghostClass: 'dropit-sortable-ghost',
      onEnd: async () => {
        // 获取新的顺序
        const newOrderedIds: string[] = [];
        const itemElements = listRef.current?.children;
        if (itemElements) {
          for (const el of Array.from(itemElements)) {
            const itemId = el.getAttribute('data-item-id');
            if (itemId) newOrderedIds.push(itemId);
          }
        }

        // 调用 store 的 reorder 方法
        if (newOrderedIds.length > 0) {
          await reorder(newOrderedIds);
        }
      },
    });

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, [isOpen, items, reorder]);

  // 倒序展示（最新在前）
  const reversedItems = [...items].reverse();

  // 计算弹窗位置：在浮窗上方，如果超出视口则显示在下方
  const POPUP_MAX_HEIGHT = window.innerHeight * 0.6; // max-h-[60vh]
  const WIDGET_SIZE = 50; // 浮窗大约高度
  const SPACING = 12; // 间距

  const getPopupStyle = (): React.CSSProperties => {
    const right = widgetPosition.right;
    const bottom = widgetPosition.bottom;

    // 尝试放在浮窗上方
    const bottomIfAbove = bottom + WIDGET_SIZE + SPACING;
    const topIfAbove = window.innerHeight - bottomIfAbove - POPUP_MAX_HEIGHT;

    if (topIfAbove < 10) {
      // 上方空间不足，放在浮窗下方
      return {
        right: `${right}px`,
        bottom: `${window.innerHeight - bottom + SPACING}px`,
      };
    }

    // 正常放在浮窗上方
    return {
      right: `${right}px`,
      bottom: `${bottomIfAbove}px`,
    };
  };

  // 弹栈操作
  const handlePop = async () => {
    if (items.length === 0) return;
    const popped = await pop();
    if (popped) {
      window.open(popped.url, '_blank');
    }
  };

  // 点击某条直接打开并移除
  const handleOpen = async (item: StackItem) => {
    await remove(item.id);
    window.open(item.url, '_blank');
  };

  // 处理删除按钮点击（二次确认）
  const handleDeleteClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();

    if (deleteConfirm.itemId === itemId) {
      // 确认删除
      remove(itemId);
      setDeleteConfirm({ itemId: null, timestamp: 0 });
    } else {
      // 第一次点击，显示确认
      setDeleteConfirm({ itemId, timestamp: Date.now() });
    }
  };

  // 检查某个项目是否处于确认状态
  const isConfirming = (itemId: string) => deleteConfirm.itemId === itemId;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] dropit-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />

      <div
        className="absolute w-80 max-h-[60vh] bg-white rounded-xl shadow-2xl overflow-hidden dropit-slide-in flex flex-col"
        style={getPopupStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="text-white font-semibold text-lg">📖 稍后阅读</h2>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm">{items.length} 篇</span>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto dropit-scrollbar p-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">列表是空的</p>
              <p className="text-xs mt-1">点击下方按钮保存当前页面</p>
            </div>
          ) : (
            <div ref={listRef} className="space-y-2">
              {reversedItems.map((item, index) => {
                const isTop = index === 0; // 栈顶标识
                return (
                  <div
                    key={item.id}
                    data-item-id={item.id}
                    className={`group bg-white border rounded-xl p-3 hover:scale-[1.01] hover:shadow-md transition-all cursor-pointer relative ${
                      isTop
                        ? 'border-blue-200 bg-blue-50 border-l-4 border-l-blue-500'
                        : 'border-gray-100 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => handleOpen(item)}
                  >
                    {/* 拖拽手柄 */}
                    <div className="dropit-drag-handle absolute left-1 top-1/2 -translate-y-1/2 w-5 h-8 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing transition-all">
                      <span className="text-sm leading-none">⋮⋮</span>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDeleteClick(e, item.id)}
                      className={`absolute top-2 right-2 transition-opacity p-1 text-xs ${
                        isConfirming(item.id)
                          ? 'text-red-600 hover:text-red-700 bg-red-50 rounded opacity-100'
                          : 'text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100'
                      }`}
                      title={isConfirming(item.id) ? '确认删除？' : '删除'}
                    >
                      {isConfirming(item.id) ? '确认？' : '✕'}
                    </button>

                    {/* 内容区域 - 为拖拽手柄留出空间 */}
                    <div className="pl-5 pr-6">
                      {/* 标题 */}
                      <h3 className="font-medium text-gray-800 text-sm leading-snug line-clamp-2" title={item.title}>
                        {isTop && <span className="mr-1">📍</span>}
                        {item.title}
                      </h3>

                      {/* 来源 + 时间 */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">{item.source}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{formatDuration(item.pushedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2 rounded-b-xl">
          <button
            onClick={handlePop}
            disabled={items.length === 0}
            className="flex-1 px-4 py-2 bg-stone-600 hover:bg-stone-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all hover:shadow-md active:scale-95 text-sm"
            title="打开最近保存的页面"
          >
            📤 读取
          </button>
          <button
            onClick={onQuickPush}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-medium transition-all hover:shadow-md active:scale-95 text-sm"
            title="保存当前页面"
          >
            📥 保存
          </button>
        </div>
      </div>
    </div>
  );
}
