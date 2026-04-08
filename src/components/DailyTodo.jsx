import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, CheckCheck, Play, Square, Pause, RotateCcw } from "lucide-react";
import { useTodoList } from "../hooks/useTodoList";

const TAGS = [
  { key: "R", label: "Reading",   color: "bg-blue-100 text-blue-700 border-blue-200"   },
  { key: "L", label: "Listening",  color: "bg-green-100 text-green-700 border-green-200" },
  { key: "W", label: "Writing",   color: "bg-amber-100 text-amber-700 border-amber-200"},
  { key: "S", label: "Speaking",  color: "bg-purple-100 text-purple-700 border-purple-200"},
];

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

// ── format seconds → "mm:ss" or "h:mm:ss" ─────────────────
function fmtTime(seconds) {
  const h   = Math.floor(seconds / 3600);
  const m   = Math.floor((seconds % 3600) / 60);
  const s   = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Tag badge ────────────────────────────────────────────────
function TagBadge({ tag }) {
  const t = TAGS.find((x) => x.key === tag);
  if (!t) return null;
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold ${t.color}`}>
      {tag}
    </span>
  );
}

// ── Live ticker (for in-progress / paused tasks) ────────────
function LiveTicker({ startedAt, pausedAt, accumulated, onPause, onResume, onStop }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (pausedAt != null) {
      setElapsed(accumulated);
      return;
    }
    const tick = () => setElapsed(accumulated + Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, pausedAt, accumulated]);

  const paused = pausedAt != null;

  return (
    <div className="flex items-center gap-2 ml-auto">
      {/* Pulsing dot (only when running) */}
      {paused ? (
        <span className="flex w-2 h-2 rounded-full bg-amber-400" />
      ) : (
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
        </span>
      )}

      {/* Elapsed time */}
      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          paused ? "text-amber-500" : "text-red-500"
        }`}
      >
        {fmtTime(elapsed)}
      </span>

      {/* Pause / Resume */}
      {paused ? (
        <button
          onClick={onResume}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" /> Resume
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
        >
          <Pause className="w-3 h-3" /> Pause
        </button>
      )}

      {/* Stop */}
      <button
        onClick={onStop}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
      >
        <Square className="w-3 h-3 fill-current" /> Stop
      </button>
    </div>
  );
}

// ── Todo item ───────────────────────────────────────────────
function TodoItem({ todo, onToggle, onEdit, onDelete, onStart, onPause, onResume, onStop, onCancel }) {
  const [editing, setEditing]  = useState(false);
  const [draft, setDraft]      = useState(todo.text);
  const [draftTag, setDraftTag] = useState(todo.tag);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commitEdit = () => {
    if (draft.trim()) onEdit(todo.id, draft, draftTag);
    else setDraft(todo.text);
    setEditing(false);
  };

  const cancelEdit = () => { setDraft(todo.text); setDraftTag(todo.tag); setEditing(false); };

  const isRunning = todo.startedAt != null || todo.pausedAt != null;
  const isPaused  = todo.pausedAt != null;
  const isDone    = todo.done;

  return (
    <li
      className={`group flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-150
        ${isPaused
          ? "bg-amber-50 border-amber-200"
          : isRunning
            ? "bg-red-50 border-red-200"
            : isDone
              ? "bg-slate-50 border-slate-100"
              : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"}`}
    >
      {/* Checkbox (idle or done, no timer) */}
      {!isRunning && (
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
            ${isDone
              ? "bg-indigo-500 border-indigo-500"
              : "border-slate-300 hover:border-indigo-400"}`}
        >
          {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
      )}

      {/* Running state → timer controls replace checkbox area */}
      {isRunning && (
        <LiveTicker
          startedAt={todo.startedAt}
          pausedAt={todo.pausedAt}
          accumulated={todo.accumulated}
          onPause={() => onPause(todo.id)}
          onResume={() => onResume(todo.id)}
          onStop={() => onStop(todo.id)}
        />
      )}

      {/* Tag badge */}
      <TagBadge tag={todo.tag} />

      {/* Text / edit input */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
          className="flex-1 min-w-0 text-sm bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-300"
        />
      ) : (
        <span
          className={`flex-1 min-w-0 text-sm transition-colors truncate
            ${isDone  ? "line-through text-slate-400" : "text-slate-700"}`}
          onDoubleClick={() => !isDone && !isRunning && setEditing(true)}
        >
          {todo.text}
          {/* Completed with duration */}
          {isDone && todo.duration > 0 && (
            <span className="ml-2 font-mono text-xs text-indigo-400 not-italic">
              ({fmtTime(todo.duration)})
            </span>
          )}
        </span>
      )}

      {/* Action buttons */}
      {editing ? (
        <div className="flex gap-1 items-center ml-auto">
          <div className="flex gap-1">
            <button onClick={() => setDraftTag(null)}  className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center ${draftTag === null ? "bg-slate-300 text-slate-600 border-slate-400" : "border-slate-200 text-slate-300"}`}>×</button>
            {TAGS.map((t) => (
              <button key={t.key} onClick={() => setDraftTag(t.key)}
                className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center ${draftTag === t.key ? t.color.replace("100","300") : "border-slate-200 text-slate-300"}`}>
                {t.key}
              </button>
            ))}
          </div>
          <button onClick={commitEdit}  className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50"><Check className="w-4 h-4"/></button>
          <button onClick={cancelEdit}  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4"/></button>
        </div>
      ) : (
        <div className="flex gap-1 ml-auto">
          {/* Start button (idle, not done) */}
          {!isRunning && !isDone && (
            <button
              onClick={() => onStart(todo.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              title="Start timer"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}
          {/* Cancel timer button (running) */}
          {isRunning && (
            <button
              onClick={() => onCancel(todo.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xs"
              title="Cancel timer"
            >
              ×
            </button>
          )}
          {/* Edit (idle only) */}
          {!isDone && !isRunning && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {/* Delete */}
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </li>
  );
}

// ── Main ─────────────────────────────────────────────────────
export function DailyTodo() {
  const {
    todos, addTodo, toggleTodo, editTodo, deleteTodo, clearDone,
    startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer,
  } = useTodoList();

  const [input, setInput]         = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const inputRef                  = useRef(null);

  const handleAdd = () => {
    addTodo(input, selectedTag);
    setInput("");
    setSelectedTag(null);
    inputRef.current?.focus();
  };

  const filteredTodos = todos.filter((t) => filterTag === null || t.tag === filterTag);
  const pending       = filteredTodos.filter((t) => !t.done);
  const done          = filteredTodos.filter((t) => t.done);
  const allDone       = todos.length > 0 && todos.filter((t) => !t.done).length === 0;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daily Tasks</h2>
          <p className="text-xs text-slate-400 mt-0.5">{todayLabel()} · resets each day</p>
        </div>
        {done.length > 0 && (
          <button onClick={clearDone} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset done
          </button>
        )}
      </div>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{done.length} / {todos.length} completed</span>
            <span>{Math.round((done.length / todos.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(done.length / todos.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Tag filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-slate-400">Filter:</span>
        <button onClick={() => setFilterTag(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${filterTag === null ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"}`}>
          All
        </button>
        {TAGS.map((t) => (
          <button key={t.key} onClick={() => setFilterTag(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors
              ${filterTag === t.key ? t.color.replace("100","200").replace("700","800") : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"}`}>
            {t.key} {t.label}
          </button>
        ))}
      </div>

      {/* Add section */}
      <div className="flex flex-col gap-2">
        {/* Tag selector */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-400">Tag:</span>
          <button onClick={() => setSelectedTag(null)}
            className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center ${selectedTag === null ? "bg-slate-300 text-slate-600 border-slate-400" : "border-slate-200 text-slate-300"}`}>—</button>
          {TAGS.map((t) => (
            <button key={t.key} onClick={() => setSelectedTag(t.key === selectedTag ? null : t.key)}
              className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center
                ${selectedTag === t.key ? t.color.replace("100","200").replace("700","800") : "border-slate-200 text-slate-400"}`}>
              {t.key}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          {selectedTag && <div className="flex-shrink-0"><TagBadge tag={selectedTag} /></div>}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a task… (Enter to confirm)"
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors"
          />
          <button onClick={handleAdd} disabled={!input.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <CheckCheck className="w-4 h-4" /> All done for today! Great work 🎉
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((t) => (
            <TodoItem key={t.id} todo={t}
              onToggle={toggleTodo} onEdit={editTodo} onDelete={deleteTodo}
              onStart={startTimer} onPause={pauseTimer} onResume={resumeTimer} onStop={stopTimer} onCancel={cancelTimer} />
          ))}
        </ul>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Completed</p>
          <ul className="flex flex-col gap-2">
            {done.map((t) => (
              <TodoItem key={t.id} todo={t}
                onToggle={toggleTodo} onEdit={editTodo} onDelete={deleteTodo}
                onStart={startTimer} onPause={pauseTimer} onResume={resumeTimer} onStop={stopTimer} onCancel={cancelTimer} />
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-300">
          <CheckCheck className="w-12 h-12" />
          <p className="text-sm">No tasks yet — add one above</p>
        </div>
      )}
    </div>
  );
}
