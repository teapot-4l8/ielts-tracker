import { useState, useMemo, useEffect } from "react";
import {
  BookOpen, Headphones, Plus, Trash2, Check,
} from "lucide-react";
import { useStudyProgress } from "../hooks/useStudyProgress";
import { EventBus } from "../utils/eventBus";

// ── Step definitions ──────────────────────────────────────────────────────────

const L_STEPS = [
  { key: "done",      label: "Done",      color: "bg-blue-500"   },
  { key: "intensive", label: "Intensive", color: "bg-indigo-500" },
  { key: "shadowing", label: "Shadowing", color: "bg-violet-500" },
];

const R_STEPS = [
  { key: "done",   label: "Done",   color: "bg-emerald-500" },
  { key: "vocab",  label: "Vocab",  color: "bg-teal-500"   },
  { key: "review", label: "Review",  color: "bg-green-600"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function countChecked(items, steps) {
  let n = 0;
  for (const item of items)
    for (const s of steps)
      if (item[s.key]) n++;
  return n;
}

function totalSteps(items, steps) {
  return items.length * steps.length;
}

// ── Mini ring SVG ─────────────────────────────────────────────────────────────

function Ring({ ratio, color = "#6366f1", size = 30, stroke = 3 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(ratio, 1);
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.35s ease" }}
      />
    </svg>
  );
}

// ── Step badge (pill checkbox) ───────────────────────────────────────────────

function StepBadge({ checked, label, bgColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 select-none
        ${checked
          ? `${bgColor} text-white border-transparent shadow-sm scale-105`
          : "bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600"
        }`}
    >
      {checked && <Check className="w-3 h-3 flex-shrink-0" strokeWidth={3} />}
      {label}
    </button>
  );
}

// ── Single section / passage row ─────────────────────────────────────────────

function ItemRow({ rowLabel, steps, item, onToggle }) {
  const allDone = steps.every((s) => item[s.key]);
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${allDone ? "bg-slate-50" : "bg-white"}`}>
      <span className={`w-8 text-xs font-bold text-center flex-shrink-0
        ${allDone ? "text-slate-400 line-through" : "text-slate-600"}`}>
        {rowLabel}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s) => (
          <StepBadge
            key={s.key}
            checked={item[s.key]}
            label={s.label}
            bgColor={s.color}
            onClick={() => onToggle(s.key)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Subject block (Listening | Reading) ───────────────────────────────────────

function SubjectBlock({ title, Icon, items, steps, accent, rowPrefix, onToggle }) {
  const checked = countChecked(items, steps);
  const total   = totalSteps(items, steps);
  const allDone = checked === total;

  return (
    <div className={`rounded-xl border overflow-hidden
      ${allDone ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200 bg-white"}`}>
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${accent.iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${accent.iconColor}`} />
        </div>
        <span className={`text-sm font-semibold ${accent.text}`}>{title}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400 tabular-nums">{checked}/{total}</span>
          <Ring ratio={checked / total} color={accent.ring} size={26} stroke={2.5} />
        </div>
      </div>
      {/* rows */}
      <div className="px-2 py-1.5 space-y-0.5">
        {items.map((item, i) => (
          <ItemRow
            key={i}
            rowLabel={`${rowPrefix}${i + 1}`}
            steps={steps}
            item={item}
            onToggle={(step) => onToggle(step, i)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const AVAILABLE_BOOKS = Array.from({ length: 19 }, (_, i) => i + 4); // 4–22

export function StudyLog() {
  const { progress, toggleStep, getEntry, allEntries, deleteEntry, initEntry, setProgress } = useStudyProgress();

  // Re-load when another hook instance (e.g. App.jsx) writes to localStorage
  useEffect(() => {
    const reload = (updatedProgress) => setProgress(updatedProgress);
    const off = EventBus.on("study-progress-changed", reload);
    return off;
  }, []);

  const [selectedBook, setSelectedBook] = useState(4);
  const [selectedTest, setSelectedTest] = useState(1);

  // Collect all tests that have an entry for the selected book
  const testsForBook = useMemo(() => {
    return allEntries()
      .filter((e) => e.book === selectedBook)
      .map((e) => e.testNum)
      .sort((a, b) => a - b);
  }, [selectedBook, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const entry = getEntry(selectedBook, selectedTest);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAdd = () => initEntry(selectedBook, selectedTest);

  const handleDelete = () => {
    deleteEntry(selectedBook, selectedTest);
    setConfirmDelete(false);
  };

  const hasEntry = entry !== null;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800">Study Log</h3>
        <p className="text-sm text-slate-400 mt-0.5">Track your Listening & Reading progress step by step</p>
      </div>

      {/* Controls: Book dropdown + Test dropdown + Add + Delete */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        {/* Book selector */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBook}
            onChange={(e) => {
              const b = Number(e.target.value);
              setSelectedBook(b);
              const tests = allEntries()
                .filter((x) => x.book === b)
                .map((x) => x.testNum)
                .sort((a, b) => a - b);
              setSelectedTest(tests[0] ?? 1);
            }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-indigo-400 cursor-pointer"
          >
            {AVAILABLE_BOOKS.map((b) => (
              <option key={b} value={b}>Cambridge {b}</option>
            ))}
          </select>
        </div>

        {/* Test selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Test</span>
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-indigo-400 cursor-pointer"
          >
            {Array.from({ length: 4 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Delete */}
          {hasEntry && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete this test's study record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {/* Add / Go */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> {hasEntry ? "Reset" : "Add"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-blue-600">Listening:</span>
          {L_STEPS.map((s) => (
            <span key={s.key} className="flex items-center gap-1 text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-emerald-600">Reading:</span>
          {R_STEPS.map((s) => (
            <span key={s.key} className="flex items-center gap-1 text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      {!hasEntry ? (
        <div className="text-center py-14 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No entry for Cambridge {selectedBook} — Test {selectedTest}</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add" to create it</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SubjectBlock
            title="Listening"
            Icon={Headphones}
            items={entry.listening}
            steps={L_STEPS}
            rowPrefix="S"
            accent={{ iconBg: "bg-blue-100", iconColor: "text-blue-600", text: "text-blue-700", ring: "#3b82f6" }}
            onToggle={(step, idx) => toggleStep(selectedBook, selectedTest, "listening", idx, step)}
          />
          <SubjectBlock
            title="Reading"
            Icon={BookOpen}
            items={entry.reading}
            steps={R_STEPS}
            rowPrefix="P"
            accent={{ iconBg: "bg-emerald-100", iconColor: "text-emerald-600", text: "text-emerald-700", ring: "#10b981" }}
            onToggle={(step, idx) => toggleStep(selectedBook, selectedTest, "reading", idx, step)}
          />
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h4 className="text-lg font-bold text-slate-800">Delete study record</h4>
            <p className="text-slate-600 text-sm">
              Are you sure you want to delete all progress for{" "}
              <strong>Cambridge {selectedBook} — Test {selectedTest}</strong>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
