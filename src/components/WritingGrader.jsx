import { useState } from "react";
import {
  RefreshCw, PenTool, FileText, ClipboardList,
  ImagePlus, X, CheckCircle, AlertCircle,
} from "lucide-react";
import { brainstormIdeas, evaluateEssay } from "../utils/geminiApi";

/**
 * AI Writing Grader panel (Task 1 / Task 2).
 *
 * Props:
 *   writingTaskType  - 'Task 1' | 'Task 2'
 *   onScoreReady(score) - called when grading succeeds
 *   onAlert(msg, isError) - parent toast handler
 */
export function WritingGrader({ writingTaskType, onScoreReady, onAlert }) {
  const [essayTopic, setEssayTopic] = useState("");
  const [essayText, setEssayText] = useState("");
  const [task1Image, setTask1Image] = useState(null);

  const [gradingStatus, setGradingStatus] = useState("idle"); // 'idle'|'loading'|'success'|'error'
  const [gradingResult, setGradingResult] = useState(null);

  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onAlert("Image must be less than 5MB", true);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTask1Image(reader.result);
    reader.readAsDataURL(file);
  };

  const handleBrainstorm = async () => {
    if (!essayTopic && !task1Image) {
      onAlert("Please enter a topic or upload an image first.", true);
      return;
    }
    setIsBrainstorming(true);
    setBrainstormResult(null);
    try {
      const result = await brainstormIdeas(
        essayTopic,
        writingTaskType,
        writingTaskType === "Task 1" ? task1Image : null
      );
      setBrainstormResult(result);
    } catch (err) {
      console.error(err);
      onAlert("Failed to generate brainstorm. Please try again.", true);
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleGradeEssay = async () => {
    if ((!essayTopic && !task1Image) || !essayText) {
      onAlert("Please enter the topic/image and your essay.", true);
      return;
    }
    setGradingStatus("loading");
    try {
      const result = await evaluateEssay(
        essayTopic,
        essayText,
        writingTaskType,
        writingTaskType === "Task 1" ? task1Image : null
      );
      setGradingResult(result);
      onScoreReady(result.score);
      setGradingStatus("success");
    } catch (err) {
      console.error(err);
      setGradingStatus("error");
      onAlert("Failed to grade essay. Please try again.", true);
    }
  };

  return (
    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-indigo-700 text-sm font-semibold mb-2">
        {writingTaskType === "Task 1" ? (
          <ClipboardList className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Current System: {writingTaskType} Grading
      </div>

      {/* Topic input */}
      <div>
        <div className="flex justify-between items-end mb-1">
          <label className="block text-sm font-medium text-slate-700">
            {writingTaskType} Topic / Prompt
          </label>
          <button
            onClick={handleBrainstorm}
            disabled={isBrainstorming || (!essayTopic && !task1Image)}
            className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50 border border-amber-200"
          >
            {isBrainstorming ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              "✨"
            )}{" "}
            {isBrainstorming ? "Thinking..." : "AI Brainstorm ✨"}
          </button>
        </div>
        <textarea
          rows="2"
          value={essayTopic}
          onChange={(e) => setEssayTopic(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder={
            writingTaskType === "Task 1"
              ? "Describe the graph/chart/process..."
              : "Discuss the pros and cons of..."
          }
        />
      </div>

      {/* Brainstorm result */}
      {brainstormResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => setBrainstormResult(null)}
            className="absolute top-2 right-2 text-amber-600 hover:bg-amber-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
            ✨ Brainstorming &amp; Outline Ideas
          </h4>
          <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed font-medium">
            {brainstormResult}
          </div>
        </div>
      )}

      {/* Task 1 image upload */}
      {writingTaskType === "Task 1" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Graph/Chart Image (Optional)
          </label>
          {task1Image ? (
            <div className="relative inline-block mt-2">
              <img
                src={task1Image}
                alt="Task 1 Graph"
                className="max-h-48 rounded-lg border border-slate-200 shadow-sm"
              />
              <button
                onClick={() => setTask1Image(null)}
                className="absolute -top-2 -right-2 bg-slate-800 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full mt-1">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="mb-1 text-sm text-slate-500">
                    <span className="font-semibold text-indigo-600">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Essay textarea */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Your {writingTaskType} Response
        </label>
        <textarea
          rows="6"
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder={`Enter at least ${writingTaskType === "Task 1" ? "150" : "250"} words...`}
        />
      </div>

      {/* Grade button */}
      <button
        onClick={handleGradeEssay}
        disabled={gradingStatus === "loading"}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-70"
      >
        {gradingStatus === "loading" ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <PenTool className="w-5 h-5" />
        )}
        {gradingStatus === "loading"
          ? `Grading ${writingTaskType}...`
          : `Grade & Improve ${writingTaskType}`}
      </button>

      {/* Grading result */}
      {gradingResult && (
        <div className="mt-6 border-t border-slate-200 pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Estimated Score: {gradingResult.score}
            </div>
            <p className="text-sm text-slate-500">
              Score applied to the writing band for this test.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2">
              {writingTaskType} Feedback
            </h4>
            <div className="bg-white border border-slate-200 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {gradingResult.feedback}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800">
                Polished {writingTaskType} (+
                {(gradingResult.improvedScore - gradingResult.score).toFixed(1)}{" "}
                Band)
              </h4>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md font-bold">
                Target Score: {gradingResult.improvedScore}
              </span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {gradingResult.improvedEssay}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
