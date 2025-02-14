import { useState, useEffect } from 'react';
import './app.css';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import CircularProgressChart from './components/CircularProgressChart/CircularProgressChart';

const TodoItem = ({ todo, toggleComplete, deleteTodo, updatePriority, inTrashView, undoFromTrash }) => {
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  return (
    <li className="todo-item">
      {/*显示优先级图标，仅在非回收站中可点击编辑*/}
      <span
        className="todo-priority-display"
        onClick={() => { if (!inTrashView) setPriorityMenuOpen(!priorityMenuOpen); }}
      >
        {todo.priority ? Array(todo.priority).fill('!').join('') : ''}
      </span>
      {priorityMenuOpen && !inTrashView && (
        <div className="priority-dropdown in-item">
          <button className="priority-low" onClick={() => { updatePriority(todo.id, 1); setPriorityMenuOpen(false); }}>!</button>
          <button className="priority-medium" onClick={() => { updatePriority(todo.id, 2); setPriorityMenuOpen(false); }}>!!</button>
          <button className="priority-high" onClick={() => { updatePriority(todo.id, 3); setPriorityMenuOpen(false); }}>!!!</button>
        </div>
      )}

      <span className="todo-text" style={{ textDecoration: todo.isCompleted ? 'line-through' : 'none' }}>
        {todo.title}
      </span>

      {inTrashView ? (
        //回收站中只显示 Undo 按钮
        <div className="btn-group">
          <button className="delete-btn" onClick={() => undoFromTrash(todo.id)}>Undo</button>
        </div>
      ) : (
        //正常状态下显示 Complete与Delete按钮
        <div className="btn-group">
          <button className={`complete-btn ${todo.isCompleted ? 'undo' : ''}`} onClick={() => toggleComplete(todo.id)}>
            {todo.isCompleted ? 'Undo' : 'Complete'}
          </button>
          <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>Delete</button>
        </div>
      )}
    </li>
  );
};

function App() {
  const [todos, setTodos] = useState([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [trashTodos, setTrashTodos] = useState([]);
  const [isDeleteOp, setIsDeleteOp] = useState(false);

  //这里是用于添加任务时选择优先级（1：低，2：中，3：高）
  const [selectedPriority, setSelectedPriority] = useState(1);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  //从本地加载数据
  useEffect(() => {
    const cacheTodos = JSON.parse(localStorage.getItem('CACHE_TODO_LIST'));
    setTodos(cacheTodos || []);
    const cachedTrash = JSON.parse(localStorage.getItem('TRASH_TODO_LIST'));
    setTrashTodos(cachedTrash || []);
  }, []);

  //保存todos到本地
  useEffect(() => {
    localStorage.setItem('CACHE_TODO_LIST', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('TRASH_TODO_LIST', JSON.stringify(trashTodos));
  }, [trashTodos]);

  const addTodoItem = () => {
    if (!todoTitle.trim()) return;
    const newItem = {
      id: Date.now(),
      title: todoTitle,
      isCompleted: false,
      priority: selectedPriority,
    };
    setTodos([...todos, newItem]);
    setTodoTitle('');
    //添加后重置优先级为默认值
    setSelectedPriority(1);
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(item =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const deleteTodo = (id) => {
    setIsDeleteOp(true);
    const todoToDelete = todos.find(todo => todo.id === id);
    if (todoToDelete) {
      //将任务标记为回收站项
      const trashItem = { ...todoToDelete, isTrash: true };
      setTrashTodos([...trashTodos, trashItem]);
    }
    //从todos中移除该任务
    setTimeout(() => {
      setTodos(todos.filter(todo => todo.id !== id));
      setIsDeleteOp(false);
    }, 16);
  };

  const updatePriority = (id, newPriority) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, priority: newPriority } : todo
    ));
  };

  const undoFromTrash = (id) => {
    const todoToUndo = trashTodos.find(todo => todo.id === id);
    if (todoToUndo) {
      //恢复时移除isTrash标记
      const restoredTodo = { ...todoToUndo };
      delete restoredTodo.isTrash;
      setTodos([...todos, restoredTodo]);
      setTrashTodos(trashTodos.filter(todo => todo.id !== id));
    }
  };

  //根据当前 filter 筛选任务列表，同时在“全部”和“正在进行中”页面中按优先级排序
  let filteredTodos = [];
  if (currentFilter === "all") {
    filteredTodos = [...todos].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } else if (currentFilter === "completed") {
    filteredTodos = todos.filter(todo => todo.isCompleted);
  } else if (currentFilter === "inprogress") {
    filteredTodos = todos.filter(todo => !todo.isCompleted).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } else if (currentFilter === "trash") {
    filteredTodos = trashTodos;
  }

  return (
    <div className="container">
      <div className="bg-pattern"></div>
      <h1>Todo List</h1>

      {/*输入区域：这里包括了优先级选择按钮、输入框、Add 按钮和 Filter 下拉菜单 */}
      <div className="input-group priority-input-group" style={{ position: 'relative' }}>
        {/*左侧“优先级”按钮，点击后展开下拉菜单 */}
        <button 
          className="priority-btn" 
          onClick={() => setPriorityMenuOpen(!priorityMenuOpen)}
          style={{
            position: 'absolute',
            left: '-100px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#E53935',
            color: 'white',
            fontWeight: 'bold',
            padding: '8px 12px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          优先级
        </button>
        {priorityMenuOpen && (
          <div className="priority-dropdown" style={{
            position: 'absolute',
            left: '-100px',
            top: '110%',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            zIndex: 10,
            padding: '5px'
          }}>
            <button 
              className="priority-low" 
              style={{
                background: '#FFCDD2',
                color: '#B71C1C',
                fontWeight: 'bold',
                padding: '5px 10px',
                border: 'none',
                borderRadius: '4px',
                marginBottom: '2px',
                cursor: 'pointer'
              }}
              onClick={() => { setSelectedPriority(1); setPriorityMenuOpen(false); }}
            >
              !
            </button>
            <button 
              className="priority-medium" 
              style={{
                background: '#EF9A9A',
                color: '#B71C1C',
                fontWeight: 'bold',
                padding: '5px 10px',
                border: 'none',
                borderRadius: '4px',
                marginBottom: '2px',
                cursor: 'pointer'
              }}
              onClick={() => { setSelectedPriority(2); setPriorityMenuOpen(false); }}
            >
              !!
            </button>
            <button 
              className="priority-high" 
              style={{
                background: '#E57373',
                color: '#B71C1C',
                fontWeight: 'bold',
                padding: '5px 10px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => { setSelectedPriority(3); setPriorityMenuOpen(false); }}
            >
              !!!
            </button>
          </div>
        )}

        <input
          type="text"
          value={todoTitle}
          placeholder="每一次写下，都在梳理人生；每一次划掉，都是成长的痕迹"
          onChange={(e) => setTodoTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodoItem()}
        />
        {selectedPriority > 0 && (
          <div className="selected-priority-display" style={{
            padding: '8px 12px',
            fontWeight: 'bold',
            color: '#E53935'
          }}>
            {Array(selectedPriority).fill('!').join('')}
          </div>
        )}
        <button className="add-btn" onClick={addTodoItem}>Add</button>
        <div className="filter-container">
          <button onClick={() => setFilterMenuOpen(!filterMenuOpen)}>Filter</button>
          {filterMenuOpen && (
            <div className="filter-dropdown">
              <button className="filter-completed" 
                onClick={() => { setCurrentFilter("completed"); setFilterMenuOpen(false); }}>
                  已完成
              </button>
              <button className="filter-inprogress" 
                onClick={() => { setCurrentFilter("inprogress"); setFilterMenuOpen(false); }}>
                  正在进行中
              </button>
              <button className="filter-trash" 
                onClick={() => { setCurrentFilter("trash"); setFilterMenuOpen(false); }}>
                  回收站
              </button>
              <button className="filter-all" 
                onClick={() => { setCurrentFilter("all"); setFilterMenuOpen(false); }}>
                  全部
              </button>
              <button className="clear-cache-btn" onClick={() => {
                if (window.confirm("你确定要清除所有缓存吗？该操作不可逆喔")) {
                  localStorage.removeItem("CACHE_TODO_LIST");
                  localStorage.removeItem("TRASH_TODO_LIST");
                  window.location.reload();
                }
              }}>清理缓存</button>
            </div>
          )}
        </div>
      </div>

      {/*主区域的Todo列表 */}
      <div className="main-content">
        <div className="list-container">
          <TransitionGroup component="ul" className="todo-list" appear={isDeleteOp} enter={isDeleteOp} exit={isDeleteOp}>
            {filteredTodos.map(todo => (
              <CSSTransition key={todo.id} timeout={2500} classNames="todo-item">
                <TodoItem 
                  todo={todo} 
                  toggleComplete={toggleComplete} 
                  deleteTodo={deleteTodo}
                  updatePriority={updatePriority}
                  inTrashView={currentFilter === "trash"}
                  undoFromTrash={undoFromTrash}
                />
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>
      </div>

      {/*图表的容器 */}
      <div className="chart-container">
        <CircularProgressChart todos={todos} />
      </div>
    </div>
  );
}

export default App;
