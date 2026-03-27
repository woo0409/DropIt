/**
 * 栈项类型 - 任务或阅读项
 */
export type StackItemType = 'task' | 'read';

/**
 * 优先级级别
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * 单个栈项
 */
export interface StackItem {
  /** 唯一标识符 */
  id: string;
  /** 类型：任务或稍后阅读 */
  type: StackItemType;
  /** 标题 */
  title: string;
  /** 可选：关联的 URL */
  url?: string;
  /** 可选：用户备注 */
  note?: string;
  /** 优先级 */
  priority: Priority;
  /** 推入时间戳 */
  pushedAt: number;
  /** 来源页面/来源描述 */
  source: string;
}

/**
 * 用户设置
 */
export interface Settings {
  /** 栈的最大深度 */
  maxDepth: number;
  /** 提醒阈值（时间间隔，单位：毫秒） */
  reminderThresholds: number[];
}

/**
 * 完整的栈数据结构
 */
export interface StackData {
  /** 栈中的所有项 */
  items: StackItem[];
  /** 用户设置 */
  settings: Settings;
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
  reminderThresholds: [
    1 * 60 * 60 * 1000, // 1 小时
    4 * 60 * 60 * 1000, // 4 小时
    24 * 60 * 60 * 1000, // 1 天
  ],
};
