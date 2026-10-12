export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

const RAW = ((import.meta.env.VITE_API_URL as string | undefined) || '/api').replace(/\/+$/, '');
// Accept both "http://host:8080" and "http://host:8080/api"
const BASE = RAW.endsWith('/api') ? RAW : RAW + '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new Error('Network error');
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      msg = (await res.json()).error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const listTodos = () => request<Todo[]>('/todos');
export const createTodo = (title: string) =>
  request<Todo>('/todos', { method: 'POST', body: JSON.stringify({ title }) });
export const updateTodo = (id: number, patch: { title?: string; done?: boolean }) =>
  request<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const deleteTodo = (id: number) => request<void>(`/todos/${id}`, { method: 'DELETE' });
