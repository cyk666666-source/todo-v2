/**
 * todo-ai.test.ts —— 任务 3：AI 生成测试（结构化 Prompt）→ 人工审查 → 修补后的最终版
 *
 * AI 初版的问题（详见协作日志「审查报告」）：
 *   ① 弱断言：expect(todos[0]).toBeDefined() / toBeGreaterThan(0) —— 实现改错也不会红；
 *   ② 维度1（null）遗漏：Prompt 里明确要求，AI 仍以「类型上不可能」为由跳过；
 *   ③ 超长文本猜错业务边界：契约是 >200 拦截，AI 按「不拦截」写断言；
 *   ④ 维度9（安全）完全没覆盖：Prompt 没写，AI 就不会替你想到。
 *
 * 本文件是修补后的版本：弱断言换成内容断言，漏掉的维度逐条手写补上。
 */

import { test, expect } from 'vitest';
import { addTodo, Todo, MAX_TEXT_LEN } from './todo';

/* 修正①：AI 的弱断言 toBeDefined → 换成具体内容断言 */
test('正常添加：文本内容正确（替换 AI 的弱断言）', () => {
  const todos: Todo[] = [];
  addTodo(todos, '学习TS');
  expect(todos.length).toBe(1);
  expect(todos[0].text).toBe('学习TS');
});

/* 维度1（空值）：AI 遗漏，手写补上。
   测试专用 as any：模拟「运行时传进来的脏数据」，不属于生产代码的红线范围 */
test('维度1（空值）：null 应被拦截', () => {
  const todos: Todo[] = [];
  addTodo(todos, null as unknown as string);
  expect(todos.length).toBe(0);
});

/* 维度2（格式）：与手写用例一致，保留 AI 写对的部分 */
test('维度2（格式）：纯空格应被拦截', () => {
  const todos: Todo[] = [];
  addTodo(todos, '   ');
  expect(todos.length).toBe(0);
});

test('维度2（格式）：空字符串应被拦截', () => {
  const todos: Todo[] = [];
  addTodo(todos, '');
  expect(todos.length).toBe(0);
});

/* 维度6（重复）：AI 的 toBeGreaterThan(0) → 按契约写具体值：允许重复，各自成条 */
test('维度6（重复）：连续添加相同文本，按契约各自成条', () => {
  const todos: Todo[] = [];
  addTodo(todos, '学习TS');
  addTodo(todos, '学习TS');
  expect(todos.length).toBe(2);                 // 契约：重复文本允许，各为独立条目
  expect(todos[0].text).toBe('学习TS');
  expect(todos[1].text).toBe('学习TS');
});

/* 维度2拓展（超长）：AI 猜成「不拦截」→ 修正为业务契约（≤200 放行、>200 拦截） */
test('维度2拓展（格式）：超过 200 字应被拦截', () => {
  const todos: Todo[] = [];
  addTodo(todos, 'a'.repeat(MAX_TEXT_LEN + 1));
  expect(todos.length).toBe(0);
});

test('维度2拓展（格式）：恰好 200 字放行（边界值）', () => {
  const todos: Todo[] = [];
  addTodo(todos, 'a'.repeat(MAX_TEXT_LEN));
  expect(todos.length).toBe(1);
});

/* 维度9（安全）：Prompt 没写 AI 就没测 → 手写补上：注入文本不许原样入库 */
test('维度9（安全）：<script> 注入应被数据层拦截', () => {
  const todos: Todo[] = [];
  addTodo(todos, '<script>alert(1)</script>');
  expect(todos.length).toBe(0);                 // 契约：拦截，不原样存入
});
