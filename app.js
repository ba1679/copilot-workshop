// 這個檔案負責處理待辦清單的資料邏輯、顏色主題與篩選功能。
const STORAGE_KEY = 'todo-list-items';
const THEME_KEY = 'todo-theme-mode';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const todoCount = document.getElementById('todo-count');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-btn');

let activeFilter = 'all';

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

// 判斷目前是否為深色模式，若沒有使用者偏好，就跟隨作業系統設定。
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 根據主題設定 body 的 data-theme，並更新切換按鈕文字與圖示。
function applyTheme(theme) {
  const isDarkTheme = theme === 'dark';
  document.body.dataset.theme = theme;
  themeToggle.innerHTML = `
    <span class="toggle-icon">${isDarkTheme ? '☀️' : '🌙'}</span>
    <span class="toggle-text">${isDarkTheme ? '淺色模式' : '深色模式'}</span>
  `;
  themeToggle.setAttribute('aria-label', isDarkTheme ? '切換為淺色模式' : '切換為深色模式');
}

// 依照是否有使用者手動選擇，決定初始主題；若沒有，則跟隨作業系統設定。
function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const theme = savedTheme || getSystemTheme();
  applyTheme(theme);
}

// 讀取目前的篩選條件，回傳符合條件的待辦列表。
function getFilteredTodos(todos) {
  switch (activeFilter) {
    case 'pending':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
}

// 根據目前篩選狀態回傳對應的提示文字。
function getEmptyMessage() {
  switch (activeFilter) {
    case 'pending':
      return '還沒有未完成的待辦事項';
    case 'completed':
      return '還沒有已完成的待辦事項';
    default:
      return '還沒有任何待辦事項,新增一個吧!';
  }
}

// 計算未完成項目數量，並更新底部統計文字，此數字不受篩選影響。
function updateCount(todos) {
  const unfinishedCount = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `未完成: ${unfinishedCount} 項`;
}

// 重新繪製清單畫面，並根據篩選狀態與資料顯示空狀態。
function renderTodos() {
  const todos = loadTodos();
  const filteredTodos = getFilteredTodos(todos);

  // 清空原本的列表，避免重複渲染。
  todoList.innerHTML = '';

  if (filteredTodos.length === 0) {
    todoList.hidden = true;
    emptyState.hidden = false;
    emptyState.textContent = getEmptyMessage();
  } else {
    todoList.hidden = false;
    emptyState.hidden = true;

    filteredTodos.forEach((todo) => {
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

// 切換深色模式，同時把使用者的選擇存進 localStorage。
function handleThemeToggle() {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

// 更新目前選擇的篩選按鈕樣式，並重新渲染清單。
function setActiveFilter(filterName) {
  activeFilter = filterName;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filterName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

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

themeToggle.addEventListener('click', handleThemeToggle);

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveFilter(button.dataset.filter);
  });
});

// 初始載入時先套用主題與渲染介面，讓資料在重新整理後還存在。
initializeTheme();
renderTodos();
