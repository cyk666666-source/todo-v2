/**
 * storage.ts —— 持久化层（V4.0 从 main.ts 抽出）
 *
 * localStorage 是外部脏数据入口：JSON.parse 之后必须逐条做运行时校验，
 * 类型声明（Todo[]）只在编译期有效，拦不住手改过的存储内容。
 * 本文件不碰任何 DOM，只负责「读出来 / 写回去」。
 */

import type { Todo } from './todo';

/** localStorage 的键名（与 V3.0 保持一致，升级后旧数据仍可用） */
const KEY = 'todos';

/**
 * 读取并校验任务列表：坏数据逐条丢弃，整体解析失败则重置为空列表。
 */
export function loadTodos(): Todo[] {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const result: Todo[] = [];
    for (const item of data) {
      if (typeof item !== 'object' || item === null) continue;
      const t: Record<string, unknown> = item;
      if (typeof t.id !== 'number') continue;
      if (typeof t.text !== 'string') continue;
      if (typeof t.completed !== 'boolean') continue;
      result.push({ id: t.id, text: t.text, completed: t.completed });
    }
    return result;
  } catch (err) {
    console.error('localStorage 中的数据不是合法 JSON，已重置为空列表', err);
    return [];
  }
}

/** 把当前 State 写回 localStorage（由 TodoApp 的 Effect 调用） */
export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(KEY, JSON.stringify(todos));
}
