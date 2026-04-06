import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ielts_daily_todos";

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Schema stored in localStorage:
 * {
 *   lastDate: "YYYY-MM-DD",
 *   todos: [{ id, text, tag: "R"|"L"|"W"|"S"|null, done }]
 * }
 *
 * On load: if lastDate !== today → reset all done → false, update lastDate.
 */
export function useTodoList() {
  const [todos, setTodos] = useState([]);

  // ── bootstrap ───────────────────────────────────────────────
  useEffect(() => {
    const stored = loadData();
    const today  = todayStr();

    if (!stored) {
      saveData({ lastDate: today, todos: [] });
      setTodos([]);
      return;
    }

    let list = stored.todos ?? [];

    // new day → reset all done flags
    if (stored.lastDate !== today) {
      list = list.map((t) => ({ ...t, done: false }));
      saveData({ lastDate: today, todos: list });
    }

    setTodos(list);
  }, []);

  // ── helpers ──────────────────────────────────────────────────
  const persist = useCallback((list) => {
    setTodos(list);
    saveData({ lastDate: todayStr(), todos: list });
  }, []);

  // ── API ──────────────────────────────────────────────────────
  const addTodo = useCallback((text, tag = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    persist([...todos, { id: Date.now().toString(), text: trimmed, tag, done: false }]);
  }, [todos, persist]);

  const toggleTodo = useCallback((id) => {
    persist(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }, [todos, persist]);

  const editTodo = useCallback((id, newText, newTag) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    persist(todos.map((t) => t.id === id ? { ...t, text: trimmed, tag: newTag } : t));
  }, [todos, persist]);

  const deleteTodo = useCallback((id) => {
    persist(todos.filter((t) => t.id !== id));
  }, [todos, persist]);

  const clearDone = useCallback(() => {
    persist(todos.filter((t) => !t.done));
  }, [todos, persist]);

  return { todos, addTodo, toggleTodo, editTodo, deleteTodo, clearDone };
}
