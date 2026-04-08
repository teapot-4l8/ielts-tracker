import { useState } from "react";
import {
  BarChart2, ClipboardList,
  Clock, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { ProgressLineChart } from "./ProgressLineChart";
import { StudyLog } from "./StudyLog";

/** Four-subject colour palette */
const SUBJECT_SERIES = [
  { key: "lBand",  label: "Listening", color: "#3b82f6" }, // blue
  { key: "rBand",  label: "Reading",   color: "#10b981" }, // emerald
  { key: "wBand",  label: "Writing",   color: "#f97316" }, // orange
  { key: "sBand",  label: "Speaking",  color: "#a855f7" }, // purple
];

/**
 * ProgressDashboard – The "My Progress" tab.
 *
 * Props:
 *   records          – array of saved test records
 *   onDeleteRecord   – (id) => void
 *   onClearAll       – () => void
 *   onAlert          – (msg, isError) => void
 */
export function ProgressDashboard({
  records,
  onDeleteRecord,
  onClearAll,
  onAlert,
}) {
  const [filterBook, setFilterBook] = useState("All");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [sortMode, setSortMode] = useState("time"); // "time" | "book"
  const [sortDir, setSortDir] = useState("desc");    // "asc"  | "desc"

  const filteredRecords =
    filterBook === "All"
      ? records
      : records.filter((r) => r.book === Number(filterBook));

  // Sort records for the table
  const tableRecords = [...filteredRecords].sort((a, b) => {
    let cmp = 0;
    if (sortMode === "time") {
      cmp = a.timestamp - b.timestamp;
    } else {
      cmp = a.book - b.book || a.testNum - b.testNum;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Sort by book → testNum for chart x-axis
  const chartRecords = [...records].sort(
    (a, b) => a.book - b.book || a.testNum - b.testNum
  );

  // X-axis labels e.g. "C4-T1", "C4-T2"
  const labels = chartRecords.map((r) => `C${r.book}-T${r.testNum}`);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const subjectSeries = SUBJECT_SERIES.map((s) => ({
    label: s.label,
    color: s.color,
    data: chartRecords.map((r) => r[s.key] ?? null),
    dates: chartRecords.map((r) => r.date ?? ""),
  }));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    onClearAll();
    setShowConfirmClear(false);
    onAlert("All records cleared.");
  };

  return (
    <div className="space-y-6">

      {/* ── Row 0: Study Log ──────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <StudyLog />
      </div>

      {/* ── Row 1: Stats ──────────────────────────────────────────────────── */}
      <div>
        <StatCard
          label="Total Tests"
          value={records.length}
          colorClass="text-slate-700"
          bgClass="bg-slate-50"
          icon={<ClipboardList className="w-6 h-6" />}
        />
      </div>

      {/* ── Row 2: Four-subject trend ──────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg font-bold text-slate-800">
            Subject Score Trends
          </h3>
          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {SUBJECT_SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-slate-500 font-medium">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ProgressLineChart labels={labels} series={subjectSeries} />
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Lines skip subjects not recorded in a given attempt.
        </p>
      </div>

      {/* ── Row 3: Detailed records table ──────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Detailed Records</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Filter:</label>
              <select
                value={filterBook}
                onChange={(e) => setFilterBook(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 text-sm"
              >
                <option value="All">All Books</option>
                {Array.from(new Set(records.map((r) => r.book)))
                  .sort((a, b) => a - b)
                  .map((b) => (
                    <option key={b} value={b}>Book {b}</option>
                  ))}
              </select>
            </div>

            {/* Sort mode toggle */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setSortMode("time")}
                title="Sort by date"
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  sortMode === "time"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Time
              </button>
              <button
                onClick={() => setSortMode("book")}
                title="Sort by book & test number"
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  sortMode === "book"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Book
              </button>
            </div>

            {/* Direction toggle */}
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title={sortDir === "asc" ? "Ascending (oldest/earliest first)" : "Descending (newest/latest first)"}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {sortDir === "asc" ? (
                <>
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-xs">Asc</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-xs">Desc</span>
                </>
              )}
            </button>

            {/* Clear all */}
            {records.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                title="Clear all records"
                className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}

            {/* Confirmation modal */}
            {showConfirmClear && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowConfirmClear(false)}
                />
                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Clear all records?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    This will permanently delete all your test records. This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      Yes, clear all
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {records.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-600">No records yet</h3>
            <p className="text-sm text-slate-400 mt-1">
              Record a test to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Book/Test</th>
                  <th className="p-4 font-semibold text-center text-blue-700">List.</th>
                  <th className="p-4 font-semibold text-center text-emerald-700">Read.</th>
                  <th className="p-4 font-semibold text-center text-orange-700">Writ.</th>
                  <th className="p-4 font-semibold text-center text-purple-700">Speak.</th>
                  <th className="p-4 font-semibold text-center text-indigo-700 bg-indigo-50">Overall</th>
                  <th className="p-4 font-semibold text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-500">{record.date}</td>
                    <td className="p-4 font-medium text-slate-800">
                      Cam {record.book}{" "}
                      <span className="text-slate-400 text-sm font-normal">
                        T{record.testNum}
                      </span>
                    </td>

                    {/* Listening */}
                    <td className="p-4 text-center">
                      {record.lBand !== null && record.lBand !== undefined ? (
                        <div className="group relative inline-block">
                          <span className="font-semibold text-blue-800 cursor-default underline decoration-dotted decoration-blue-300">
                            {record.lBand.toFixed(1)}
                          </span>
                          {/* Section tooltip */}
                          {Array.isArray(record.listeningSections) && record.listeningSections.some((v) => v !== null) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-start bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap gap-1 min-w-[110px]">
                              <span className="font-semibold text-slate-300 mb-0.5">Sections</span>
                              {record.listeningSections.map((v, i) => (
                                <span key={i} className="flex justify-between w-full gap-3">
                                  <span className="text-slate-400">S{i + 1}</span>
                                  <span className="font-medium">{v !== null ? `${v}/10` : "—"}</span>
                                </span>
                              ))}
                              <span className="border-t border-slate-600 w-full mt-1 pt-1 flex justify-between">
                                <span className="text-slate-400">Total</span>
                                <span className="font-bold">{record.listeningRaw}/40</span>
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Reading */}
                    <td className="p-4 text-center">
                      {record.rBand !== null && record.rBand !== undefined ? (
                        <div className="group relative inline-block">
                          <span className="font-semibold text-emerald-800 cursor-default underline decoration-dotted decoration-emerald-300">
                            {record.rBand.toFixed(1)}
                          </span>
                          {/* Passage tooltip */}
                          {Array.isArray(record.readingPassages) && record.readingPassages.some((v) => v !== null) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-start bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap gap-1 min-w-[110px]">
                              <span className="font-semibold text-slate-300 mb-0.5">Passages</span>
                              {record.readingPassages.map((v, i) => (
                                <span key={i} className="flex justify-between w-full gap-3">
                                  <span className="text-slate-400">P{i + 1}</span>
                                  <span className="font-medium">{v !== null ? `${v}/${[13,13,14][i]}` : "—"}</span>
                                </span>
                              ))}
                              <span className="border-t border-slate-600 w-full mt-1 pt-1 flex justify-between">
                                <span className="text-slate-400">Total</span>
                                <span className="font-bold">{record.readingRaw}/40</span>
                              </span>
                            </div>
                          )}
                          {record.readingTime && (
                            <span className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5 mt-0.5">
                              <Clock className="w-3 h-3" /> {record.readingTime}m
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Writing */}
                    <td className="p-4 text-center">
                      {record.wBand !== null && record.wBand !== undefined ? (
                        <span className="font-semibold text-orange-800">
                          {record.wBand.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Speaking */}
                    <td className="p-4 text-center">
                      {record.sBand !== null && record.sBand !== undefined ? (
                        <span className="font-semibold text-purple-800">
                          {record.sBand.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Overall */}
                    <td className="p-4 text-center bg-indigo-50/50">
                      {record.overallBand !== null && record.overallBand !== undefined ? (
                        <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">
                          {record.overallBand.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        title="Delete this record"
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small reusable stat card. */
function StatCard({ label, value, colorClass, bgClass, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-400 uppercase">{label}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      </div>
      <div className={`${bgClass} p-3 rounded-full ${colorClass}`}>{icon}</div>
    </div>
  );
}
