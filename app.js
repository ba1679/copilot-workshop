// 這個檔案負責處理待辦清單的資料邏輯與畫面更新。
const STORAGE_KEY = 'todo-list-items';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const todoCount = document.getElementById('todo-count');

// 讀取 localStorage 中的待辦資料，若資料格式不正確，則回傳空陣列。
function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTodos) ? savedTodos : [];
  } catch (error) {
    console.error('讀取待辦資料失敗:', error);
    return [];
  }
}

// 將目前待辦資料保存到 localStorage。
function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 計算未完成項目數量，並更新底部統計文字。
function updateCount(todos) {
  const unfinishedCount = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `未完成: ${unfinishedCount} 項`;
}

// 重新繪製清單畫面，並根據資料顯示空狀態。
function renderTodos() {
  const todos = loadTodos();

  // 清空原本的列表，避免重複渲染。
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.hidden = true;
    emptyState.hidden = false;
  } else {
    todoList.hidden = false;
    emptyState.hidden = true;

    todos.forEach((todo) => {
      const item = document.createElement('li');
      item.className = `todo-item${todo.completed ? ' completed' : ''}`;

      const mainContent = document.createElement('div');
      mainContent.className = 'todo-main';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked = todo.completed;
      checkbox.setAttribute('aria-label', `完成待辦: ${todo.text}`);

      // 勾選框被點擊時更新狀態並重新渲染。
      checkbox.addEventListener('change', () => {
        const currentTodos = loadTodos();
        const targetTodo = currentTodos.find((entry) => entry.id === todo.id);

        if (targetTodo) {
          targetTodo.completed = checkbox.checked;
          saveTodos(currentTodos);
          renderTodos();
        }
      });

      const text = document.createElement('span');
      text.className = 'todo-text';
      text.textContent = todo.text;

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'delete-btn';
      deleteButton.textContent = '刪除';

      // 刪除按鈕點擊時從資料中移除該項目。
      deleteButton.addEventListener('click', () => {
        const currentTodos = loadTodos().filter((entry) => entry.id !== todo.id);
        saveTodos(currentTodos);
        renderTodos();
      });

      mainContent.appendChild(checkbox);
      mainContent.appendChild(text);
      item.appendChild(mainContent);
      item.appendChild(deleteButton);
      todoList.appendChild(item);
    });
  }

  updateCount(todos);
}

// 新增待辦事件：避免空白內容被加入。
function addTodo(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return;
  }

  const todos = loadTodos();
  const newTodo = {
    id: Date.now() + Math.random(),
    text: trimmedText,
    completed: false,
  };

  todos.push(newTodo);
  saveTodos(todos);
  renderTodos();
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const inputValue = todoInput.value;

  if (!inputValue.trim()) {
    todoInput.focus();
    return;
  }

  addTodo(inputValue);
  todoInput.value = '';
  todoInput.focus();
});

// 初始載入時先渲染介面，讓資料在重新整理後還存在。
renderTodos();
