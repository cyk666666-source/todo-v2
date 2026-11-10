/**
 * main.tsx —— V4.0 启动入口
 *
 * 整个应用只有这里真的「碰」了一次 DOM：拿到 #root 容器交给 React。
 * 之后所有节点增删改都由 React 根据 State 协调完成，业务代码零 DOM 操作。
 */

import { createRoot } from 'react-dom/client';
import './style.css';
import TodoApp from './components/TodoApp';

const root = document.getElementById('root');
if (root === null) {
  throw new Error('挂载失败：index.html 中缺少 #root 容器');
}
createRoot(root).render(<TodoApp />);
