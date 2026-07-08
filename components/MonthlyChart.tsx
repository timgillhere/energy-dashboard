"use client";

import { useEffect, useRef } from "react";
import { Chart } from "chart.js";
import "@/lib/chartSetup";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import LoadingGif from "./LoadingGif";
import type { DayCost } from "@/lib/dataUtils";
import { CHART_DEFAULTS } from "@/lib/chartSetup";

interface MonthlyChartProps {
  days: DayCost[];
  loading?: boolean;
}

function groupByMonth(days: DayCost[]) {
  const map = new Map<string, { label: string; elec: number; gas: number; partial: boolean }>();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (const d of days) {
    const key = d.dateKey.slice(0, 7);
    const label = new Date(d.dateKey + "T12:00:00").toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    if (!map.has(key)) map.set(key, { label, elec: 0, gas: 0, partial: key === currentMonth });
    const m = map.get(key)!;
    m.elec += d.electricityCost;
    m.gas += d.gasCost;
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export default function MonthlyChart({ days, loading }: MonthlyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || days.length === 0) return;

    const months = groupByMonth(days);
    const labels = months.map((m) => m.partial ? `${m.label}*` : m.label);
    const elecData = months.map((m) => parseFloat(m.elec.toFixed(2)));
    const gasData = months.map((m) => parseFloat(m.gas.toFixed(2)));

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Electricity (£)",
            data: elecData,
            backgroundColor: "rgba(0,240,255,0.55)",
            borderRadius: 3,
            stack: "cost",
            order: 1,
          },
          {
            label: "Gas (£)",
            data: gasData,
            backgroundColor: "rgba(191,95,255,0.55)",
            borderRadius: 3,
            stack: "cost",
            order: 1,
          },
        ],
      },
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
              label: (ctx) => ` ${ctx.dataset.label}: £${(ctx.parsed.y as number).toFixed(2)}`,
              footer: (items) => {
                const total = items.reduce((s, i) => s + (i.parsed.y as number), 0);
                return `Total: £${total.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: CHART_DEFAULTS.gridColor },
            ticks: {
              color: CHART_DEFAULTS.tickColor,
              font: { size: 10 },
              maxRotation: 0,
            },
          },
          y: {
            stacked: true,
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
  }, [days]);

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
        Monthly Spend
      </p>
      <InfoTip
        content="Monthly energy spend over the past 12 months. Electricity and gas stacked. The current month (*) is partial and will increase. Days outside the 14-day rate window use an estimated rate."
        width={250}
      />
    </div>
  );

  if (loading) {
    return (
      <Card>
        {header}
        <LoadingGif height={240} />
      </Card>
    );
  }

  if (days.length === 0) return null;

  return (
    <Card>
      {header}
      <div style={{ height: 240, position: "relative" }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ color: "rgba(240,238,255,0.38)", fontSize: 11, marginTop: 8 }}>
        * Current month — partial data
      </p>
    </Card>
  );
}
