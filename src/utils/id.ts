/**
 * 生成符合 RFC4122 v4 标准的 UUID
 * 使用 crypto.randomUUID()（如果可用）或回退到 Math.random()
 */
export function generateId(): string {
  // 在浏览器环境中优先使用 crypto API
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 回退到手动生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成短 ID（用于显示）
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}
