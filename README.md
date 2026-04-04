# 📊 IELTS Master Tracker (AI-Powered)

An intelligent, all-in-one companion for IELTS preparation. This application helps students track their progress across all four modules—Reading, Listening, Writing, and Speaking—while leveraging the **Gemini API** to provide instant expert feedback on writing tasks.

## ✨ Key Features

- **🤖 AI Writing Tutor:** Integrated with Google Gemini to provide instant band score estimates, detailed criteria-based feedback, and a "Polished Version" of your essay to show you exactly how to improve.
- **💡 Smart Brainstorming:** Stuck on a Task 2 prompt? The AI Brainstorming feature generates logical outlines and high-level vocabulary collocations to jumpstart your writing.
- **📈 Visual Progress Dashboard:** Custom-built SVG charts track your Overall Band trend over time, helping you identify plateaus and improvements at a glance.
- **⏱️ Reading & Listening Analytics:**
    - Automated raw-to-band score conversion for Cambridge practice tests.
    - Optional **Time Tracking** for the Reading section to monitor your pacing.
- **📚 Cambridge Reference System:** Organize your practice by Cambridge Book (4–18, 22) and Test Number for easy historical review.

## 🛠️ Tech Stack

- **Frontend:** React (Vite)
- **Styling:** Tailwind CSS (Responsive & Modern UI)
- **Icons:** Lucide React
- **AI Integration:** Google Gemini API (LLM-based grading & brainstorming)
- **Visualization:** Custom SVG-based Line Charts

## 🚀 Quick Start

### 1. Clone & Install

Bash

```
git clone https://github.com/your-username/ielts-master-tracker.git
cd ielts-master-tracker
npm install
```

### 2. Configure API Key

Open `src/App.jsx` and add your Gemini API Key to the helper functions:

JavaScript

```
const apiKey = "YOUR_GEMINI_API_KEY_HERE";
```

### 3. Launch

Bash

```
npm run dev
```

## 📸 Screenshots

| **Dashboard & Trends** | **AI Writing Grader** |
| ---------------------- | --------------------- |
|                        |                       |

## 📝 Future Roadmap

- [ ] Persistent storage (Supabase/Firebase) to save records across sessions.
- [ ] Speaking module "Mock Test" timer.
- [ ] Export progress reports as PDF.







# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
