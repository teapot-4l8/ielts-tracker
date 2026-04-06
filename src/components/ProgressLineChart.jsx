/**
 * ProgressLineChart – SVG-based band score trend chart.
 *
 * Supports two modes:
 *
 * 1. Single-series (legacy):
 *    <ProgressLineChart data={[7.0, 7.5, 8.0]} color="#4f46e5" />
 *
 * 2. Multi-series:
 *    <ProgressLineChart
 *      series={[
 *        { label: "Listening", color: "#3b82f6", data: [7.0, null, 8.0] },
 *        { label: "Reading",   color: "#10b981", data: [6.5, 7.0, null] },
 *      ]}
 *    />
 *    Null values are silently skipped (the line jumps over them).
 */

const PADDING = { top: 16, right: 16, bottom: 16, left: 32 };
const CHART_W = 520;
const CHART_H = 200;
const Y_MIN = 4;
const Y_MAX = 9;
const GRID_BANDS = [5, 6, 7, 8, 9];

/** Map a band value → SVG y-coordinate */
const toY = (band) =>
  CHART_H -
  PADDING.bottom -
  ((band - Y_MIN) * (CHART_H - PADDING.top - PADDING.bottom)) / (Y_MAX - Y_MIN);

/** Map a point index → SVG x-coordinate (requires total point count) */
const toX = (i, total) =>
  total < 2
    ? PADDING.left
    : PADDING.left +
      (i * (CHART_W - PADDING.left - PADDING.right)) / (total - 1);

/**
 * Build a continuous SVG path string for a series, skipping null values.
 * Produces disconnected segments around null gaps.
 */
function buildPath(data, total) {
  let d = "";
  let lastWasNull = true;
  data.forEach((val, i) => {
    if (val === null || val === undefined) {
      lastWasNull = true;
      return;
    }
    const x = toX(i, total);
    const y = toY(val);
    d += lastWasNull ? `M ${x} ${y}` : ` L ${x} ${y}`;
    lastWasNull = false;
  });
  return d;
}

function GridLines() {
  return (
    <>
      {GRID_BANDS.map((band) => {
        const y = toY(band);
        return (
          <g key={band}>
            <line
              x1={PADDING.left}
              y1={y}
              x2={CHART_W - PADDING.right}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 2"
            />
            <text
              x={PADDING.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {band}
            </text>
          </g>
        );
      })}
    </>
  );
}

function SeriesLine({ data, color, total }) {
  const pathD = buildPath(data, total);
  if (!pathD) return null;
  return (
    <>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((val, i) =>
        val !== null && val !== undefined ? (
          <circle
            key={i}
            cx={toX(i, total)}
            cy={toY(val)}
            r="3.5"
            fill="white"
            stroke={color}
            strokeWidth="2"
          />
        ) : null
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[200px] bg-slate-50 rounded-lg text-slate-400 text-sm italic">
      Need at least 2 records to show trends
    </div>
  );
}

export function ProgressLineChart({ data, color = "#4f46e5", height, series }) {
  // ── Multi-series mode ──────────────────────────────────────────────────────
  if (series && series.length > 0) {
    // Use longest series length as the total x-axis points
    const total = Math.max(...series.map((s) => s.data.length));
    const hasEnoughData = series.some(
      (s) => s.data.filter((v) => v !== null && v !== undefined).length >= 2
    );
    if (!hasEnoughData) return <EmptyState />;

    return (
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto overflow-visible"
        aria-label="Band score trend chart"
      >
        <GridLines />
        {series.map((s) => (
          <SeriesLine
            key={s.label}
            data={s.data}
            color={s.color}
            total={total}
          />
        ))}
      </svg>
    );
  }

  // ── Single-series (legacy) mode ────────────────────────────────────────────
  if (!data || data.filter((v) => v !== null && v !== undefined).length < 2) {
    return <EmptyState />;
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full h-auto overflow-visible"
      aria-label="Band score trend chart"
    >
      <GridLines />
      <SeriesLine data={data} color={color} total={data.length} />
    </svg>
  );
}
