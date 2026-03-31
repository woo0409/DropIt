import { StackItem, Settings, STORAGE_KEYS, DEFAULT_SETTINGS } from '../types';

/**
 * 存储区域类型
 */
export type StorageArea = 'sync' | 'local';

/**
 * 检查扩展上下文是否仍然有效
 * 扩展被重新加载/更新后，旧的 content script 上下文会失效
 */
function isContextValid(): boolean {
  try {
    return !!(chrome?.runtime?.id);
  } catch {
    return false;
  }
}

/**
 * 通用的存储操作类
 */
class StorageManager {
  /**
   * 获取 Chrome 存储对象
   */
  private getStorage(area: StorageArea): chrome.storage.StorageArea {
    return area === 'sync' ? chrome.storage.sync : chrome.storage.local;
  }

  /**
   * 检查上下文有效性，无效则抛出友好错误
   */
  private checkContext(): void {
    if (!isContextValid()) {
      throw new Error('扩展已更新，请刷新页面后重试');
    }
  }

  /**
   * 获取所有栈项
   */
  async getItems(area: StorageArea = 'sync'): Promise<StackItem[]> {
    this.checkContext();
    return new Promise((resolve, reject) => {
      this.getStorage(area).get([STORAGE_KEYS.ITEMS], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[STORAGE_KEYS.ITEMS] || []);
        }
      });
    });
  }

  /**
   * 保存所有栈项
   */
  async setItems(items: StackItem[], area: StorageArea = 'sync'): Promise<void> {
    this.checkContext();
    return new Promise((resolve, reject) => {
      this.getStorage(area).set({ [STORAGE_KEYS.ITEMS]: items }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取用户设置
   */
  async getSettings(area: StorageArea = 'sync'): Promise<Settings> {
    this.checkContext();
    return new Promise((resolve, reject) => {
      this.getStorage(area).get([STORAGE_KEYS.SETTINGS], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] });
        }
      });
    });
  }

  /**
   * 更新用户设置
   */
  async updateSettings(settings: Partial<Settings>, area: StorageArea = 'sync'): Promise<Settings> {
    this.checkContext();
    return new Promise((resolve, reject) => {
      this.getStorage(area).get([STORAGE_KEYS.SETTINGS], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const current = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
        const updated = { ...current, ...settings };

        this.getStorage(area).set({ [STORAGE_KEYS.SETTINGS]: updated }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(updated);
          }
        });
      });
    });
  }

  /**
   * Push 操作：将项添加到栈顶
   */
  async push(item: StackItem, area: StorageArea = 'sync'): Promise<StackItem[]> {
    const items = await this.getItems(area);

    // 去重：检查 URL 是否已存在
    const existingItem = items.find(i => i.url === item.url);
    if (existingItem) {
      throw new Error('该链接已存在');
    }

    items.push(item); // 添加到数组末尾（栈顶）
    await this.setItems(items, area);
    return items;
  }

  /**
   * Pop 操作：移除并返回栈顶项
   */
  async pop(area: StorageArea = 'sync'): Promise<StackItem | null> {
    const items = await this.getItems(area);
    if (items.length === 0) {
      return null;
    }
    const popped = items.pop()!;
    await this.setItems(items, area);
    return popped;
  }

  /**
   * Peek 操作：查看但不移除栈顶项
   */
  async peek(area: StorageArea = 'sync'): Promise<StackItem | null> {
    const items = await this.getItems(area);
    return items.length > 0 ? items[items.length - 1] : null;
  }

  /**
   * Remove 操作：移除指定 ID 的项
   */
  async remove(id: string, area: StorageArea = 'sync'): Promise<boolean> {
    const items = await this.getItems(area);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    items.splice(index, 1);
    await this.setItems(items, area);
    return true;
  }

  /**
   * 清空所有项
   */
  async clearItems(area: StorageArea = 'sync'): Promise<void> {
    await this.setItems([], area);
  }
}

// 导出单例
export const storage = new StorageManager();
