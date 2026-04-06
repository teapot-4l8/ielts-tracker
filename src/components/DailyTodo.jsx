import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, CheckCheck } from "lucide-react";
import { useTodoList } from "../hooks/useTodoList";

const TAGS = [
  { key: "R", label: "Reading",  color: "bg-blue-100 text-blue-700 border-blue-200"  },
  { key: "L", label: "Listening", color: "bg-green-100 text-green-700 border-green-200"},
  { key: "W", label: "Writing",  color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "S", label: "Speaking", color: "bg-purple-100 text-purple-700 border-purple-200"},
];

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Tag badge ────────────────────────────────────────────────
function TagBadge({ tag, size = "sm" }) {
  const t = TAGS.find((x) => x.key === tag);
  if (!t) return null;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold
        ${t.color}
        ${size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}`}
    >
      {tag}
    </span>
  );
}

// ── Inline-editable todo item ────────────────────────────────
function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(todo.text);
  const [draftTag, setDraftTag] = useState(todo.tag);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    if (draft.trim()) onEdit(todo.id, draft, draftTag);
    else setDraft(todo.text);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(todo.text);
    setDraftTag(todo.tag);
    setEditing(false);
  };

  return (
    <li
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150
        ${todo.done
          ? "bg-slate-50 border-slate-100"
          : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${todo.done
            ? "bg-indigo-500 border-indigo-500"
            : "border-slate-300 hover:border-indigo-400"}`}
      >
        {todo.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>

      {/* Tag */}
      <TagBadge tag={todo.tag} />

      {/* Text / edit input */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="flex-1 text-sm bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-300"
        />
      ) : (
        <span
          className={`flex-1 text-sm transition-colors ${todo.done ? "line-through text-slate-400" : "text-slate-700"}`}
          onDoubleClick={() => !todo.done && setEditing(true)}
        >
          {todo.text}
        </span>
      )}

      {/* Action buttons */}
      {editing ? (
        <div className="flex gap-1 items-center">
          {/* Tag selector in edit mode */}
          <div className="flex gap-1">
            <button
              onClick={() => setDraftTag(null)}
              className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-colors
                ${draftTag === null ? "bg-slate-300 text-slate-600 border-slate-400" : "border-slate-200 text-slate-300 hover:border-slate-400"}`}
              title="No tag"
            >
              ×
            </button>
            {TAGS.map((t) => (
              <button
                key={t.key}
                onClick={() => setDraftTag(t.key)}
                className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-colors
                  ${draftTag === t.key ? t.color.replace("100", "300").replace("700", "800") : "border-slate-200 text-slate-300 hover:border-slate-400"}`}
              >
                {t.key}
              </button>
            ))}
          </div>
          <button
            onClick={commitEdit}
            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-1">
          {!todo.done && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
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

// ── Main component ───────────────────────────────────────────
export function DailyTodo() {
  const { todos, addTodo, toggleTodo, editTodo, deleteTodo, clearDone } = useTodoList();
  const [input, setInput]       = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const inputRef                = useRef(null);

  // Tag filter
  const [filterTag, setFilterTag] = useState(null);

  const handleAdd = () => {
    addTodo(input, selectedTag);
    setInput("");
    setSelectedTag(null);
    inputRef.current?.focus();
  };

  const pending   = todos.filter((t) => !t.done && (filterTag === null || t.tag === filterTag));
  const done      = todos.filter((t) => t.done  && (filterTag === null || t.tag === filterTag));
  const allDone   = todos.length > 0 && todos.filter((t) => !t.done).length === 0;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daily Tasks</h2>
          <p className="text-xs text-slate-400 mt-0.5">{todayLabel()} · resets each day</p>
        </div>
        {done.length > 0 && (
          <button
            onClick={clearDone}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear done
          </button>
        )}
      </div>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{todos.filter((t) => t.done).length} / {todos.length} completed</span>
            <span>{Math.round((todos.filter((t) => t.done).length / todos.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(todos.filter((t) => t.done).length / todos.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tag filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-slate-400">Filter:</span>
        <button
          onClick={() => setFilterTag(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${filterTag === null ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"}`}
        >
          All
        </button>
        {TAGS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterTag(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors
              ${filterTag === t.key ? t.color.replace("100", "200").replace("700", "800") : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"}`}
          >
            {t.key} {t.label}
          </button>
        ))}
      </div>

      {/* Add input + tag selector */}
      <div className="flex flex-col gap-2">
        {/* Tag selector */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-400">Tag:</span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center transition-colors
              ${selectedTag === null ? "bg-slate-300 text-slate-600 border-slate-400" : "border-slate-200 text-slate-300 hover:border-slate-400"}`}
            title="No tag"
          >
            —
          </button>
          {TAGS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedTag(t.key === selectedTag ? null : t.key)}
              className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center transition-colors
                ${selectedTag === t.key ? t.color.replace("100", "200").replace("700", "800") : "border-slate-200 text-slate-400 hover:border-indigo-300"}`}
            >
              {t.key}
            </button>
          ))}
        </div>

        {/* Text input row */}
        <div className="flex gap-2">
          {selectedTag && (
            <div className="flex-shrink-0 flex items-center">
              <TagBadge tag={selectedTag} size="sm" />
            </div>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a task… (Enter to confirm)"
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border-2 border-slate-200
              focus:border-indigo-400 focus:outline-none focus:ring-0 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium
              bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <CheckCheck className="w-4 h-4" />
          All done for today! Great work 🎉
        </div>
      )}

      {/* Pending list */}
      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={toggleTodo}
              onEdit={editTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}

      {/* Completed list */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Completed</p>
          <ul className="flex flex-col gap-2">
            {done.map((t) => (
              <TodoItem
                key={t.id}
                todo={t}
                onToggle={toggleTodo}
                onEdit={editTodo}
                onDelete={deleteTodo}
              />
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
