/**
 * ProgressLineChart – ECharts-based band score trend chart.
 *
 * Features:
 * - X-axis: sorted by book + test number (e.g. C4-T1, C4-T2, C5-T1…)
 * - DataZoom: scroll wheel to zoom in/out
 * - Tooltip: shows the exact date on hover
 *
 * Props:
 *   labels  – string[]  x-axis tick labels, e.g. ["C4-T1", "C4-T2", "C5-T1"]
 *   series  – array of { label, color, data: number[], dates: string[] }
 *             data[i] and dates[i] correspond to the i-th label
 *             data[i] can be null to skip that point
 *   height  – chart height (default 280)
 */

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export function ProgressLineChart({ labels = [], series = [], height = 280 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  // Collect all non-null data points across all series to determine y-axis range
  const allValues = series.flatMap((s) => (s.data || []).filter((v) => v != null));
  const hasEnoughData = allValues.length >= 2;
  const yMin = allValues.length > 0 ? Math.floor(Math.min(...allValues)) : 4;
  const yMax = allValues.length > 0 ? Math.ceil(Math.max(...allValues)) : 9;

  // Build chart option (stable reference, no stale closures)
  const option = {
    animation: true,
    grid: {
      top: 16,
      right: 24,
      bottom: 56,
      left: 48,
      containLabel: false,
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#f1f5f9", fontSize: 12 },
      formatter(params) {
        const idx = params.dataIndex;
        const s = series.find((s2) => s2.label === params.seriesName);
        if (!s || s.data == null || s.data[idx] == null) return "";
        const date = s.dates?.[idx] ?? "";
        return `<span style="font-size:11px;color:#94a3b8">${params.axisValueLabel}</span><br/>
                <span style="color:${params.color};font-weight:600">${params.seriesName}</span>
                : <strong>${s.data[idx]?.toFixed(1)}</strong><br/>
                ${date ? `<span style="font-size:11px;color:#94a3b8">${date}</span>` : ""}`;
      },
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 11, interval: 0 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
      },
    ],
    series: series.map((s) => ({
      name: s.label,
      type: "line",
      data: s.data ?? [],
      symbol: "circle",
      symbolSize: 6,
      showSymbol: true,
      lineStyle: { width: 2.5, color: s.color },
      itemStyle: {
        color: s.color,
        borderWidth: 2,
        borderColor: "#fff",
      },
      emphasis: {
        scale: true,
        scaleSize: 10,
        itemStyle: { shadowBlur: 8, shadowColor: s.color + "66" },
      },
      connectNulls: false,
      smooth: false,
    })),
  };

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = echarts.init(containerRef.current, null, { renderer: "canvas" });
    chartRef.current = instance;

    return () => {
      instance.dispose();
      chartRef.current = null;
    };
  }, []);

  // Update chart when option or data changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option, { notMerge: true });
  }, [option, labels, series]);

  // Resize on container size change
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (!hasEnoughData) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm italic bg-slate-50 rounded-lg"
        style={{ height }}
      >
        Need at least 2 records to show trends
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full"
    />
  );
}
