/**
 * todo.test.ts —— 任务 2：手写单测（不依赖 AI）
 *
 * 覆盖实验课要求的 5 个用例：
 *   addTodo    正常添加 / 纯空格拦截 / 空字符串拦截
 *   toggleTodo 正常切换 / 不存在的 ID 不崩溃
 *
 * 编写原则：
 *   1. 每个用例内部新建局部 todos —— 用例之间不共享状态（防测试污染）；
 *   2. 断言到具体值（text 内容、length、completed）—— 不写 toBeDefined 这种弱断言；
 *   3. 边界用例的预期值来自契约，不来自实现。
 */

import { test, expect } from 'vitest';
import { addTodo, toggleTodo, Todo } from './todo';

/* ========== addTodo ========== */

test('addTodo 正常添加：长度 +1，且文本内容正确', () => {
  const todos: Todo[] = [];          // 用例内部新建：干净开局
  addTodo(todos, '学习TS');
  expect(todos.length).toBe(1);
  expect(todos[0].text).toBe('学习TS');           // 内容断言，防「拦住了却存成空串」
  expect(todos[0].completed).toBe(false);        // 新任务默认未完成
});

test('addTodo 纯空格：拦截，长度不变', () => {
  const todos: Todo[] = [];
  addTodo(todos, '   ');            // 三个空格：trim 后为空
  expect(todos.length).toBe(0);
});

test('addTodo 空字符串：拦截，长度不变', () => {
  const todos: Todo[] = [];
  addTodo(todos, '');                // 与纯空格入口不同：本来就为空
  expect(todos.length).toBe(0);
});

/* ========== toggleTodo ========== */

test('toggleTodo 正常切换：目标翻转，其他条目不受影响', () => {
  const todos: Todo[] = [
    { id: 1, text: '学习TS', completed: false },
    { id: 2, text: '写单测', completed: false },
  ];
  toggleTodo(todos, 1);
  expect(todos[0].completed).toBe(true);          // 目标被翻转
  expect(todos[1].completed).toBe(false);          // 其他条目不受影响
});

test('toggleTodo 不存在的 ID：不崩溃，数据不变', () => {
  const todos: Todo[] = [];          // 空数组里找 999：契约是安静返回
  toggleTodo(todos, 999);
  expect(todos.length).toBe(0);
});
