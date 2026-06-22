"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
} from "chart.js";
import Card from "./Card";
import type { ConsumptionInterval, Settings } from "@/lib/types";

Chart.register(
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

type ViewMode = "combined" | "electricity" | "gas";
type UnitMode = "cost" | "kwh";

function groupByWeek(
  data: ConsumptionInterval[],
  unitRate: number,
  standingCharge: number
): Record<string, { kwh: number; cost: number }> {
  const weeks: Record<string, { kwh: number; cost: number }> = {};
  for (const d of data) {
    const date = new Date(d.interval_start);
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { kwh: 0, cost: 0 };
    weeks[key].kwh += d.consumption;
    weeks[key].cost += (d.consumption * unitRate) / 100;
  }
  // Add pro-rated standing charge per week
  for (const key of Object.keys(weeks)) {
    weeks[key].cost += (standingCharge / 100) * 7;
  }
  return weeks;
}

interface WeeklyChartProps {
  electricityData: ConsumptionInterval[];
  gasData: ConsumptionInterval[];
  settings: Settings;
  todayRate: number | null;
}

export default function WeeklyChart({ electricityData, gasData, settings, todayRate }: WeeklyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("combined");
  const [unitMode, setUnitMode] = useState<UnitMode>("cost");

  useEffect(() => {
    if (!canvasRef.current) return;

    const elecRate = todayRate ?? 0;
    const elecWeeks = groupByWeek(electricityData, elecRate, settings.electricityStandingCharge);
    const gasWeeks = groupByWeek(gasData, settings.gasUnitRate, settings.gasStandingCharge);

    const allKeys = Array.from(
      new Set([...Object.keys(elecWeeks), ...Object.keys(gasWeeks)])
    ).sort().slice(-24);

    const labels = allKeys.map((k) => {
      const d = new Date(k);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    });

    const getValue = (week: Record<string, { kwh: number; cost: number }>, key: string) => {
      const v = week[key];
      if (!v) return 0;
      return unitMode === "cost" ? parseFloat(v.cost.toFixed(2)) : parseFloat(v.kwh.toFixed(2));
    };

    const elecValues = allKeys.map((k) => getValue(elecWeeks, k));
    const gasValues = allKeys.map((k) => getValue(gasWeeks, k));
    const combinedValues = allKeys.map((_, i) => parseFloat((elecValues[i] + gasValues[i]).toFixed(2)));

    // Rolling average (4-week)
    const avgValues = combinedValues.map((_, i) => {
      const slice = combinedValues.slice(Math.max(0, i - 3), i + 1);
      return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2));
    });

    let datasets: ChartData<"bar">["datasets"] = [];

    if (viewMode === "combined") {
      datasets = [
        {
          type: "bar" as const,
          label: "Electricity",
          data: elecValues,
          backgroundColor: "rgba(163,230,53,0.7)",
          borderRadius: 6,
          stack: "combined",
        },
        {
          type: "bar" as const,
          label: "Gas",
          data: gasValues,
          backgroundColor: "rgba(249,115,22,0.7)",
          borderRadius: 6,
          stack: "combined",
        },
        {
          type: "line" as const,
          label: "4-week avg",
          data: avgValues,
          borderColor: "#ffffff44",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 0,
          tension: 0.4,
        } as any,
      ];
    } else if (viewMode === "electricity") {
      datasets = [
        {
          type: "bar" as const,
          label: "Electricity",
          data: elecValues,
          backgroundColor: "rgba(163,230,53,0.7)",
          borderRadius: 6,
        },
      ];
    } else {
      datasets = [
        {
          type: "bar" as const,
          label: "Gas",
          data: gasValues,
          backgroundColor: "rgba(249,115,22,0.7)",
          borderRadius: 6,
        },
      ];
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#6b7280", font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: "#1e1e1e",
            borderColor: "#2a2a2a",
            borderWidth: 1,
            titleColor: "#ededed",
            bodyColor: "#9ca3af",
            callbacks: {
              label: (ctx) => {
                const y = ctx.parsed.y ?? 0;
                return unitMode === "cost"
                  ? `${ctx.dataset.label}: £${y.toFixed(2)}`
                  : `${ctx.dataset.label}: ${y.toFixed(1)} kWh`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: viewMode === "combined",
            grid: { color: "#1e1e1e" },
            ticks: { color: "#6b7280", font: { size: 10 }, maxTicksLimit: 10 },
          },
          y: {
            stacked: viewMode === "combined",
            grid: { color: "#1e1e1e" },
            ticks: {
              color: "#6b7280",
              font: { size: 10 },
              callback: (v) => (unitMode === "cost" ? `£${v}` : `${v} kWh`),
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [electricityData, gasData, settings, todayRate, viewMode, unitMode]);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#1e1e1e" : "transparent",
    border: `1px solid ${active ? "#2a2a2a" : "transparent"}`,
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    color: active ? "#ededed" : "#6b7280",
    cursor: "pointer",
  });

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Weekly Spend
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={btnStyle(viewMode === "combined")} onClick={() => setViewMode("combined")}>Combined</button>
          <button style={btnStyle(viewMode === "electricity")} onClick={() => setViewMode("electricity")}>⚡</button>
          <button style={btnStyle(viewMode === "gas")} onClick={() => setViewMode("gas")}>🔥</button>
          <div style={{ width: 1, background: "#1e1e1e", margin: "0 4px" }} />
          <button style={btnStyle(unitMode === "cost")} onClick={() => setUnitMode("cost")}>£</button>
          <button style={btnStyle(unitMode === "kwh")} onClick={() => setUnitMode("kwh")}>kWh</button>
        </div>
      </div>
      <div style={{ height: 220, position: "relative" }}>
        <canvas ref={canvasRef} />
      </div>
    </Card>
  );
}
