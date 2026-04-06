import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

const PRESETS = [
  { label: "1 min",  seconds: 60  },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200},
  { label: "30 min", seconds: 1800},
];

export function TestTimer() {
  const [selectedSeconds, setSelectedSeconds] = useState(null);
  const [remaining, setRemaining]           = useState(0);
  const [isRunning, setIsRunning]           = useState(false);
  const [isDone, setIsDone]                = useState(false);
  const intervalRef = useRef(null);

  const total    = selectedSeconds ?? 0;
  const progress = total > 0 ? remaining / total : 0;

  const fmt = (s) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ── Web Audio beep ────────────────────────────────────────────
  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  }, []);

  // ── Timer logic ───────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          setIsDone(true);
          beep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [beep]);

  const toggleTimer = () => {
    if (isRunning) {
      stopTimer();
    } else {
      if (remaining === 0) return;
      startTimer();
    }
  };

  const resetTimer = () => {
    stopTimer();
    setRemaining(selectedSeconds ?? 0);
    setIsDone(false);
  };

  const handlePreset = (seconds) => {
    stopTimer();
    setSelectedSeconds(seconds);
    setRemaining(seconds);
    setIsDone(false);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Circle ────────────────────────────────────────────────────
  const size       = 280;
  const cx         = size / 2;
  const cy         = size / 2;
  const radius     = 118;
  const circumf    = 2 * Math.PI * radius;
  const dashOffset = circumf * (1 - progress);

  const color = isDone
    ? "#ef4444"
    : progress > 0.5 ? "#22c55e"
    : progress > 0.2 ? "#eab308"
    : "#f97316";

  const pct = total > 0 ? Math.round((remaining / total) * 100) : 100;

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-8 py-6">

      {/* Preset buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            onClick={() => handlePreset(p.seconds)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-150
              ${selectedSeconds === p.seconds
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Circle display */}
      <div className="relative select-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumf}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {selectedSeconds !== null ? (
            <>
              <span
                className="text-6xl font-bold tabular-nums transition-colors duration-300"
                style={{ color: isDone ? "#ef4444" : "#1e293b" }}
              >
                {fmt(remaining)}
              </span>
              <span className="text-sm text-slate-400 mt-1">
                {isDone ? "Time's up!" : `${pct}% remaining`}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center text-slate-300">
              <Clock className="w-12 h-12 mb-2" />
              <span className="text-sm">Select a duration</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          disabled={selectedSeconds === null || remaining === 0}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-base
            bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400
            transition-colors shadow-sm"
        >
          {isRunning
            ? <><Pause className="w-5 h-5" /> Pause</>
            : <><Play className="w-5 h-5" /> Start</>}
        </button>

        <button
          onClick={resetTimer}
          disabled={selectedSeconds === null}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 font-medium text-base
            bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50
            disabled:opacity-40 transition-colors"
        >
          <RotateCcw className="w-5 h-5" /> Reset
        </button>
      </div>

      {/* Usage hints */}
      {selectedSeconds !== null && (
        <p className="text-xs text-slate-400 text-center">
          {selectedSeconds === 60   && "60-second quick drill — listening section timing, reading speed practice"}
          {selectedSeconds === 600  && "10 minutes — reading passage practice (1 passage)"}
          {selectedSeconds === 900  && "15 minutes — reading section practice (2 passages)"}
          {selectedSeconds === 1200 && "20 minutes — listening section (transfer time included)"}
          {selectedSeconds === 1800 && "30 minutes — full reading section / listening with transfer"}
        </p>
      )}
    </div>
  );
}
