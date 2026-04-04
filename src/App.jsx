import React, { useState, useEffect } from 'react';
import { Headphones, BookOpen, PenTool, Mic, Save, BarChart2, PlusCircle, CheckCircle, RefreshCw, AlertCircle, ChevronDown, FileText, ClipboardList, ImagePlus, X, Clock, TrendingUp, Target } from 'lucide-react';

// --- IELTS Scoring Logic ---
const getListeningBand = (score) => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 26) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 18) return 5.5;
  if (score >= 16) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 8) return 3.5;
  if (score >= 6) return 3.0;
  if (score >= 4) return 2.5;
  if (score >= 2) return 2.0;
  if (score >= 1) return 1.0;
  return 0.0;
};

const getAcademicReadingBand = (score) => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 33) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 27) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 19) return 5.5;
  if (score >= 15) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 8) return 3.5;
  if (score >= 6) return 3.0;
  if (score >= 4) return 2.5;
  if (score >= 2) return 2.0;
  if (score >= 1) return 1.0;
  return 0.0;
};

const roundOverallIELTS = (average) => {
  const whole = Math.floor(average);
  const fraction = average - whole;
  if (fraction < 0.25) return whole;
  if (fraction < 0.75) return whole + 0.5;
  return whole + 1.0;
};

// --- SVG Chart Components ---

const ProgressLineChart = ({ data, color = "#4f46e5", height = 200 }) => {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center h-[200px] bg-slate-50 rounded-lg text-slate-400 text-sm italic">
      Need at least 2 records to show trends
    </div>
  );

  const padding = 30;
  const chartWidth = 500;
  const chartHeight = height;
  const points = data.map((d, i) => ({
    x: padding + (i * (chartWidth - 2 * padding)) / (data.length - 1),
    y: chartHeight - padding - ((d - 4) * (chartHeight - 2 * padding)) / 5 // Scale 4.0 to 9.0
  }));

  const pathD = points.reduce((acc, curr, i) => 
    i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`, ""
  );

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
      {/* Grid lines for bands 5, 6, 7, 8, 9 */}
      {[5, 6, 7, 8, 9].map(band => {
        const y = chartHeight - padding - ((band - 4) * (chartHeight - 2 * padding)) / 5;
        return (
          <g key={band}>
            <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 2" />
            <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{band}</text>
          </g>
        );
      })}
      {/* The Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
};

// --- API Helpers ---
const brainstormIdeasWithRetry = async (topic, taskType, imageStr, retries = 5) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const systemInstruction = `You are an expert IELTS tutor helping a student brainstorm for Writing ${taskType}.
  Provide a highly structured, concise brainstorming sheet for the provided topic ${imageStr ? 'and attached image' : ''}.
  Include:
  1. Key Angles/Arguments (Pros/Cons, Causes/Solutions, or Main Trends/Features for Task 1).
  2. A suggested paragraph outline.
  3. 5-8 useful advanced vocabulary words or collocations specific to this topic.
  Keep it concise and format it clearly.`;

  const parts = [{ text: `Task Type: ${taskType}\nTopic: ${topic}` }];

  if (imageStr) {
    const mimeType = imageStr.split(';')[0].split(':')[1];
    const base64Data = imageStr.split(',')[1];
    parts.push({
      inlineData: { mimeType: mimeType, data: base64Data }
    });
  }

  const payload = {
    contents: [{ role: "user", parts: parts }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No text in response");
      return text;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};

const evaluateEssayWithRetry = async (topic, essay, taskType, imageStr, retries = 5) => {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const systemInstruction = `You are an expert IELTS examiner specializing in Writing ${taskType}. 
  Grade the following essay based on the provided topic ${imageStr ? 'and the attached image' : ''}. 
  For ${taskType}, use the specific official criteria: 
  - ${taskType === 'Task 1' ? 'Task Achievement' : 'Task Response'}
  - Coherence & Cohesion
  - Lexical Resource
  - Grammatical Range & Accuracy.
  
  Provide an estimated IELTS band score (in 0.5 increments). 
  Provide detailed feedback for each of the 4 criteria. 
  Finally, provide a polished, improved version of the essay that is realistic and scores exactly 0.5 or 1.0 band higher than the original.`;

  const parts = [
    { text: `Task Type: ${taskType}\nTopic: ${topic}\n\nEssay: ${essay}` }
  ];

  if (imageStr) {
    const mimeType = imageStr.split(';')[0].split(':')[1];
    const base64Data = imageStr.split(',')[1];
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  const payload = {
    contents: [{ role: "user", parts: parts }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          score: { type: "NUMBER", description: "The estimated IELTS band score (e.g. 6.0, 6.5)" },
          feedback: { type: "STRING", description: "Detailed feedback on the 4 criteria." },
          improvedEssay: { type: "STRING", description: "A polished version of the essay." },
          improvedScore: { type: "NUMBER", description: "The score of the improved essay." }
        },
        required: ["score", "feedback", "improvedEssay", "improvedScore"]
      }
    }
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No text in response");
      return JSON.parse(text);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('record'); // 'record' or 'progress'
  const [records, setRecords] = useState([]);
  
  // Form State
  const [book, setBook] = useState(18);
  const [testNum, setTestNum] = useState(1);
  const [listeningRaw, setListeningRaw] = useState('');
  const [readingRaw, setReadingRaw] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [writingScore, setWritingScore] = useState('');
  const [speakingScore, setSpeakingScore] = useState('');
  
  // AI Grading State
  const [isAIGrading, setIsAIGrading] = useState(false);
  const [writingTaskType, setWritingTaskType] = useState('Task 2'); 
  const [essayTopic, setEssayTopic] = useState('');
  const [essayText, setEssayText] = useState('');
  const [task1Image, setTask1Image] = useState(null);
  const [gradingStatus, setGradingStatus] = useState('idle'); 
  const [gradingResult, setGradingResult] = useState(null);
  
  // Brainstorming State
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState(null);

  // Derived Scores
  const lBand = listeningRaw !== '' ? getListeningBand(Number(listeningRaw)) : null;
  const rBand = readingRaw !== '' ? getAcademicReadingBand(Number(readingRaw)) : null;
  const wBand = writingScore !== '' ? Number(writingScore) : null;
  const sBand = speakingScore !== '' ? Number(speakingScore) : null;
  
  const canCalculateOverall = lBand !== null && rBand !== null && wBand !== null && sBand !== null;
  const overallBand = canCalculateOverall ? roundOverallIELTS((lBand + rBand + wBand + sBand) / 4) : null;

  const handleSaveRecord = () => {
    if (!canCalculateOverall) return;
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      book,
      testNum,
      listeningRaw: Number(listeningRaw),
      lBand,
      readingRaw: Number(readingRaw),
      readingTime: readingTime ? Number(readingTime) : null,
      rBand,
      wBand,
      sBand,
      overallBand
    };
    setRecords([newRecord, ...records]);
    alertMessage("Record saved successfully!");
    
    setListeningRaw('');
    setReadingRaw('');
    setReadingTime('');
    setWritingScore('');
    setSpeakingScore('');
    setGradingResult(null);
    setEssayTopic('');
    setEssayText('');
    setTask1Image(null);
    setGradingStatus('idle');
    setBrainstormResult(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         return alertMessage("Image must be less than 5MB", true);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTask1Image(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrainstorm = async () => {
    if (!essayTopic && !task1Image) return alertMessage("Please enter a topic or upload an image first.", true);
    setIsBrainstorming(true);
    setBrainstormResult(null);
    try {
      const result = await brainstormIdeasWithRetry(essayTopic, writingTaskType, writingTaskType === 'Task 1' ? task1Image : null);
      setBrainstormResult(result);
    } catch (error) {
      console.error(error);
      alertMessage("Failed to generate brainstorm. Please try again.", true);
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleGradeEssay = async () => {
    if ((!essayTopic && !task1Image) || !essayText) return alertMessage("Please enter the topic/image and your essay.", true);
    setGradingStatus('loading');
    try {
      const result = await evaluateEssayWithRetry(essayTopic, essayText, writingTaskType, writingTaskType === 'Task 1' ? task1Image : null);
      setGradingResult(result);
      setWritingScore(result.score);
      setGradingStatus('success');
    } catch (error) {
      console.error(error);
      setGradingStatus('error');
      alertMessage("Failed to grade essay. Please try again.", true);
    }
  };

  const [toastMessage, setToastMessage] = useState(null);
  const alertMessage = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [filterBook, setFilterBook] = useState('All');
  const filteredRecords = filterBook === 'All' 
    ? records 
    : records.filter(r => r.book === Number(filterBook));

  // Dashboard Stats
  const chronologicalRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const avgOverall = records.length > 0 ? (records.reduce((acc, r) => acc + r.overallBand, 0) / records.length).toFixed(1) : "-";
  const bestOverall = records.length > 0 ? Math.max(...records.map(r => r.overallBand)).toFixed(1) : "-";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-indigo-200" />
            <h1 className="text-xl font-bold tracking-wide">IELTS Master Tracker</h1>
          </div>
          <div className="flex space-x-1">
            <button onClick={() => setActiveTab('record')} className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'record' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}>Record Test</button>
            <button onClick={() => setActiveTab('progress')} className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'progress' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}><BarChart2 className="w-4 h-4" /> My Progress</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {activeTab === 'record' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-1">Cambridge Book</label>
                  <select value={book} onChange={e => setBook(Number(e.target.value))} className="w-full md:w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                    {Array.from({length: 18}, (_, i) => i + 4).map(b => <option key={b} value={b}>Book {b}</option>)}
                    <option value={22}>Book 22</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-1">Test Number</label>
                  <select value={testNum} onChange={e => setTestNum(Number(e.target.value))} className="w-full md:w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                    {[1,2,3,4].map(t => <option key={t} value={t}>Test {t}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="bg-indigo-50 px-8 py-4 rounded-xl border border-indigo-100 text-center w-full md:w-auto">
                <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-1">Overall Band</p>
                <div className="text-4xl font-bold text-indigo-600">{overallBand !== null ? overallBand.toFixed(1) : '-.-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Listening */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Headphones className="w-6 h-6" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Listening</h2>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Raw Score (0-40)</label>
                    <input type="number" min="0" max="40" value={listeningRaw} onChange={e => setListeningRaw(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 35" />
                  </div>
                  <div className="w-24 text-center pb-2">
                    <span className="block text-xs text-slate-400 mb-1">Band</span>
                    <span className="text-2xl font-bold text-slate-700">{lBand !== null ? lBand.toFixed(1) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Reading */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><BookOpen className="w-6 h-6" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Reading</h2>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Raw Score (0-40)</label>
                    <input type="number" min="0" max="40" value={readingRaw} onChange={e => setReadingRaw(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 34" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Time (mins, opt.)</label>
                    <input type="number" min="0" value={readingTime} onChange={e => setReadingTime(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 55" />
                  </div>
                  <div className="w-16 text-center pb-2">
                    <span className="block text-xs text-slate-400 mb-1">Band</span>
                    <span className="text-2xl font-bold text-slate-700">{rBand !== null ? rBand.toFixed(1) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Writing Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><PenTool className="w-6 h-6" /></div>
                    <h2 className="text-xl font-bold text-slate-800">Writing</h2>
                  </div>
                  
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => { setWritingTaskType('Task 1'); setGradingResult(null); }}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${writingTaskType === 'Task 1' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Task 1
                    </button>
                    <button 
                      onClick={() => { setWritingTaskType('Task 2'); setGradingResult(null); }}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${writingTaskType === 'Task 2' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Task 2
                    </button>
                  </div>

                  <button onClick={() => setIsAIGrading(!isAIGrading)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md">
                    {isAIGrading ? "Manual Score Entry" : "Use AI Essay Grader"}
                  </button>
                </div>

                {!isAIGrading ? (
                  <div className="flex gap-4 items-end max-w-sm">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-600 mb-1">Writing Band (0-9)</label>
                      <input type="number" step="0.5" min="0" max="9" value={writingScore} onChange={e => setWritingScore(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. 6.5" />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-700 text-sm font-semibold mb-2">
                      {writingTaskType === 'Task 1' ? <ClipboardList className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      Current System: {writingTaskType} Grading
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-slate-700">{writingTaskType} Topic / Prompt</label>
                        <button 
                          onClick={handleBrainstorm}
                          disabled={isBrainstorming || (!essayTopic && !task1Image)}
                          className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50 border border-amber-200"
                        >
                          {isBrainstorming ? <RefreshCw className="w-3 h-3 animate-spin" /> : "✨"} 
                          {isBrainstorming ? "Thinking..." : "AI Brainstorm ✨"}
                        </button>
                      </div>
                      <textarea rows="2" value={essayTopic} onChange={e => setEssayTopic(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={writingTaskType === 'Task 1' ? "Describe the graph/chart/process..." : "Discuss the pros and cons of..."} />
                    </div>

                    {brainstormResult && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => setBrainstormResult(null)} className="absolute top-2 right-2 text-amber-600 hover:bg-amber-200 p-1 rounded-md transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">✨ Brainstorming & Outline Ideas</h4>
                        <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed font-medium">
                          {brainstormResult}
                        </div>
                      </div>
                    )}

                    {writingTaskType === 'Task 1' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Graph/Chart Image (Optional)</label>
                        {task1Image ? (
                          <div className="relative inline-block mt-2">
                            <img src={task1Image} alt="Task 1 Graph" className="max-h-48 rounded-lg border border-slate-200 shadow-sm" />
                            <button onClick={() => setTask1Image(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-md">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full mt-1">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <ImagePlus className="w-8 h-8 mb-2 text-slate-400" />
                                      <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                                      <p className="text-xs text-slate-400">PNG, JPG, GIF up to 5MB</p>
                                  </div>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                              </label>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Your {writingTaskType} Response</label>
                      <textarea rows="6" value={essayText} onChange={e => setEssayText(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={`Enter at least ${writingTaskType === 'Task 1' ? '150' : '250'} words...`} />
                    </div>
                    <button onClick={handleGradeEssay} disabled={gradingStatus === 'loading'} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-70">
                      {gradingStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
                      {gradingStatus === 'loading' ? `Grading ${writingTaskType}...` : `Grade & Improve ${writingTaskType}`}
                    </button>

                    {gradingResult && (
                      <div className="mt-6 border-t border-slate-200 pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold">Estimated Score: {gradingResult.score}</div>
                          <p className="text-sm text-slate-500">Score applied to the writing band for this test.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 mb-2">{writingTaskType} Feedback</h4>
                          <div className="bg-white border border-slate-200 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{gradingResult.feedback}</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-slate-800">Polished {writingTaskType} (+{gradingResult.improvedScore - gradingResult.score} Band)</h4>
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md font-bold">Target Score: {gradingResult.improvedScore}</span>
                          </div>
                          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{gradingResult.improvedEssay}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Speaking */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Mic className="w-6 h-6" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Speaking</h2>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Speaking Band (0-9)</label>
                    <input type="number" step="0.5" min="0" max="9" value={speakingScore} onChange={e => setSpeakingScore(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 7.0" />
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 mt-4">
                <button onClick={handleSaveRecord} disabled={!canCalculateOverall} className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-sm ${canCalculateOverall ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  <Save className="w-5 h-5" /> Save Test Record
                </button>
                {!canCalculateOverall && <p className="text-center text-sm text-slate-500 mt-2">Complete all sections to save.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Visual Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Stats */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-400 uppercase">Average Overall</p>
                    <p className="text-3xl font-bold text-indigo-600">{avgOverall}</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-full text-indigo-600"><TrendingUp className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-400 uppercase">Best Performance</p>
                    <p className="text-3xl font-bold text-emerald-600">{bestOverall}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-full text-emerald-600"><Target className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-400 uppercase">Total Tests</p>
                    <p className="text-3xl font-bold text-slate-700">{records.length}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-full text-slate-500"><ClipboardList className="w-6 h-6" /></div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Overall Progress Trend</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                    <span className="text-xs text-slate-500 font-medium">Band Score</span>
                  </div>
                </div>
                <ProgressLineChart data={chronologicalRecords.map(r => r.overallBand)} />
                <p className="text-[11px] text-slate-400 mt-2 text-center">Charts show score fluctuations across your recorded attempts.</p>
              </div>
            </div>

            {/* Records Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Detailed Records</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600">Filter Book:</label>
                  <select value={filterBook} onChange={e => setFilterBook(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 text-sm">
                    <option value="All">All Books</option>
                    {Array.from(new Set(records.map(r => r.book))).sort((a,b)=>a-b).map(b => <option key={b} value={b}>Book {b}</option>)}
                  </select>
                </div>
              </div>

              {records.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-600">No records yet</h3>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-sm text-slate-500">{record.date}</td>
                          <td className="p-4 font-medium text-slate-800">Cam {record.book} <span className="text-slate-400 text-sm font-normal">T{record.testNum}</span></td>
                          <td className="p-4 text-center"><span className="font-semibold text-blue-800">{record.lBand.toFixed(1)}</span></td>
                          <td className="p-4 text-center">
                            <span className="font-semibold text-emerald-800">{record.rBand.toFixed(1)}</span>
                            {record.readingTime && (
                              <span className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5 mt-0.5">
                                <Clock className="w-3 h-3" /> {record.readingTime}m
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center font-semibold text-orange-800">{record.wBand.toFixed(1)}</td>
                          <td className="p-4 text-center font-semibold text-purple-800">{record.sBand.toFixed(1)}</td>
                          <td className="p-4 text-center bg-indigo-50/50"><span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">{record.overallBand.toFixed(1)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 ${toastMessage.isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toastMessage.isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}