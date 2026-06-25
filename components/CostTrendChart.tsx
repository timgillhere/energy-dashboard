"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js";
import "@/lib/chartSetup";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import type { DayCost } from "@/lib/dataUtils";
import { CHART_DEFAULTS } from "@/lib/chartSetup";

interface CostTrendChartProps {
  days: DayCost[];
}

type ViewMode = "combined" | "electricity" | "gas";

function rollingAvg(values: (number | null)[], window: number): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v !== null);
    if (slice.length < Math.min(window, i + 1)) return null;
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

export default function CostTrendChart({ days }: CostTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [mode, setMode] = useState<ViewMode>("combined");

  useEffect(() => {
    if (!canvasRef.current || days.length === 0) return;

    const labels = days.map((d) => d.label);

    const elecData = days.map((d) => parseFloat(d.electricityCost.toFixed(2)));
    const gasData = days.map((d) => parseFloat(d.gasCost.toFixed(2)));
    const combinedData = days.map((d) => parseFloat(d.total.toFixed(2)));

    const rollingData = mode === "electricity"
      ? rollingAvg(elecData, 7)
      : mode === "gas"
      ? rollingAvg(gasData, 7)
      : rollingAvg(combinedData, 7);

    // Project 7 more days from the last rolling average value
    const lastRolling = [...rollingData].reverse().find((v) => v !== null);
    const projectionLabels = lastRolling !== undefined
      ? Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i + 1);
          return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        })
      : [];
    const allLabels = [...labels, ...projectionLabels];
    const projectionLine: (number | null)[] = [
      ...rollingData.map(() => null),
      ...projectionLabels.map(() => lastRolling ?? null),
    ];
    // Connect projection to last rolling point
    const lastRollingIdx = rollingData.map((v, i) => v !== null ? i : -1).filter((i) => i >= 0).pop() ?? -1;
    if (lastRollingIdx >= 0 && lastRolling !== undefined) {
      projectionLine[lastRollingIdx] = lastRolling;
    }

    const datasets: any[] = [];

    if (mode === "combined") {
      datasets.push(
        {
          label: "Electricity (£)",
          data: [...elecData, ...projectionLabels.map(() => null)],
          backgroundColor: "rgba(0,240,255,0.50)",
          borderRadius: 3,
          stack: "cost",
          order: 2,
        },
        {
          label: "Gas (£)",
          data: [...gasData, ...projectionLabels.map(() => null)],
          backgroundColor: "rgba(191,95,255,0.50)",
          borderRadius: 3,
          stack: "cost",
          order: 2,
        }
      );
    } else if (mode === "electricity") {
      datasets.push({
        label: "Electricity (£)",
        data: [...elecData, ...projectionLabels.map(() => null)],
        backgroundColor: "rgba(0,240,255,0.55)",
        borderRadius: 3,
        order: 2,
      });
    } else {
      datasets.push({
        label: "Gas (£)",
        data: [...gasData, ...projectionLabels.map(() => null)],
        backgroundColor: "rgba(191,95,255,0.55)",
        borderRadius: 3,
        order: 2,
      });
    }

    datasets.push(
      {
        label: "7-day avg",
        data: [...rollingData, ...projectionLabels.map(() => null)],
        type: "line" as const,
        borderColor: "rgba(255,45,120,0.90)",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        order: 1,
        spanGaps: false,
      },
      {
        label: "Projection",
        data: projectionLine,
        type: "line" as const,
        borderColor: "rgba(255,45,120,0.40)",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
        order: 1,
        spanGaps: true,
      }
    );

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: { labels: allLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "rgba(240,238,255,0.65)", font: { size: 11 }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: CHART_DEFAULTS.tooltipBg,
            borderColor: CHART_DEFAULTS.tooltipBorder,
            borderWidth: 1,
            titleColor: CHART_DEFAULTS.tooltipTitle,
            bodyColor: CHART_DEFAULTS.tooltipBody,
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                if (v === null || v === 0 && ctx.datasetIndex >= datasets.length - 2) return "";
                if (ctx.dataset.label === "Projection") return ` Projected avg: £${v.toFixed(2)}/day`;
                if (ctx.dataset.label === "7-day avg") return ` 7-day avg: £${v.toFixed(2)}/day`;
                return ` ${ctx.dataset.label}: £${v.toFixed(2)}`;
              },
              footer: (items) => {
                if (mode !== "combined") return "";
                const barItems = items.filter((i) => i.datasetIndex < 2);
                const total = barItems.reduce((s, i) => s + (i.parsed.y as number), 0);
                return total > 0 ? `Total: £${total.toFixed(2)}` : "";
              },
            },
          },
        },
        scales: {
          x: {
            stacked: mode === "combined",
            grid: { color: CHART_DEFAULTS.gridColor },
            ticks: {
              color: CHART_DEFAULTS.tickColor,
              font: { size: 9 },
              maxTicksLimit: 12,
              maxRotation: 0,
            },
          },
          y: {
            stacked: mode === "combined",
            grid: { color: CHART_DEFAULTS.gridColor },
            ticks: {
              color: CHART_DEFAULTS.tickColor,
              font: { size: 10 },
              callback: (v) => `£${v}`,
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [days, mode]);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(255,0,110,0.12)" : "transparent",
    border: `1px solid ${active ? "rgba(255,0,110,0.45)" : "transparent"}`,
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 11,
    color: active ? "#FF2D78" : "rgba(240,238,255,0.55)",
    cursor: "pointer",
    boxShadow: active ? "0 0 8px rgba(255,45,120,0.20)" : "none",
  });

  const hasEstimated = days.some((d) => d.estimated);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Spend Trend
          </p>
          <InfoTip
            content="Daily energy spend over the last 30 days. The solid line is a 7-day rolling average showing your cost trend. The dashed line projects your next 7 days based on recent average."
            width={240}
          />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <button style={btnStyle(mode === "combined")} onClick={() => setMode("combined")}>Combined</button>
          <button style={btnStyle(mode === "electricity")} onClick={() => setMode("electricity")}>Electricity</button>
          <button style={btnStyle(mode === "gas")} onClick={() => setMode("gas")}>Gas</button>
        </div>
      </div>

      {days.length === 0 ? (
        <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,238,255,0.52)", fontSize: 13 }}>
          No consumption data yet.
        </div>
      ) : (
        <div style={{ height: 220, position: "relative" }}>
          <canvas ref={canvasRef} />
        </div>
      )}

      {hasEstimated && (
        <p style={{ color: "rgba(240,238,255,0.38)", fontSize: 11, marginTop: 8 }}>
          * Some days use estimated rates (outside 14-day rate window). Costs are approximate.
        </p>
      )}
    </Card>
  );
}
