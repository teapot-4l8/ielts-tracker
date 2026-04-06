import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ielts_tracker_records";

/**
 * Custom hook for managing IELTS test records with localStorage persistence.
 *
 * Records are stored as a JSON array under the key "ielts_tracker_records".
 * Each record shape:
 * {
 *   id: number,          // Unix timestamp as unique ID
 *   date: string,        // Human-readable date string
 *   timestamp: number,   // Unix timestamp for sorting
 *   book: number,        // Cambridge book number
 *   testNum: number,
 *   listeningRaw: number,
 *   lBand: number,
 *   readingRaw: number,
 *   readingTime: number|null,
 *   rBand: number,
 *   wBand: number,
 *   sBand: number,
 *   overallBand: number,
 * }
 */
export function useRecords() {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever records change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn("Failed to persist records to localStorage:", e);
    }
  }, [records]);

  /**
   * Upsert a record by (book, testNum).
   * - If no existing record matches → insert as new.
   * - If a match exists → merge: new non-null fields overwrite old ones,
   *   null fields in the new record fall back to the old value.
   *   The record's `id` and `date`/`timestamp` stay as the original
   *   (so chart ordering is stable), but `updatedAt` is set to now.
   * Returns { isUpdate: boolean }.
   */
  const upsertRecord = useCallback((record) => {
    let isUpdate = false;
    setRecords((prev) => {
      const idx = prev.findIndex(
        (r) => r.book === record.book && r.testNum === record.testNum
      );
      if (idx === -1) {
        // Brand-new record
        return [record, ...prev];
      }
      isUpdate = true;
      const existing = prev[idx];
      // Merge: for each key in the new record, only overwrite if new value is not null/undefined
      const merged = { ...existing };
      for (const key of Object.keys(record)) {
        if (key === "id" || key === "date" || key === "timestamp") continue; // keep originals
        const newVal = record[key];
        if (newVal !== null && newVal !== undefined) {
          merged[key] = newVal;
        }
        // If newVal is null, keep existing value (don't overwrite with null)
      }
      merged.updatedAt = Date.now();
      // Recompute overallBand from merged bands
      const { lBand, rBand, wBand, sBand } = merged;
      const filled = [lBand, rBand, wBand, sBand].filter((b) => b !== null && b !== undefined);
      merged.overallBand = filled.length === 4
        ? (() => {
            const avg = filled.reduce((a, b) => a + b, 0) / 4;
            const whole = Math.floor(avg);
            const frac = avg - whole;
            if (frac < 0.25) return whole;
            if (frac < 0.75) return whole + 0.5;
            return whole + 1.0;
          })()
        : null;
      const updated = [...prev];
      updated[idx] = merged;
      return updated;
    });
    return { isUpdate };
  }, []);

  // Keep addRecord as an alias for compatibility
  const addRecord = upsertRecord;

  const deleteRecord = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setRecords([]);
  }, []);

  /**
   * Export all records as a downloadable JSON file.
   */
  const exportRecords = useCallback(() => {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ielts-records-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  /**
   * Import records from a JSON file, merging with existing (deduplication by id).
   * @param {File} file
   * @returns {Promise<number>} Number of newly added records
   */
  const importRecords = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error("Invalid format");
            setRecords((prev) => {
              const existingIds = new Set(prev.map((r) => r.id));
              const newOnes = imported.filter((r) => !existingIds.has(r.id));
              // Merge and re-sort by timestamp descending
              const merged = [...newOnes, ...prev].sort(
                (a, b) => b.timestamp - a.timestamp
              );
              resolve(newOnes.length);
              return merged;
            });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsText(file);
      }),
    []
  );

  return { records, addRecord, upsertRecord, deleteRecord, clearAll, exportRecords, importRecords };
}
