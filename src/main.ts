/**
 * app.ts —— UI 层（W9：TypeScript 重构）
 *
 * 从 W8 的 todo-v3.html 迁移过来的 DOM 接线层：
 * 数据逻辑全部委托给 todo.ts 的纯数据函数，本文件只负责
 *   读取输入 → 调用数据函数 → 保存 → 渲染 → 绑定事件。
 *
 * TS 化的重点（对照实验课「三条红线与一条类型坑」）：
 *   1. e.target 的类型是 EventTarget（没有 dataset）→ 先 instanceof HTMLElement 收窄再用；
 *   2. closest('li') 可能返回 null（点到空白处）→ 先判空再访问；
 *   3. dataset.id 是 string → 统一交给 parseId() 转换 + 校验，不做 as 硬转；
 *   4. localStorage 是外部脏数据入口 → JSON.parse 之后逐条做运行时校验。
 */

import './style.css';

import {
  Todo,
  addTodo,
  removeTodo,
  toggleTodo,
  updateTodo,
  parseId,
} from './todo';

/** 暴露到控制台的调试入口的类型（W8 遗留能力，给 window 补声明） */
declare global {
  interface Window {
    TodoApp: {
      addTodo(text: string): void;
      removeTodo(id: number): void;
      toggleTodo(id: number): void;
      updateTodo(id: number, text: string): void;
    };
  }
}

/* ========== 常量与模块状态 ========== */

const KEY = 'todos';                         // localStorage 的键名
type Filter = 'all' | 'active' | 'done';     // 字面量联合类型：三个合法视图，拼错编译期就报错

const list = document.querySelector<HTMLElement>('#todo-list');
const input = document.querySelector<HTMLInputElement>('#todo-input');
const addBtn = document.querySelector<HTMLElement>('#add-btn');
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn');

const todos: Todo[] = load();                // 单一数据源（只改内容，不换引用）
let filter: Filter = 'all';                  // 视图状态：不需要持久化

/* ========== 持久化（含运行时校验） ========== */

function save(): void {
  localStorage.setItem(KEY, JSON.stringify(todos));
}

/**
 * 读取 localStorage 并做运行时校验：
 * TS 的类型声明拦不住外部脏数据（手改过的存储 / 接口返回），
 * 所以除了 Array.isArray，还要逐条检查成员结构，坏数据直接丢弃。
 * @returns 校验通过的合法任务数组
 */
function load(): Todo[] {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return [];               // 空值收窄：没存过就是空数组
  try {
    const data: unknown = JSON.parse(raw);   // parse 结果类型未知，先按 unknown 接住
    if (!Array.isArray(data)) return [];
    const result: Todo[] = [];
    for (const item of data) {
      if (typeof item !== 'object' || item === null) continue;
      const t: Record<string, unknown> = item;   // 已运行时确认是对象，直接按索引访问
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

/* ========== 渲染 ========== */

/** 渲染：DOM 是 todos 的投影。先按 filter 过滤出要显示哪些，再整表重画。 */
function render(): void {
  if (list === null) return;                 // 空值收窄：容器不存在时安静退出
  list.textContent = '';                     // 清空旧列表 → 整体重画

  const shown = todos.filter(function (t) {
    if (filter === 'done') return t.completed;
    if (filter === 'active') return !t.completed;
    return true;                             // filter === 'all'
  });

  for (const t of shown) {
    const li = document.createElement('li');
    li.dataset.id = String(t.id);            // dataset 只能存字符串
    if (t.completed) li.classList.add('done');

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = t.text;                // 纯文本插入，不解析 HTML
    li.appendChild(span);

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = '改';
    li.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.dataset.action = 'delete';
    delBtn.textContent = '×';
    li.appendChild(delBtn);

    list.appendChild(li);
  }
}

/* ========== 视图操作 ========== */

/** 切换筛选视图：只改视图状态并重渲染，不需要 save()。 */
function setFilter(f: Filter): void {
  filter = f;
  filterBtns.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.filter === f);
  });
  render();
}

/* ========== 事件处理 ========== */

/** 点击「添加」：读输入 → 入数据 → 存盘 → 重渲染 → 清空输入框。 */
function onAddClick(): void {
  if (input === null) return;
  const text = input.value;
  addTodo(todos, text);                      // 拦截规则全部在数据层，UI 不重复判空
  save();
  render();
  input.value = '';
}

/** 点击命中的目标：已收窄的元素、所在列表项、合法 id。 */
interface ClickTarget {
  clicked: HTMLElement;
  item: Element;
  id: number;
}

/**
 * 事件委托的第一道处理：类型收窄 → 空值收窄 → id 校验。
 * 任一步失败返回 null；原先散在 onListClick 里的三道防线集中在这里。
 */
function resolveTarget(e: MouseEvent): ClickTarget | null {
  if (!(e.target instanceof HTMLElement)) return null;     // ① 不是元素直接退出
  const item = e.target.closest('li');
  if (item === null || list === null || !list.contains(item)) return null; // ② 点空白 / 越界
  const id = parseId(item.dataset.id);                     // ③ string → number | null
  if (id === null) return null;
  return { clicked: e.target, item, id };
}

/** 删除：与切换互斥，只删不切换。 */
function handleDelete(id: number): void {
  removeTodo(todos, id);
  save();
  render();
}

/** 修改：用户点取消（null）不改；空串/纯空格的拦截仍在数据层。 */
function handleEdit(id: number): void {
  const target = todos.find(function (t) {
    return t.id === id;
  });
  if (target === undefined) return;
  const newText = prompt('修改任务', target.text);
  if (newText === null) return;
  updateTodo(todos, id, newText);
  save();
  render();
}

/**
 * 列表点击：事件委托。
 * 目标解析与具体动作都下沉到具名函数，本函数只负责「分流」。
 */
function onListClick(e: MouseEvent): void {
  const target = resolveTarget(e);
  if (target === null) return;

  const delBtn = target.clicked.closest('[data-action="delete"]');
  const editBtn = target.clicked.closest('[data-action="edit"]');
  if (delBtn !== null && target.item.contains(delBtn)) {
    handleDelete(target.id);
  } else if (editBtn !== null && target.item.contains(editBtn)) {
    handleEdit(target.id);
  } else {
    toggleTodo(todos, target.id);                          // 点正文：切换完成状态
    save();
    render();
  }
}

/** 筛选按钮点击：dataset 取出的值做运行时校验，只认三个合法视图。 */
function onFilterClick(e: Event): void {
  if (!(e.target instanceof HTMLElement)) return;
  const f = e.target.dataset.filter;
  if (f === 'all' || f === 'active' || f === 'done') {
    setFilter(f);                                           // 收窄为 Filter 后才允许传入
  }
}

/* ========== 启动 ========== */

if (list !== null && addBtn !== null) {
  addBtn.addEventListener('click', onAddClick);
  list.addEventListener('click', onListClick);
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', onFilterClick);
  });
  render();                                  // 页面加载后按现有数据渲染一次

  // 暴露到控制台以便手动测试（不影响生产逻辑）
  window.TodoApp = {
    addTodo: function (text: string) { addTodo(todos, text); save(); render(); },
    removeTodo: function (id: number) { removeTodo(todos, id); save(); render(); },
    toggleTodo: function (id: number) { toggleTodo(todos, id); save(); render(); },
    updateTodo: function (id: number, text: string) { updateTodo(todos, id, text); save(); render(); },
  };
}
