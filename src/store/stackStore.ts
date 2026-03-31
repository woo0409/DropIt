import { create } from 'zustand';
import { StackItem, Settings, DEFAULT_SETTINGS } from '../types';
import { storage, StorageArea } from '../utils/storage';
import { generateId } from '../utils/id';

/**
 * 栈 Store 状态
 */
interface StackState {
  /** 栈中的所有项 */
  items: StackItem[];
  /** 用户设置 */
  settings: Settings;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 栈 Store 操作
 */
interface StackActions {
  /** 从存储加载数据 */
  load: (area?: StorageArea) => Promise<void>;
  /** Push 操作 — 一键保存当前页面 */
  push: (item: { title: string; url: string; source: string }, area?: StorageArea) => Promise<StackItem>;
  /** Pop 操作 — 弹出栈顶并在新标签页打开 */
  pop: (area?: StorageArea) => Promise<StackItem | null>;
  /** 移除指定项 */
  remove: (id: string, area?: StorageArea) => Promise<boolean>;
  /** 清空栈 */
  clear: (area?: StorageArea) => Promise<void>;
  /** 更新设置 */
  updateSettings: (settings: Partial<Settings>, area?: StorageArea) => Promise<void>;
  /** 重排顺序 — 根据新的 ID 顺序重排 items */
  reorder: (newOrderedIds: string[], area?: StorageArea) => Promise<void>;
  /** 重置错误 */
  clearError: () => void;
}

type StackStore = StackState & StackActions;

export const useStackStore = create<StackStore>((set) => ({
  items: [],
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  load: async (area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      const [items, settings] = await Promise.all([
        storage.getItems(area),
        storage.getSettings(area),
      ]);
      set({ items, settings, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '加载失败',
        isLoading: false,
      });
    }
  },

  push: async (itemData, area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      const item: StackItem = {
        ...itemData,
        id: generateId(),
        pushedAt: Date.now(),
      };
      const items = await storage.push(item, area);
      set({ items, isLoading: false });
      return item;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Push 失败',
        isLoading: false,
      });
      throw err;
    }
  },

  pop: async (area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      const popped = await storage.pop(area);
      const items = await storage.getItems(area);
      set({ items, isLoading: false });
      return popped;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Pop 失败',
        isLoading: false,
      });
      return null;
    }
  },

  remove: async (id, area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      const success = await storage.remove(id, area);
      if (success) {
        const items = await storage.getItems(area);
        set({ items, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return success;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Remove 失败',
        isLoading: false,
      });
      return false;
    }
  },

  clear: async (area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      await storage.clearItems(area);
      set({ items: [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '清空失败',
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reorder: async (newOrderedIds, area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      // 保存自定义顺序到存储
      await storage.saveCustomOrder(newOrderedIds, area);

      // 根据 newOrderedIds 重排 items 数组
      const currentItems = useStackStore.getState().items;

      // 按新顺序排列，同时保留不在新顺序中的项（新项）放在最前面
      const reorderedItems: StackItem[] = [];
      const newItems: StackItem[] = [];
      const orderIdSet = new Set(newOrderedIds);

      for (const item of currentItems) {
        if (orderIdSet.has(item.id)) {
          reorderedItems.push(item);
        } else {
          newItems.push(item);
        }
      }

      // 按 newOrderedIds 的顺序排序
      reorderedItems.sort((a, b) => {
        const indexA = newOrderedIds.indexOf(a.id);
        const indexB = newOrderedIds.indexOf(b.id);
        return indexA - indexB;
      });

      // 新项 + 按顺序排列的项
      const finalItems = [...newItems, ...reorderedItems];

      set({ items: finalItems, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '重排失败',
        isLoading: false,
      });
    }
  },

  updateSettings: async (newSettings, area = 'sync') => {
    set({ isLoading: true, error: null });
    try {
      const updated = await storage.updateSettings(newSettings, area);
      set({ settings: updated, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '更新设置失败',
        isLoading: false,
      });
    }
  },
}));
