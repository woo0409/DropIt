/**
 * PeekView 栈列表组件
 * 显示稍后阅读列表，支持弹栈、删除
 */

import { useStackStore } from '../../store/stackStore';
import { StackItem } from '../../types';

interface PeekViewProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickPush: () => void;
  widgetPosition: { right: number; bottom: number };
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
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 flex items-center justify-between">
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
            <div className="space-y-1.5">
              {reversedItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white border border-gray-100 rounded-lg p-3 hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer relative"
                  onClick={() => handleOpen(item)}
                >
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(item.id);
                    }}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="删除"
                  >
                    ✕
                  </button>

                  {/* 标题 */}
                  <h3 className="font-medium text-gray-800 text-sm pr-6 leading-snug line-clamp-2" title={item.title}>
                    {item.title}
                  </h3>

                  {/* 来源 + 时间 */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-400">{item.source}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatDuration(item.pushedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2">
          <button
            onClick={handlePop}
            disabled={items.length === 0}
            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            title="打开最近保存的页面"
          >
            📤 读取
          </button>
          <button
            onClick={onQuickPush}
            className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors text-sm"
            title="保存当前页面"
          >
            📥 保存
          </button>
        </div>
      </div>
    </div>
  );
}
