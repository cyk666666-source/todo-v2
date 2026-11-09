/**
 * todo.ts —— 数据层（W9：TypeScript 重构）
 *
 * 从 W8 的 todo-v3.html 中抽出的「纯数据函数」：
 * 不碰 DOM、不碰 localStorage，只操作传入的 todos 数组，
 * 因此可以直接在 Node.js 环境下被 Vitest 单元测试。
 *
 * 业务契约（本周测试与 AI 审查都以此为准）：
 *   1. addTodo：合法文本（去空白后 1~200 字、不含 <script 注入）→ 追加新任务；
 *      null / 空字符串 / 纯空格 / 超过 200 字 / 含注入内容 → 一律拒绝，数组保持不变。
 *      重复文本允许各自成条（每条任务是独立条目）。
 *   2. toggleTodo：id 存在 → 翻转该条 completed；id 不存在 → 安静返回，不抛错。
 *   3. removeTodo / updateTodo：同上，id 不存在安静返回；updateTodo 对文本执行与 addTodo 相同的拦截规则。
 *   4. parseId：dataset.id / URL 参数等外部入口取出的都是字符串，
 *      必须先 Number() 转换、再用 Number.isSafeInteger 校验，坏值返回 null。
 *
 * 三条红线（全程遵守）：
 *   不用 any；不用非空断言 !；不用 as 硬转。
 */

/** 一条待办任务的数据结构：契约先行的第一步 */
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

/** 业务规则：任务文本上限 200 字（超长拦截的边界值） */
export const MAX_TEXT_LEN = 200;

/**
 * 判断「去空白后的文本」是否是一段可入库的合法任务文本。
 * @param trimmed 已 trim 过的文本
 */
function isValidTodoText(trimmed: string): boolean {
  if (trimmed === '') return false;                    // 空字符串
  if (trimmed.length > MAX_TEXT_LEN) return false;     // 超长
  if (/<\s*script/i.test(trimmed)) return false;       // 注入拦截（数据层净化）
  return true;
}

/**
 * 添加任务：向传入的数组追加一条新任务。
 * 契约：合法文本入库（存 trim 后的内容）；null / 空串 / 纯空格 / 超长 / 注入 → 拒绝，数组不变。
 * @param todos 任务数组（会被就地修改）
 * @param text  用户输入的原始文本
 */
export function addTodo(todos: Todo[], text: string): void {
  if (typeof text !== 'string') return;                // 运行时脏数据（如 null）——类型声明拦不住，自己拦
  const trimmed = text.trim();
  if (!isValidTodoText(trimmed)) return;
  todos.push({ id: Date.now(), text: trimmed, completed: false });
}

/**
 * 切换完成状态：找到 id 对应的任务并翻转 completed。
 * 契约：id 存在 → 翻转；id 不存在 → 安静返回（不崩溃、不新增）。
 * @param todos 任务数组（会被就地修改）
 * @param id    目标任务 id
 */
export function toggleTodo(todos: Todo[], id: number): void {
  const target = todos.find(function (t) { return t.id === id; });
  if (target === undefined) return;                    // 空值收窄：找不到就返回
  target.completed = !target.completed;
}

/**
 * 删除任务：按 id 移除对应条目；id 不存在时安静返回。
 * @param todos 任务数组（会被就地修改）
 * @param id    要删除的任务 id
 */
export function removeTodo(todos: Todo[], id: number): void {
  const idx = todos.findIndex(function (t) { return t.id === id; });
  if (idx === -1) return;
  todos.splice(idx, 1);
}

/**
 * 修改任务文本：对 id 对应条目替换文本；文本执行与 addTodo 相同的拦截规则。
 * @param todos 任务数组（会被就地修改）
 * @param id    要修改的任务 id
 * @param text  新文本（原始输入）
 */
export function updateTodo(todos: Todo[], id: number, text: string): void {
  if (typeof text !== 'string') return;
  const trimmed = text.trim();
  if (!isValidTodoText(trimmed)) return;
  const target = todos.find(function (t) { return t.id === id; });
  if (target === undefined) return;
  target.text = trimmed;
}

/**
 * 脏数据入口统一处理：把外部进来的 id 字符串安全地转成 number。
 * dataset.id 永远是 string，localStorage 解析结果不受控，
 * 三种坏值：'123abc' → NaN；'1.5' → 非整数；'' → 0（0 不是合法 id，会被 > 0 挡住）。
 * @param raw 外部取出的原始字符串（可能是 undefined）
 * @returns 合法正整数 id；否则 null
 */
export function parseId(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  if (raw.trim() === '') return null;
  const id = Number(raw);                              // '123' → 123；'123abc' → NaN
  if (!Number.isSafeInteger(id)) return null;           // NaN / 小数 / 超出安全整数全部拦截
  if (id <= 0) return null;                            // 0 与负数不是合法 id
  return id;
}
