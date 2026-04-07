import { useState, useMemo } from "react";
import {
  BookOpen, Headphones, ChevronDown, ChevronRight,
  Plus, Trash2, Check,
} from "lucide-react";
import { useStudyProgress } from "../hooks/useStudyProgress";

// ── Step definitions ──────────────────────────────────────────────────────────

const L_STEPS = [
  { key: "done",      label: "Done",      color: "bg-blue-500"   },
  { key: "intensive", label: "Intensive", color: "bg-indigo-500" },
  { key: "shadowing", label: "Shadowing", color: "bg-violet-500" },
];

const R_STEPS = [
  { key: "done",   label: "Done",    color: "bg-emerald-500" },
  { key: "vocab",  label: "Vocab",   color: "bg-teal-500"   },
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

// ── Step badge (pill checkbox) ────────────────────────────────────────────────

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

// ── Subject block (Listening | Reading) ──────────────────────────────────────

function SubjectBlock({ title, Icon, items, steps, accent, rowPrefix, onToggle }) {
  const checked = countChecked(items, steps);
  const total   = totalSteps(items, steps);
  const allDone = checked === total;

  return (
    <div className={`rounded-xl border overflow-hidden
      ${allDone ? "border-slate-200 bg-slate-50/50" : "border-slate-200 bg-white"}`}>
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

// ── Test card ─────────────────────────────────────────────────────────────────

function TestCard({ book, testNum, entry, onToggleStep, onDelete }) {
  const [open, setOpen] = useState(true);

  const lChecked = countChecked(entry.listening, L_STEPS);
  const lTotal   = totalSteps(entry.listening, L_STEPS);
  const rChecked = countChecked(entry.reading, R_STEPS);
  const rTotal   = totalSteps(entry.reading, R_STEPS);
  const checked  = lChecked + rChecked;
  const total    = lTotal + rTotal;
  const allDone  = checked === total;

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden
      ${allDone ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200 bg-white"}`}>
      {/* card header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open
          ? <ChevronDown  className="w-4 h-4 text-slate-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        }
        <span className="font-bold text-slate-800">Test {testNum}</span>
        {allDone && (
          <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
            All done ✓
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400 tabular-nums">{checked}/{total}</span>
          <Ring ratio={checked / total} color={allDone ? "#6366f1" : "#94a3b8"} size={28} stroke={3} />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(book, testNum); }}
            className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            title="Delete this test's study record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* expanded */}
      {open && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100">
          <SubjectBlock
            title="Listening"
            Icon={Headphones}
            items={entry.listening}
            steps={L_STEPS}
            rowPrefix="S"
            accent={{ iconBg: "bg-blue-100", iconColor: "text-blue-600", text: "text-blue-700", ring: "#3b82f6" }}
            onToggle={(step, idx) => onToggleStep(book, testNum, "listening", idx, step)}
          />
          <SubjectBlock
            title="Reading"
            Icon={BookOpen}
            items={entry.reading}
            steps={R_STEPS}
            rowPrefix="P"
            accent={{ iconBg: "bg-emerald-100", iconColor: "text-emerald-600", text: "text-emerald-700", ring: "#10b981" }}
            onToggle={(step, idx) => onToggleStep(book, testNum, "reading", idx, step)}
          />
        </div>
      )}
    </div>
  );
}

// ── Book group ────────────────────────────────────────────────────────────────

function BookGroup({ book, tests, onToggleStep, onDelete }) {
  const [open, setOpen] = useState(true);

  const { checked, total } = useMemo(() => {
    let c = 0, t = 0;
    for (const { entry } of tests) {
      c += countChecked(entry.listening, L_STEPS) + countChecked(entry.reading, R_STEPS);
      t += totalSteps(entry.listening, L_STEPS)   + totalSteps(entry.reading, R_STEPS);
    }
    return { checked: c, total: t };
  }, [tests]);

  const allDone = total > 0 && checked === total;

  return (
    <div className="space-y-3">
      <button
        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border font-bold text-left transition-colors
          ${allDone
            ? "bg-indigo-50 border-indigo-200 text-indigo-800"
            : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
          }`}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="w-5 h-5 flex-shrink-0" /> : <ChevronRight className="w-5 h-5 flex-shrink-0" />}
        <span>Cambridge {book}</span>
        <span className="text-sm font-normal text-slate-400 ml-1">
          ({tests.length} test{tests.length > 1 ? "s" : ""})
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 tabular-nums">{checked}/{total}</span>
          <Ring ratio={total > 0 ? checked / total : 0} color={allDone ? "#6366f1" : "#94a3b8"} size={32} stroke={3} />
        </div>
      </button>

      {open && (
        <div className="pl-4 space-y-3">
          {tests.map(({ testNum, entry }) => (
            <TestCard
              key={testNum}
              book={book}
              testNum={testNum}
              entry={entry}
              onToggleStep={onToggleStep}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add entry form ────────────────────────────────────────────────────────────

function AddEntryForm({ onAdd }) {
  const [book,    setBook]    = useState(18);
  const [testNum, setTestNum] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
      <span className="text-sm font-semibold text-slate-600">Add study entry:</span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Book</label>
        <input
          type="number" min={1} max={20} value={book}
          onChange={(e) => setBook(e.target.value)}
          className="w-16 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center outline-none focus:border-indigo-400 bg-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Test</label>
        <input
          type="number" min={1} max={4} value={testNum}
          onChange={(e) => setTestNum(e.target.value)}
          className="w-14 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center outline-none focus:border-indigo-400 bg-white"
        />
      </div>
      <button
        onClick={() => onAdd(Number(book), Number(testNum))}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" /> Add
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StudyLog() {
  const { progress, toggleStep, getEntry, allEntries, deleteEntry, initEntry } = useStudyProgress();
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Group entries by book
  const grouped = useMemo(() => {
    const map = {};
    for (const { book, testNum } of allEntries()) {
      if (!map[book]) map[book] = [];
      map[book].push({ testNum, entry: getEntry(book, testNum) });
    }
    return map;
  }, [progress]);  // eslint-disable-line react-hooks/exhaustive-deps

  const books = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const handleAdd = (book, testNum) => {
    initEntry(book, testNum);
  };

  const handleDelete = (book, testNum) => setConfirmDelete({ book, testNum });

  const confirmDel = () => {
    if (confirmDelete) {
      deleteEntry(confirmDelete.book, confirmDelete.testNum);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800">Study Log</h3>
        <p className="text-sm text-slate-400 mt-0.5">Track your Listening & Reading progress step by step for each test</p>
      </div>

      {/* Add form */}
      <AddEntryForm onAdd={handleAdd} />

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
      {books.length === 0 ? (
        <div className="text-center py-14 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No study entries yet</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add" above to create your first entry</p>
        </div>
      ) : (
        <div className="space-y-6">
          {books.map((book) => (
            <BookGroup
              key={book}
              book={book}
              tests={grouped[book]}
              onToggleStep={toggleStep}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h4 className="text-lg font-bold text-slate-800">Delete study record</h4>
            <p className="text-slate-600 text-sm">
              Are you sure you want to delete all progress for{" "}
              <strong>Cambridge {confirmDelete.book} — Test {confirmDelete.testNum}</strong>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDel}
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
