/**
 * TodoList.tsx —— 只渲染列表
 *
 * 数据向下：todos 由父组件传入，本组件只读；
 * 事件向上：把父组件的回调继续往下递给 TodoItem，自己不加工数据。
 */

import type { Todo } from '../todo';
import TodoItem from './TodoItem';

export interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onEdit: (id: number) => void;
  onRemove: (id: number) => void;
}

export default function TodoList({ todos, onToggle, onEdit, onRemove }: TodoListProps) {
  return (
    <ul id="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
