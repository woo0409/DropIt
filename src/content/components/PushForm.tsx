/**
 * PushForm 压栈表单组件
 * 用于添加新项目到栈中
 */

import { useState, useEffect } from 'react';
import { useStackStore } from '../../store/stackStore';
import { StackItemType, Priority } from '../../types';

interface PushFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  title: string;
  url: string;
  note: string;
  type: StackItemType;
  priority: Priority;
};

export default function PushForm({ isOpen, onClose, onSuccess }: PushFormProps) {
  const push = useStackStore((state) => state.push);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    url: '',
    note: '',
    type: 'task',
    priority: 'medium',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 自动填充当前页面信息
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: document.title,
        url: window.location.href,
        note: '',
        type: 'task',
        priority: 'medium',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('请输入标题');
      return;
    }

    setIsSubmitting(true);
    try {
      await push({
        title: formData.title.trim(),
        url: formData.url.trim() || undefined,
        note: formData.note.trim() || undefined,
        type: formData.type,
        priority: formData.priority,
        source: new URL(window.location.href).hostname,
      });
      onSuccess();
    } catch (error) {
      console.error('压栈失败:', error);
      alert('压栈失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: StackItemType) => {
    setFormData({ ...formData, type });
  };

  const handlePriorityChange = (priority: Priority) => {
    setFormData({ ...formData, priority });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] dropit-fade-in"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 表单容器 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden dropit-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">压栈</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
            title="关闭"
          >
            ✕
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入标题..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              autoFocus
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL（可选）
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注（可选）
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="添加备注..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
            />
          </div>

          {/* 类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'task', label: '📌 任务', desc: '待办事项' },
                  { value: 'read', label: '📖 阅读', desc: '稍后阅读' },
                ] as const
              ).map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-70">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 优先级选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              优先级
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'high', label: '🔴 高', color: 'bg-red-50 border-red-200 hover:border-red-300 text-red-700' },
                  { value: 'medium', label: '🟡 中', color: 'bg-amber-50 border-amber-200 hover:border-amber-300 text-amber-700' },
                  { value: 'low', label: '🟢 低', color: 'bg-green-50 border-green-200 hover:border-green-300 text-green-700' },
                ] as const
              ).map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePriorityChange(value)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.priority === value
                      ? color.replace('hover:border-', 'border-').replace('50', '500')
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              {isSubmitting ? '添加中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
