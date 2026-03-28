/**
 * 单个栈项 — 稍后阅读
 */
export interface StackItem {
  /** 唯一标识符 */
  id: string;
  /** 页面标题 */
  title: string;
  /** 页面 URL */
  url: string;
  /** 推入时间戳 */
  pushedAt: number;
  /** 来源页面域名 */
  source: string;
}

/**
 * 用户设置
 */
export interface Settings {
  /** 栈的最大深度 */
  maxDepth: number;
  /** 保存后关闭标签页 */
  closeAfterPush: boolean;
}

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  ITEMS: 'dropit_items',
  SETTINGS: 'dropit_settings',
} as const;

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: Settings = {
  maxDepth: 20,
  closeAfterPush: true,
};
