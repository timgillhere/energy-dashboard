"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js";
import "@/lib/chartSetup";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import type { DayCost } from "@/lib/dataUtils";
import { CHART_DEFAULTS } from "@/lib/chartSetup";

type ViewMode = "stacked" | "electricity" | "gas";

interface DailyCostChartProps {
  days: DayCost[];
  periodLabel: string;
}

export default function DailyCostChart({ days, periodLabel }: DailyCostChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [mode, setMode] = useState<ViewMode>("stacked");

  useEffect(() => {
    if (!canvasRef.current || days.length === 0) return;

    const labels = days.map((d) => d.label);

    const datasets =
      mode === "electricity"
        ? [
            {
              label: "Electricity (£)",
              data: days.map((d) => parseFloat(d.electricityCost.toFixed(2))),
              borderColor: "#a3e635",
              backgroundColor: "rgba(163,230,53,0.15)",
              fill: true,
              tension: 0.3,
              pointRadius: days.length > 30 ? 0 : 3,
              pointBackgroundColor: "#a3e635",
            },
          ]
        : mode === "gas"
        ? [
            {
              label: "Gas (£)",
              data: days.map((d) => parseFloat(d.gasCost.toFixed(2))),
              borderColor: "#f97316",
              backgroundColor: "rgba(249,115,22,0.15)",
              fill: true,
              tension: 0.3,
              pointRadius: days.length > 30 ? 0 : 3,
              pointBackgroundColor: "#f97316",
            },
          ]
        : [
            {
              label: "Electricity (£)",
              data: days.map((d) => parseFloat(d.electricityCost.toFixed(2))),
              borderColor: "#a3e635",
              backgroundColor: "rgba(163,230,53,0.6)",
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              stack: "costs",
            },
            {
              label: "Gas (£)",
              data: days.map((d) => parseFloat(d.gasCost.toFixed(2))),
              borderColor: "#f97316",
              backgroundColor: "rgba(249,115,22,0.6)",
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              stack: "costs",
            },
          ];

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels, datasets: datasets as any },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#6b7280", font: { size: 11 }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: CHART_DEFAULTS.tooltipBg,
            borderColor: CHART_DEFAULTS.tooltipBorder,
            borderWidth: 1,
            titleColor: CHART_DEFAULTS.tooltipTitle,
            bodyColor: CHART_DEFAULTS.tooltipBody,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: £${(ctx.parsed.y as number).toFixed(2)}`,
              footer: (items) => {
                if (mode !== "stacked") return "";
                const total = items.reduce((s, i) => s + (i.parsed.y as number), 0);
                return `Total: £${total.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: mode === "stacked",
            grid: { color: CHART_DEFAULTS.gridColor },
            ticks: {
              color: CHART_DEFAULTS.tickColor,
              font: { size: 10 },
              maxTicksLimit: 10,
              maxRotation: 0,
            },
          },
          y: {
            stacked: mode === "stacked",
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
    background: active ? "#1e1e1e" : "transparent",
    border: `1px solid ${active ? "#2a2a2a" : "transparent"}`,
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 11,
    color: active ? "#ededed" : "#4b5563",
    cursor: "pointer",
  });

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Daily Cost
          </p>
          <InfoTip
            content="Daily spend in £ for electricity and gas combined, using your actual meter readings and the Tracker rate for each day. Days outside the 14-day rate window use the average rate."
            width={230}
          />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <button style={btnStyle(mode === "stacked")} onClick={() => setMode("stacked")}>Combined</button>
          <button style={btnStyle(mode === "electricity")} onClick={() => setMode("electricity")}>Electricity</button>
          <button style={btnStyle(mode === "gas")} onClick={() => setMode("gas")}>Gas</button>
        </div>
      </div>

      {days.length === 0 ? (
        <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 13 }}>
          No data for {periodLabel} — add your meter serial numbers in Settings.
        </div>
      ) : (
        <div style={{ height: 200, position: "relative" }}>
          <canvas ref={canvasRef} />
        </div>
      )}

      {days.some((d) => d.estimated) && (
        <p style={{ color: "#374151", fontSize: 11, marginTop: 8 }}>
          * Some days use estimated rates (outside 14-day rate history). Costs are approximate.
        </p>
      )}
    </Card>
  );
}
