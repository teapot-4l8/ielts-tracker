import { EventBus } from "../utils/eventBus";

/**
 * Manages per-section / per-passage study progress, stored separately from
 * test-score records so either dataset can evolve independently.
 *
 * Schema (localStorage key: "ielts_study_progress"):
 * {
 *   "8-1": {          // key = `${book}-${testNum}`
 *     listening: [
 *       { done: false, intensive: false, shadowing: false },  // S1
 *       { done: false, intensive: false, shadowing: false },  // S2
 *       { done: false, intensive: false, shadowing: false },  // S3
 *       { done: false, intensive: false, shadowing: false },  // S4
 *     ],
 *     reading: [
 *       { done: false, vocab: false, review: 0 },              // P1  (review is a click counter)
 *       { done: false, vocab: false, review: 0 },              // P2
 *       { done: false, vocab: false, review: 0 },              // P3
 *     ],
 *   },
 *   ...
 * }
 *
 * Listening step keys:  done | intensive | shadowing
 * Reading step keys:    done | vocab     | review
 */

import { useState, useCallback } from "react";

const STORAGE_KEY = "ielts_study_progress";

function makeListeningSections() {
  return Array.from({ length: 4 }, () => ({ done: false, intensive: false, shadowing: false }));
}

function makeReadingPassages() {
  return Array.from({ length: 3 }, () => ({ done: false, vocab: false, review: 0 }));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useStudyProgress() {
  const [progress, setProgress] = useState(load);

  const persist = useCallback((next) => {
    setProgress(next);
    save(next);
  }, []);

  /**
   * Mark "done" steps from a record's filled bands.
   * Call this after a record is saved in the score tracker.
   * Only marks as done the specific sections/passages that have a non-null score
   * in listeningSections / readingPassages — not the whole subject.
   */
  const markDoneFromRecord = useCallback((record) => {
    const { book, testNum, listeningSections, readingPassages } = record;
    const key = `${book}-${testNum}`;

    setProgress((prev) => {
      const entry = prev[key] ?? {
        listening: makeListeningSections(),
        reading:   makeReadingPassages(),
      };

      let listening = entry.listening;
      let reading   = entry.reading;

      if (Array.isArray(listeningSections)) {
        listening = listening.map((s, i) =>
          listeningSections[i] !== null && listeningSections[i] !== undefined
            ? { ...s, done: true }
            : s
        );
      }
      if (Array.isArray(readingPassages)) {
        reading = reading.map((s, i) =>
          readingPassages[i] !== null && readingPassages[i] !== undefined
            ? { ...s, done: true }
            : s
        );
      }

      // Skip persist if nothing changed
      if (
        listening === entry.listening &&
        reading === entry.reading
      ) return prev;

      const next = { ...prev, [key]: { ...entry, listening, reading } };
      save(next);
      EventBus.emit("study-progress-changed", next);
      return next;
    });
  }, []);
  const ensureEntry = useCallback(
    (book, testNum, current) => {
      const key = `${book}-${testNum}`;
      if (current[key]) return current;
      return {
        ...current,
        [key]: {
          listening: makeListeningSections(),
          reading:   makeReadingPassages(),
        },
      };
    },
    []
  );

  /**
   * Toggle a single step checkbox.
   * @param {number} book
   * @param {number} testNum
   * @param {"listening"|"reading"} subject
   * @param {number} index        section (0-3) or passage (0-2) index
   * @param {string} step         "done" | "intensive" | "shadowing" | "vocab" | "review"
   */
  const toggleStep = useCallback(
    (book, testNum, subject, index, step) => {
      setProgress((prev) => {
        const withEntry = ensureEntry(book, testNum, prev);
        const key = `${book}-${testNum}`;
        const entry = withEntry[key];

        const list = entry[subject].map((item, i) => {
          if (i !== index) return item;
          if (step === "review") {
            return { ...item, review: (item.review ?? 0) + 1 };
          }
          return { ...item, [step]: !item[step] };
        });

        const next = {
          ...withEntry,
          [key]: { ...entry, [subject]: list },
        };
        save(next);
        EventBus.emit("study-progress-changed", next);
        return next;
      });
    },
    [ensureEntry]
  );

  /**
   * Get the progress object for a specific book/test.
   * Returns default (all false) if not yet created.
   */
  const getEntry = useCallback(
    (book, testNum) => {
      const key = `${book}-${testNum}`;
      return (
        progress[key] ?? {
          listening: makeListeningSections(),
          reading:   makeReadingPassages(),
        }
      );
    },
    [progress]
  );

  /**
   * List all (book, testNum) pairs that have any progress recorded.
   * Sorted by book asc, then testNum asc.
   */
  const allEntries = useCallback(() => {
    return Object.keys(progress)
      .map((key) => {
        const [book, testNum] = key.split("-").map(Number);
        return { book, testNum, key };
      })
      .sort((a, b) => a.book - b.book || a.testNum - b.testNum);
  }, [progress]);

  /**
   * Delete all progress for a book/test.
   */
  const deleteEntry = useCallback(
    (book, testNum) => {
      setProgress((prev) => {
      const next = { ...prev };
      delete next[`${book}-${testNum}`];
      save(next);
      EventBus.emit("study-progress-changed", next);
      return next;
      });
    },
    []
  );

  /**
   * Explicitly create an entry for a book/test if it doesn't exist yet.
   */
  const initEntry = useCallback(
    (book, testNum) => {
      const key = `${book}-${testNum}`;
      setProgress((prev) => {
        if (prev[key]) return prev; // already exists
        const next = {
          ...prev,
          [key]: {
            listening: makeListeningSections(),
            reading:   makeReadingPassages(),
          },
        };
        save(next);
        EventBus.emit("study-progress-changed", next);
        return next;
      });
    },
    []
  );

  return { progress, toggleStep, getEntry, allEntries, deleteEntry, initEntry, markDoneFromRecord, setProgress };
}
