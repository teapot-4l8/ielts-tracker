import { useState } from "react";
import { CheckCircle, BarChart2, AlertCircle, Timer, ListTodo } from "lucide-react";

import { useRecords } from "./hooks/useRecords";
import { useStudyProgress } from "./hooks/useStudyProgress";
import { ScoreInputForm } from "./components/ScoreInputForm";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { TestTimer } from "./components/TestTimer";
import { DailyTodo } from "./components/DailyTodo";

export default function App() {
  const [activeTab, setActiveTab] = useState("record");
  const [toast, setToast] = useState(null); // { text, isError }

  const { records, upsertRecord, deleteRecord, clearAll, exportRecords, importRecords } =
    useRecords();

  const { markDoneFromRecord } = useStudyProgress();

  const showToast = (text, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Navigation */}
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-indigo-200" />
            <h1 className="text-xl font-bold tracking-wide">
              IELTS Master Tracker
            </h1>
          </div>
          <div className="flex space-x-1">
            <NavButton
              active={activeTab === "record"}
              onClick={() => setActiveTab("record")}
            >
              Record Test
            </NavButton>
            <NavButton
              active={activeTab === "progress"}
              onClick={() => setActiveTab("progress")}
              icon={<BarChart2 className="w-4 h-4" />}
            >
              My Progress
            </NavButton>
            <NavButton
              active={activeTab === "timer"}
              onClick={() => setActiveTab("timer")}
              icon={<Timer className="w-4 h-4" />}
            >
              Timer
            </NavButton>
            <NavButton
              active={activeTab === "todo"}
              onClick={() => setActiveTab("todo")}
              icon={<ListTodo className="w-4 h-4" />}
            >
              Daily Tasks
            </NavButton>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 mt-8">
        {activeTab === "record" && (
          <ScoreInputForm
            records={records}
            onSave={(record) => {
              upsertRecord(record);
              markDoneFromRecord(record);
            }}
            onAlert={showToast}
          />
        )}

        {activeTab === "progress" && (
          <ProgressDashboard
            records={records}
            onDeleteRecord={deleteRecord}
            onClearAll={clearAll}
            onAlert={showToast}
          />
        )}

        {activeTab === "timer" && <TestTimer />}

        {activeTab === "todo" && <DailyTodo />}
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 ${
            toast.isError ? "bg-red-600 text-white" : "bg-green-600 text-white"
          }`}
        >
          {toast.isError ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.text}</span>
        </div>
      )}
    </div>
  );
}

/** Inline nav button to keep App.jsx clean. */
function NavButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
        active ? "bg-indigo-700" : "hover:bg-indigo-500"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
