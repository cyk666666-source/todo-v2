/**
 * TodoItem.tsx —— 一行任务：展示 + 三个点击区
 *
 * 红线：todo 是 Props，只读。不能写 todo.completed = ...，
 * 想改状态只能调用父组件传下来的回调，由父组件的 State 重新驱动界面。
 */

import type { MouseEvent } from 'react';
import type { Todo } from '../todo';

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (id: number) => void;
  onRemove: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onEdit, onRemove }: TodoItemProps) {
  /** 点击按钮时不冒泡到 li，避免「点 × 的同时又切换了完成状态」 */
  function stop(e: MouseEvent<HTMLButtonElement>, action: (id: number) => void): void {
    e.stopPropagation();
    action(todo.id);
  }

  return (
    <li className={todo.completed ? 'done' : undefined} onClick={() => onToggle(todo.id)}>
      <span className="text">{todo.text}</span>
      <button className="edit-btn" onClick={(e) => stop(e, onEdit)}>
        改
      </button>
      <button className="del-btn" onClick={(e) => stop(e, onRemove)}>
        ×
      </button>
    </li>
  );
}
