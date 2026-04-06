import { useState, useEffect } from "react";
import {
  Headphones, BookOpen, PenTool, Mic, Save,
  ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { getListeningBand, getAcademicReadingBand, roundOverallIELTS } from "../utils/scoring";
import { WritingGrader } from "./WritingGrader";

const BOOKS = [...Array.from({ length: 18 }, (_, i) => i + 4), 22];

// Listening section max scores (10 each)
const L_SECTIONS = ["S1", "S2", "S3", "S4"];
const L_MAX = 10;

// Reading passage max scores: P1=13, P2=13, P3=14
const R_PASSAGES = ["P1", "P2", "P3"];
const R_MAX = [13, 13, 14];

/** Sum an array of string values, ignoring empty strings. Returns null if all empty. */
function sumParts(parts) {
  const filled = parts.filter((v) => v !== "");
  if (filled.length === 0) return null;
  return filled.reduce((acc, v) => acc + Number(v), 0);
}

/** Convert a stored value (number | null | undefined) to a string for an input field. */
function toField(v) {
  return v !== null && v !== undefined ? String(v) : "";
}

/**
 * ScoreInputForm – The "Record Test" tab.
 *
 * Props:
 *   records             – all saved records (for pre-fill lookup)
 *   onSave(record)      – called with a complete record object
 *   onAlert(msg, isErr) – toast handler
 */
export function ScoreInputForm({ records = [], onSave, onAlert }) {
  const [book, setBook] = useState(18);
  const [testNum, setTestNum] = useState(1);

  // Listening: 4 section fields + expand state
  const [lSections, setLSections] = useState(["", "", "", ""]);
  const [lExpanded, setLExpanded] = useState(true);

  // Reading: 3 passage fields + expand state
  const [rPassages, setRPassages] = useState(["", "", ""]);
  const [rExpanded, setRExpanded] = useState(true);

  const [readingTime, setReadingTime] = useState("");
  const [writingScore, setWritingScore] = useState("");
  const [speakingScore, setSpeakingScore] = useState("");

  const [isAIGrading, setIsAIGrading] = useState(false);
  const [writingTaskType, setWritingTaskType] = useState("Task 2");

  // ── Pre-fill when book / testNum changes ──────────────────────────────────
  // Find the existing record for the selected (book, testNum), if any.
  const existingRecord = records.find(
    (r) => r.book === book && r.testNum === testNum
  ) ?? null;

  // Whenever the selector changes, load existing data into form fields.
  useEffect(() => {
    if (existingRecord) {
      // Listening sections
      const ls = existingRecord.listeningSections;
      setLSections(
        Array.isArray(ls) ? ls.map(toField) : ["", "", "", ""]
      );
      // Reading passages
      const rp = existingRecord.readingPassages;
      setRPassages(
        Array.isArray(rp) ? rp.map(toField) : ["", "", ""]
      );
      setReadingTime(toField(existingRecord.readingTime));
      setWritingScore(toField(existingRecord.wBand));
      setSpeakingScore(toField(existingRecord.sBand));
    } else {
      // New test – clear form
      setLSections(["", "", "", ""]);
      setRPassages(["", "", ""]);
      setReadingTime("");
      setWritingScore("");
      setSpeakingScore("");
    }
    setIsAIGrading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, testNum]);

  // ── Derived band scores ───────────────────────────────────────────────────
  const listeningRaw = sumParts(lSections);
  const lBand = listeningRaw !== null ? getListeningBand(listeningRaw) : null;
  const lFilledSections = lSections.filter((v) => v !== "").length;

  const readingRaw = sumParts(rPassages);
  const rBand = readingRaw !== null ? getAcademicReadingBand(readingRaw) : null;
  const rFilledPassages = rPassages.filter((v) => v !== "").length;

  const wBand = writingScore !== "" ? Number(writingScore) : null;
  const sBand = speakingScore !== "" ? Number(speakingScore) : null;

  // At least one subject filled → can save
  const canSave = lBand !== null || rBand !== null || wBand !== null || sBand !== null;

  const filledBands = [lBand, rBand, wBand, sBand].filter((b) => b !== null);
  const overallBand =
    filledBands.length === 4
      ? roundOverallIELTS(filledBands.reduce((a, b) => a + b, 0) / 4)
      : null;

  const isUpdate = existingRecord !== null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const updateLSection = (i, val) => {
    const next = [...lSections];
    next[i] = val;
    setLSections(next);
  };

  const updateRPassage = (i, val) => {
    const next = [...rPassages];
    next[i] = val;
    setRPassages(next);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: existingRecord?.id ?? Date.now(),
      date: existingRecord?.date ?? new Date().toLocaleDateString(),
      timestamp: existingRecord?.timestamp ?? Date.now(),
      book,
      testNum,
      listeningSections: lSections.map((v) => (v !== "" ? Number(v) : null)),
      listeningRaw,
      lBand,
      readingPassages: rPassages.map((v) => (v !== "" ? Number(v) : null)),
      readingRaw,
      readingTime: readingTime ? Number(readingTime) : null,
      rBand,
      wBand,
      sBand,
      overallBand,
    });
    onAlert(
      isUpdate
        ? `Book ${book} Test ${testNum} updated successfully!`
        : "Record saved successfully!"
    );
  };

  const handleClearForm = () => {
    setLSections(["", "", "", ""]);
    setRPassages(["", "", ""]);
    setReadingTime("");
    setWritingScore("");
    setSpeakingScore("");
    setIsAIGrading(false);
  };

  return (
    <div className="space-y-6">
      {/* Book / Test selector + Overall Band display */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Cambridge Book
            </label>
            <select
              value={book}
              onChange={(e) => setBook(Number(e.target.value))}
              className="w-full md:w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              {BOOKS.map((b) => (
                <option key={b} value={b}>
                  Book {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Test Number
            </label>
            <select
              value={testNum}
              onChange={(e) => setTestNum(Number(e.target.value))}
              className="w-full md:w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 4].map((t) => (
                <option key={t} value={t}>
                  Test {t}
                </option>
              ))}
            </select>
          </div>

          {/* Existing record badge + clear button */}
          <div className="flex flex-col gap-1 mt-4 md:mt-5">
            {isUpdate ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                <RefreshCw className="w-3 h-3" />
                Updating existing record
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                New record
              </span>
            )}
            {isUpdate && (
              <button
                onClick={handleClearForm}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline text-left"
              >
                Clear all fields
              </button>
            )}
          </div>
        </div>

        <div className="bg-indigo-50 px-8 py-4 rounded-xl border border-indigo-100 text-center w-full md:w-auto">
          <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            Overall Band
          </p>
          <div className="text-4xl font-bold text-indigo-600">
            {overallBand !== null ? overallBand.toFixed(1) : "-.-"}
          </div>
          {filledBands.length > 0 && filledBands.length < 4 && (
            <p className="text-[11px] text-indigo-400 mt-1">
              {filledBands.length}/4 subjects
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Listening ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Headphones className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Listening</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[11px] text-slate-400">Total / Band</span>
                <span className="font-bold text-slate-700">
                  {listeningRaw !== null ? listeningRaw : "—"}
                  <span className="text-slate-400 font-normal"> / </span>
                  {lBand !== null ? lBand.toFixed(1) : "—"}
                </span>
              </div>
              <button
                onClick={() => setLExpanded((v) => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={lExpanded ? "Collapse sections" : "Expand sections"}
              >
                {lExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {lExpanded && (
            <div className="grid grid-cols-4 gap-3">
              {L_SECTIONS.map((label, i) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">
                    {label}
                    <span className="font-normal text-slate-400"> /{L_MAX}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={L_MAX}
                    value={lSections[i]}
                    onChange={(e) => updateLSection(i, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-center focus:ring-2 focus:ring-blue-400 outline-none text-slate-700 font-medium"
                    placeholder="—"
                  />
                  {lSections[i] !== "" && (
                    <p className="text-[10px] text-center text-slate-400 mt-0.5">
                      {lSections[i]}/{L_MAX}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {lFilledSections > 0 && lFilledSections < 4 && (
            <p className="text-[11px] text-blue-400 mt-3">
              {lFilledSections}/4 sections filled · total {listeningRaw}
            </p>
          )}
        </div>

        {/* ── Reading ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Reading</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[11px] text-slate-400">Total / Band</span>
                <span className="font-bold text-slate-700">
                  {readingRaw !== null ? readingRaw : "—"}
                  <span className="text-slate-400 font-normal"> / </span>
                  {rBand !== null ? rBand.toFixed(1) : "—"}
                </span>
              </div>
              <button
                onClick={() => setRExpanded((v) => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={rExpanded ? "Collapse passages" : "Expand passages"}
              >
                {rExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {rExpanded && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {R_PASSAGES.map((label, i) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">
                      {label}
                      <span className="font-normal text-slate-400"> /{R_MAX[i]}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={R_MAX[i]}
                      value={rPassages[i]}
                      onChange={(e) => updateRPassage(i, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-center focus:ring-2 focus:ring-emerald-400 outline-none text-slate-700 font-medium"
                      placeholder="—"
                    />
                    {rPassages[i] !== "" && (
                      <p className="text-[10px] text-center text-slate-400 mt-0.5">
                        {rPassages[i]}/{R_MAX[i]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Time used (mins, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 outline-none"
                  placeholder="e.g. 55"
                />
              </div>
            </>
          )}

          {rFilledPassages > 0 && rFilledPassages < 3 && (
            <p className="text-[11px] text-emerald-500 mt-3">
              {rFilledPassages}/3 passages filled · total {readingRaw}
            </p>
          )}
        </div>

        {/* ── Writing ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <PenTool className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Writing</h2>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              {["Task 1", "Task 2"].map((t) => (
                <button
                  key={t}
                  onClick={() => setWritingTaskType(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    writingTaskType === t
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsAIGrading(!isAIGrading)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md"
            >
              {isAIGrading ? "Manual Score Entry" : "Use AI Essay Grader"}
            </button>
          </div>

          {!isAIGrading ? (
            <div className="flex gap-4 items-end max-w-sm">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Writing Band (0–9)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  value={writingScore}
                  onChange={(e) => setWritingScore(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. 6.5"
                />
              </div>
            </div>
          ) : (
            <WritingGrader
              writingTaskType={writingTaskType}
              onScoreReady={(score) => setWritingScore(score)}
              onAlert={onAlert}
            />
          )}
        </div>

        {/* ── Speaking ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Speaking</h2>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Speaking Band (0–9)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={speakingScore}
                onChange={(e) => setSpeakingScore(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="e.g. 7.0"
              />
            </div>
          </div>
        </div>

        {/* ── Save button ── */}
        <div className="md:col-span-2 mt-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-sm ${
              canSave
                ? isUpdate
                  ? "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-md"
                  : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isUpdate ? (
              <><RefreshCw className="w-5 h-5" /> Update Test Record</>
            ) : (
              <><Save className="w-5 h-5" /> Save Test Record</>
            )}
          </button>
          {!canSave && (
            <p className="text-center text-sm text-slate-500 mt-2">
              Fill in at least one subject to save.
            </p>
          )}
          {canSave && filledBands.length < 4 && (
            <p className="text-center text-sm text-amber-500 mt-2">
              {isUpdate
                ? "Saving partial update — filled subjects will overwrite existing values."
                : "Saving partial record — Overall Band will be calculated once all 4 subjects are entered."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
