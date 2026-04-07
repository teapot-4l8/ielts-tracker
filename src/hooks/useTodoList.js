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
 * Schema:
 * {
 *   lastDate: "YYYY-MM-DD",
 *   todos: [{ id, text, tag, done, startedAt, pausedAt, accumulated, duration }]
 * }
 *
 * startedAt   : ms timestamp when timer last started/resumed
 * pausedAt    : ms timestamp when paused (null if running)
 * accumulated : seconds already accumulated before last pause
 * duration    : final recorded time when stopped
 *
 * Live elapsed = paused ? accumulated : accumulated + (Date.now() - startedAt)
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

    // new day → reset all
    if (stored.lastDate !== today) {
      list = list.map((t) => ({ ...t, done: false, startedAt: null, pausedAt: null, accumulated: 0, duration: 0 }));
      saveData({ lastDate: today, todos: list });
    }

    setTodos(list);
  }, []);

  // ── helpers ──────────────────────────────────────────────────
  const persist = useCallback((list) => {
    setTodos(list);
    saveData({ lastDate: todayStr(), todos: list });
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────
  const addTodo = useCallback((text, tag = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    persist([...todos, {
      id:          Date.now().toString(),
      text:        trimmed,
      tag,
      done:        false,
      startedAt:   null,
      pausedAt:    null,
      accumulated: 0,
      duration:    0,
    }]);
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

  // ── Timer API ────────────────────────────────────────────────
  /** Start a fresh timer */
  const startTimer = useCallback((id) => {
    persist(todos.map((t) => t.id === id
      ? { ...t, startedAt: Date.now(), pausedAt: null, accumulated: 0, duration: 0 }
      : t));
  }, [todos, persist]);

  /** Pause: freeze elapsed time, keep accumulated */
  const pauseTimer = useCallback((id) => {
    persist(todos.map((t) => {
      if (t.id !== id || t.pausedAt != null) return t;
      const acc = t.accumulated + Math.floor((Date.now() - t.startedAt) / 1000);
      return { ...t, pausedAt: Date.now(), accumulated: acc, startedAt: null };
    }));
  }, [todos, persist]);

  /** Resume from paused state */
  const resumeTimer = useCallback((id) => {
    persist(todos.map((t) => t.id === id && t.pausedAt != null
      ? { ...t, startedAt: Date.now(), pausedAt: null }
      : t));
  }, [todos, persist]);

  /** Stop: record final duration, mark done */
  const stopTimer = useCallback((id) => {
    persist(todos.map((t) => {
      if (t.id !== id) return t;
      const acc = t.pausedAt != null
        ? t.accumulated
        : t.accumulated + Math.floor((Date.now() - t.startedAt) / 1000);
      return { ...t, startedAt: null, pausedAt: null, accumulated: 0, duration: acc, done: true };
    }));
  }, [todos, persist]);

  /** Cancel: abandon timer without marking done */
  const cancelTimer = useCallback((id) => {
    persist(todos.map((t) => t.id === id
      ? { ...t, startedAt: null, pausedAt: null, accumulated: 0, duration: 0 }
      : t));
  }, [todos, persist]);

  return {
    todos,
    addTodo, toggleTodo, editTodo, deleteTodo, clearDone,
    startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer,
  };
}
