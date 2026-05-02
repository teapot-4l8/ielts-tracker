/**
 * Unified data export / import for all IELTS Tracker localStorage datasets.
 *
 * localStorage keys managed here:
 *   - "ielts_tracker_records"   → test score records
 *   - "ielts_study_progress"   → Study Log progress
 *   - "ielts_daily_todos"      → Daily Tasks
 */

const KEYS = {
  RECORDS:       "ielts_tracker_records",
  STUDY_PROGRESS:"ielts_study_progress",
  DAILY_TODOS:   "ielts_daily_todos",
};

/** Fetch all three datasets from public/data/records.json (served by Vite dev-server plugin). */
export async function fetchAll() {
  try {
    const res = await fetch('/data/records.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null // no file yet — fall back to localStorage defaults
  }
}

/**
 * Persist all three datasets to public/data/records.json via the Vite dev-server API.
 * Call this whenever any dataset changes so the file stays in sync.
 */
export async function saveAll() {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    records:       JSON.parse(localStorage.getItem(KEYS.RECORDS)       || "null"),
    studyProgress: JSON.parse(localStorage.getItem(KEYS.STUDY_PROGRESS)|| "null"),
    dailyTodos:    JSON.parse(localStorage.getItem(KEYS.DAILY_TODOS)  || "null"),
  }
  try {
    await fetch('/data/records.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn('Failed to auto-save to file:', e)
  }
}

/** Export all three datasets as a single JSON file download. */
export function exportAll() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records:       JSON.parse(localStorage.getItem(KEYS.RECORDS)       || "null"),
    studyProgress: JSON.parse(localStorage.getItem(KEYS.STUDY_PROGRESS)|| "null"),
    dailyTodos:    JSON.parse(localStorage.getItem(KEYS.DAILY_TODOS)  || "null"),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `ielts-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import all three datasets from a JSON file.
 * Merges with existing localStorage data:
 *   - records:       deduplicated by id
 *   - studyProgress: shallow-merged by key (book-testNum)
 *   - dailyTodos:    deduplicated by id
 *
 * Returns { recordsAdded, progressMerged, todosMerged } counts.
 */
export function importAll(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (typeof data !== "object" || data === null) {
          throw new Error("Invalid file format");
        }

        let recordsAdded    = 0;
        let progressMerged  = 0;
        let todosMerged     = 0;

        // ── 1. Records ───────────────────────────────────────────────
        if (Array.isArray(data.records)) {
          const existing = JSON.parse(
            localStorage.getItem(KEYS.RECORDS) || "[]"
          );
          const existingIds = new Set(existing.map((r) => r.id));
          const newRecords   = data.records.filter((r) => !existingIds.has(r.id));
          recordsAdded = newRecords.length;
          const merged = [...newRecords, ...existing].sort(
            (a, b) => b.timestamp - a.timestamp
          );
          localStorage.setItem(KEYS.RECORDS, JSON.stringify(merged));
        }

        // ── 2. Study Progress ────────────────────────────────────────
        if (data.studyProgress && typeof data.studyProgress === "object") {
          const existing = JSON.parse(
            localStorage.getItem(KEYS.STUDY_PROGRESS) || "{}"
          );
          for (const key of Object.keys(data.studyProgress)) {
            if (data.studyProgress[key]) {
              if (!existing[key]) {
                existing[key] = data.studyProgress[key];
                progressMerged++;
              } else {
                // Merge: each step in imported wins if it's true and existing is false
                const imp = data.studyProgress[key];
                const ext = existing[key];
                for (const subj of ["listening", "reading"]) {
                  if (Array.isArray(imp[subj]) && Array.isArray(ext[subj])) {
                    for (let i = 0; i < ext[subj].length; i++) {
                      if (imp[subj][i]) {
                        ext[subj][i] = { ...ext[subj][i], ...imp[subj][i] };
                      }
                    }
                  }
                }
              }
            }
          }
          localStorage.setItem(KEYS.STUDY_PROGRESS, JSON.stringify(existing));
        }

        // ── 3. Daily Todos ───────────────────────────────────────────
        if (data.dailyTodos && typeof data.dailyTodos === "object") {
          const existingTodos = data.dailyTodos.todos || [];
          const existingIds    = new Set(existingTodos.map((t) => t.id));
          const newTodos       = (data.dailyTodos.todos || []).filter(
            (t) => !existingIds.has(t.id)
          );
          todosMerged = newTodos.length;
          // Keep the more recent lastDate
          const mergedTodos = [...newTodos, ...existingTodos];
          const lastDate    =
            data.dailyTodos.lastDate > existingTodos.lastDate
              ? data.dailyTodos.lastDate
              : existingTodos.lastDate;
          localStorage.setItem(
            KEYS.DAILY_TODOS,
            JSON.stringify({ lastDate, todos: mergedTodos })
          );
        }

        resolve({ recordsAdded, progressMerged, todosMerged });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });
}
