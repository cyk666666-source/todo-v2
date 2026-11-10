/**
 * TodoApp.tsx —— 容器组件：唯一持有 todos 的地方
 *
 * 职责边界：
 *   1. 存数据：useState 管理 todos 与 filter；
 *   2. 算界面：把 todos 按 filter 过滤后交给 TodoList；
 *   3. 收通知：子组件通过回调（onAdd / onToggle / onEdit / onRemove）向上通知。
 *
 * 关键约束：所有更新都走不可变更新——先复制出新数组/新对象，再交给 setTodos，
 * 绝不在原 State 上 push / splice / 改字段，否则 React 比对引用不变会跳过渲染。
 */

import { useEffect, useState } from 'react';
import { addTodo, removeTodo, toggleTodo, updateTodo } from '../todo';
import type { Todo } from '../todo';
import { loadTodos, saveTodos } from '../storage';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

/** 三个合法视图：字面量联合类型，拼错在编译期就报错 */
export type Filter = 'all' | 'active' | 'done';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'done', label: '已完成' },
];

/** 调试入口：控制台里打印的 State 与页面必须一致（V8 遗留能力的 React 版） */
declare global {
  interface Window {
    TodoApp: {
      getTodos(): Todo[];
    };
  }
}

/** 按当前视图过滤：纯计算，不修改 todos */
function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'done') return todos.filter((t) => t.completed);
  if (filter === 'active') return todos.filter((t) => !t.completed);
  return todos;
}

/** 复制出新数组 + 新对象，保证交给 React 的是新引用 */
function copyTodos(todos: Todo[]): Todo[] {
  return todos.map((t) => ({ ...t }));
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilter] = useState<Filter>('all');

  // 数据持久化：todos 变了就写回 localStorage（清理函数不需要，无外部订阅）
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // 调试接口：每次渲染后同步最新的 todos，控制台可随时打印
  useEffect(() => {
    window.TodoApp = {
      getTodos: () => copyTodos(todos),
    };
  }, [todos]);

  /** 添加：复用数据层的 addTodo 校验规则，但作用在副本上，再整体替换 State */
  function handleAdd(text: string): void {
    setTodos((prev) => {
      const next = copyTodos(prev);
      addTodo(next, text);
      return next;
    });
  }

  /** 切换完成状态：map + 展开生成新对象，绝不就地改 completed */
  function handleToggle(id: number): void {
    setTodos((prev) => {
      const next = copyTodos(prev);
      toggleTodo(next, id);
      return next;
    });
  }

  /** 删除：filter 生成新数组 */
  function handleRemove(id: number): void {
    setTodos((prev) => {
      const next = copyTodos(prev);
      removeTodo(next, id);
      return next;
    });
  }

  /** 修改：取消（null）不改；空串 / 纯空格的拦截仍由 updateTodo 负责 */
  function handleEdit(id: number): void {
    const target = todos.find((t) => t.id === id);
    if (target === undefined) return;
    const newText = window.prompt('修改任务', target.text);
    if (newText === null) return;
    setTodos((prev) => {
      const next = copyTodos(prev);
      updateTodo(next, id, newText);
      return next;
    });
  }

  const shown = filterTodos(todos, filter);

  return (
    <div>
      <h1>Todo 列表 · V4.0 React 版</h1>
      <TodoForm onAdd={handleAdd} />
      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={f.value === filter ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <TodoList todos={shown} onToggle={handleToggle} onEdit={handleEdit} onRemove={handleRemove} />
    </div>
  );
}
