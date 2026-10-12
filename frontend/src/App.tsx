import { useEffect, useRef, useState } from 'react';
import { Todo, listTodos, createTodo, updateTodo, deleteTodo } from './api';

type Filter = 'all' | 'active' | 'done';

function Row({
  todo,
  onToggle,
  onDelete,
  onSave,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const cancelled = useRef(false);

  const start = () => {
    cancelled.current = false;
    setDraft(todo.title);
    setEditing(true);
  };
  const finish = () => {
    if (cancelled.current) return;
    cancelled.current = true;
    setEditing(false);
    const t = draft.trim();
    if (t && t !== todo.title) onSave(t);
  };

  return (
    <li className="row">
      <input
        type="checkbox"
        className="check"
        checked={todo.done}
        onChange={onToggle}
        aria-label={`Mark "${todo.title}" as ${todo.done ? 'not done' : 'done'}`}
      />
      {editing ? (
        <input
          className="edit"
          value={draft}
          autoFocus
          maxLength={200}
          aria-label="Edit title"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') {
              cancelled.current = true;
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className={'title' + (todo.done ? ' done' : '')}
          onClick={start}
          aria-label={`Edit "${todo.title}"`}
        >
          {todo.title}
        </button>
      )}
      <button
        type="button"
        className="icon"
        onClick={onDelete}
        aria-label={`Delete "${todo.title}"`}
      >
        ✕
      </button>
    </li>
  );
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  useEffect(() => {
    run(async () => setTodos(await listTodos())).finally(() => setLoading(false));
  }, []);

  const add = () => {
    const title = text.trim();
    if (!title) return;
    run(async () => {
      const t = await createTodo(title);
      setTodos((l) => [t, ...l]);
      setText('');
      inputRef.current?.focus();
    });
  };

  const replace = (t: Todo) => setTodos((l) => l.map((x) => (x.id === t.id ? t : x)));
  const left = todos.filter((t) => !t.done).length;
  const shown = todos.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done));

  return (
    <main className="app">
      <h1>Todos</h1>
      <form
        className="add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          ref={inputRef}
          value={text}
          maxLength={200}
          placeholder="What needs to be done?"
          aria-label="New todo"
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="primary">
          Add
        </button>
      </form>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div className="bar">
        <div className="filters">
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'active' : ''}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}
            </button>
          ))}
        </div>
        <span className="count">
          {left} {left === 1 ? 'item' : 'items'} left
        </span>
      </div>

      {loading ? (
        <p className="state" role="status">
          Loading…
        </p>
      ) : shown.length === 0 ? (
        <p className="state">Nothing to do 🎉</p>
      ) : (
        <ul className="list">
          {shown.map((t) => (
            <Row
              key={t.id}
              todo={t}
              onToggle={() => run(async () => replace(await updateTodo(t.id, { done: !t.done })))}
              onSave={(title) => run(async () => replace(await updateTodo(t.id, { title })))}
              onDelete={() =>
                run(async () => {
                  await deleteTodo(t.id);
                  setTodos((l) => l.filter((x) => x.id !== t.id));
                })
              }
            />
          ))}
        </ul>
      )}
    </main>
  );
}
