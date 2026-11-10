/**
 * TodoForm.tsx —— 只负责「收输入」，不碰 todos
 *
 * 输入框的临时文本属于本组件内部状态，用 useState 自己管；
 * 点「添加」时把文本通过 onAdd 回调交给父组件，自己把输入清空。
 */

import { useState } from 'react';

export interface TodoFormProps {
  onAdd: (text: string) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState('');

  function handleAdd(): void {
    onAdd(text); // 校验规则在数据层，这里不重复判空
    setText('');
  }

  return (
    <div className="todo-form">
      <input
        id="todo-input"
        type="text"
        placeholder="输入待办事项"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button id="add-btn" onClick={handleAdd}>
        添加
      </button>
    </div>
  );
}
