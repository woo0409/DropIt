/**
 * PeekView 栈列表组件
 * 显示栈中所有项目，支持弹栈、删除、压栈操作
 */

import { useStackStore } from '../../store/stackStore';
import { StackItem, StackItemType, Priority } from '../../types';

interface PeekViewProps {
  isOpen: boolean;
  onClose: () => void;
  onPush: () => void;
}

// 类型图标映射
const TYPE_ICONS: Record<StackItemType, string> = {
  task: '📌',
  read: '📖',
};

// 类型标签映射
const TYPE_LABELS: Record<StackItemType, string> = {
  task: '任务',
  read: '阅读',
};

// 优先级颜色映射
const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; emoji: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700', emoji: '🔴' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', emoji: '🟡' },
  low: { bg: 'bg-green-100', text: 'text-green-700', emoji: '🟢' },
};

// 优先级标签映射
const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// 格式化挂起时长
function formatDuration(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
}

export default function PeekView({ isOpen, onClose, onPush }: PeekViewProps) {
  const items = useStackStore((state) => state.items);
  const pop = useStackStore((state) => state.pop);
  const remove = useStackStore((state) => state.remove);

  // 倒序展示（栈顶在前）
  const reversedItems = [...items].reverse();

  // 弹栈操作：弹出栈顶，如果有 URL 则在新标签页打开
  const handlePop = async () => {
    if (items.length === 0) return;
    const popped = await pop();
    if (popped) {
      console.log('已弹栈:', popped.title);
      if (popped.url) {
        window.open(popped.url, '_blank');
      }
    }
  };

  // 删除操作
  const handleRemove = async (id: string) => {
    await remove(id);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] dropit-fade-in"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/20" />

      {/* 面板容器 */}
      <div
        className="absolute bottom-20 right-4 w-80 max-h-[60vh] bg-white rounded-xl shadow-2xl overflow-hidden dropit-slide-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">DropIt 栈</h2>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm">{items.length} 项</span>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto dropit-scrollbar p-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">栈是空的</p>
              <p className="text-xs mt-1">点击下方按钮添加第一项</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reversedItems.map((item) => (
                <StackItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemove(item.id)}
                />
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
            title="弹出栈顶项目"
          >
            弹栈
          </button>
          <button
            onClick={onPush}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors text-sm"
            title="添加新项目到栈顶"
          >
            + 压栈
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 单个栈项卡片
 */
interface StackItemCardProps {
  item: StackItem;
  onRemove: () => void;
}

function StackItemCard({ item, onRemove }: StackItemCardProps) {
  const priorityStyle = PRIORITY_COLORS[item.priority];

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all relative">
      {/* 删除按钮 */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
        title="删除"
      >
        ✕
      </button>

      {/* 类型图标和标题 */}
      <div className="flex items-start gap-2 pr-6">
        <span className="text-xl" role="img" aria-label={TYPE_LABELS[item.type]}>
          {TYPE_ICONS[item.type]}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 text-sm truncate" title={item.title}>
            {item.title}
          </h3>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline truncate block mt-1"
              title={item.url}
              onClick={(e) => e.stopPropagation()}
            >
              {item.url}
            </a>
          )}
          {item.note && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={item.note}>
              {item.note}
            </p>
          )}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            {priorityStyle.emoji} {PRIORITY_LABELS[item.priority]}
          </span>
          <span className="text-xs text-gray-400">{formatDuration(item.pushedAt)}</span>
        </div>
        <span className="text-xs text-gray-400">{item.source}</span>
      </div>
    </div>
  );
}
