# IELTS Tracker – Long-Term Memory

## Project Overview
React + Vite + Tailwind CSS IELTS score tracking web app.
Entry: `src/main.jsx` → `src/App.jsx`

## Architecture (after 2026-04-05 refactor)

```
src/
  App.jsx                         – Root: tab routing + toast
  hooks/
    useRecords.js                 – localStorage persistence hook
  utils/
    scoring.js                    – Band score conversion logic
    geminiApi.js                  – Gemini API helpers (brainstorm + essay grading)
  components/
    ScoreInputForm.jsx            – "Record Test" tab UI
    WritingGrader.jsx             – AI essay grader panel
    ProgressDashboard.jsx         – "My Progress" tab (chart + table + import/export)
    ProgressLineChart.jsx         – SVG line chart component
```

## Data Persistence
- All test records saved to `localStorage` under key `"ielts_tracker_records"`.
- Schema: `{ id, date, timestamp, book, testNum, listeningRaw, lBand, readingRaw, readingTime, rBand, wBand, sBand, overallBand }`
- Export: downloads `ielts-records-YYYY-MM-DD.json`
- Import: merges JSON, deduplicates by `id`

## Key Libraries
- lucide-react (icons), tailwindcss (styling)
- Gemini API model: `gemini-2.5-flash-preview-09-2025` (API key left blank in geminiApi.js)
