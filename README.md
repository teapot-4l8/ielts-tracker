# 📊 IELTS Tracker

An intelligent IELTS preparation companion that helps you track progress across all four modules — Listening, Reading, Writing, and Speaking — with AI-powered writing feedback.

---

## ✨ Features

### 📝 Record Test
- Input raw scores for **Listening** (S1–S4) and **Reading** (P1–P3) with automatic band score conversion
- **Writing** and **Speaking** band scores supported
- Optional Reading time tracker to monitor pacing

### 📈 My Progress
- **Subject Score Trends** chart — tracks Listening / Reading / Writing / Speaking trends over time, sorted by Cambridge book order, with scroll-to-zoom
- **Study Log** — per-section (Listening) and per-passage (Reading) study step tracker
  - Listening: Done → Intensive → Shadowing
  - Reading: Done → Vocab → Review (click to increment, right-click to decrement)
- **Detailed Records** table — filter by book, sort by time or book order, ascending/descending
- Incomplete records (missing section/passage data) show scores in **gray** to indicate incomplete entry

### 🤖 AI Writing Grader
- **Brainstorm** — generate structured outlines and vocabulary suggestions for Task 2 prompts
- **Essay Grading** — Gemini-powered band score estimation with detailed criterion-based feedback and a polished version of your essay

---

## 🛠 Tech Stack

| | |
|---|---|
| **Framework** | React 19 + Vite |
| **Styling** | Tailwind CSS |
| **Charts** | ECharts 5 (native, no wrapper) |
| **Icons** | Lucide React |
| **AI** | Google Gemini API (`gemini-2.5-flash-preview-09-2025`) |
| **Storage** | localStorage (all data stays in your browser) |

---

## 🚀 Quick Start

### 1. Install

```bash
git clone <repo-url>
cd ielts-tracker
npm install
```

### 2. Configure API Key

Open `src/utils/geminiApi.js` and set your Gemini API key:

```js
const apiKey = "YOUR_GEMINI_API_KEY_HERE";
```

Get a key at [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📸 Screenshots

> Screenshots coming soon — run the dev server and explore!

### Record Test

### My Progress

### AI Writing Grader

---

## 📁 Project Structure

```
src/
  App.jsx                  # Root component, tab routing, toast
  main.jsx                 # Entry point
  index.css                # Tailwind base styles
  components/
    ScoreInputForm.jsx      # "Record Test" tab — score entry form
    WritingGrader.jsx       # "AI Writing Grader" tab
    ProgressDashboard.jsx   # "My Progress" tab — stats, chart, study log, table
    ProgressLineChart.jsx   # ECharts-based line chart
    StudyLog.jsx            # Study step tracker (Listening & Reading)
  hooks/
    useRecords.js           # localStorage persistence for test records
    useStudyProgress.js     # localStorage persistence for study steps
  utils/
    scoring.js              # Raw score → band score conversion
    geminiApi.js            # Gemini API helpers (brainstorm + grading)
    eventBus.js             # Lightweight event emitter for cross-component sync
```

---

## 📋 Data Schema

**Test Records** (`localStorage: ielts_tracker_records`)

```json
{
  "id": "uuid",
  "date": "2026-04-08",
  "timestamp": 1744128000000,
  "book": 11,
  "testNum": 2,
  "listeningRaw": 35,
  "lBand": 7.0,
  "listeningSections": [9, 9, 8, 9],
  "readingRaw": 33,
  "rBand": 7.0,
  "readingPassages": [11, 11, 11],
  "readingTime": 55,
  "wBand": 6.5,
  "sBand": 6.5,
  "overallBand": 6.75
}
```

**Study Progress** (`localStorage: ielts_study_progress`)

```json
{
  "11-2": {
    "listening": [
      { "done": true, "intensive": false, "shadowing": false },
      { "done": true, "intensive": true, "shadowing": false },
      { "done": false, "intensive": false, "shadowing": false },
      { "done": false, "intensive": false, "shadowing": false }
    ],
    "reading": [
      { "done": true, "vocab": false, "review": 3 },
      { "done": true, "vocab": true, "review": 1 },
      { "done": false, "vocab": false, "review": 0 }
    ]
  }
}
```

---

## 🔮 Roadmap

- [ ] Speaking mock test timer
- [ ] Export progress reports as PDF
- [ ] Cloud sync (optional)
