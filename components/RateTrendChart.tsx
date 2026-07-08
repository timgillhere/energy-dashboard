"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js";
import "@/lib/chartSetup";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import LoadingGif from "./LoadingGif";
import type { Rate } from "@/lib/types";
import { CHART_DEFAULTS } from "@/lib/chartSetup";

interface RateTrendChartProps {
  elecRates: Rate[];
  gasRates: Rate[];
  loading?: boolean;
}

type Fuel = "electricity" | "gas";

function buildDailyRates(rates: Rate[]): { label: string; value: number; dateKey: string }[] {
  // Filter to past rates only, one per calendar day (UK: UTC+1 approx)
  const now = new Date();
  const seen = new Set<string>();
  const result: { label: string; value: number; dateKey: string }[] = [];

  const sorted = [...rates]
    .filter((r) => new Date(r.valid_from) <= now)
    .sort((a, b) => new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime());

  for (const r of sorted) {
    const ukDate = new Date(new Date(r.valid_from).getTime() + 60 * 60 * 1000);
    const key = ukDate.toISOString().slice(0, 10);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        label: ukDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value: r.value_inc_vat,
        dateKey: key,
      });
    }
  }
  return result;
}

function rollingAvg(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

export default function RateTrendChart({ elecRates, gasRates, loading }: RateTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [fuel, setFuel] = useState<Fuel>("electricity");

  useEffect(() => {
    if (!canvasRef.current) return;

    const rates = fuel === "electricity" ? elecRates : gasRates;
    if (rates.length === 0) return;

    const daily = buildDailyRates(rates);
    if (daily.length === 0) return;

    const values = daily.map((d) => d.value);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const rolling = rollingAvg(values, 7);

    const accentColor = fuel === "electricity" ? "#00F0FF" : "#BF5FFF";
    const barColors = values.map((v) =>
      v <= avg * 0.85
        ? "rgba(57,255,20,0.75)"
        : v <= avg * 1.15
        ? `${accentColor}99`
        : "rgba(255,45,120,0.75)"
    );

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: daily.map((d) => d.label),
        datasets: [
          {
            label: `${fuel === "electricity" ? "Electricity" : "Gas"} rate (p/kWh)`,
            data: values,
            backgroundColor: barColors,
            borderRadius: 2,
            barPercentage: 0.85,
            categoryPercentage: 0.7,
            order: 2,
          },
          {
            label: "7-day avg",
            data: rolling,
            type: "line" as const,
            borderColor: accentColor,
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            order: 1,
            spanGaps: true,
          },
          {
            label: `Period avg (${avg.toFixed(2)}p)`,
            data: daily.map(() => avg),
            type: "line" as const,
            borderColor: "rgba(240,238,255,0.25)",
            backgroundColor: "transparent",
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0,
            order: 1,
          },
        ] as any,
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
            filter: (item) => item.datasetIndex < 2,
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                if (ctx.datasetIndex === 0) {
                  const pct = ((v - avg) / avg) * 100;
                  const sign = pct > 0 ? "+" : "";
                  return ` ${v.toFixed(2)}p/kWh  (${sign}${pct.toFixed(0)}% vs avg)`;
                }
                return ` 7-day avg: ${v.toFixed(2)}p`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: CHART_DEFAULTS.gridColor },
            ticks: {
              color: CHART_DEFAULTS.tickColor,
              font: { size: 9 },
              maxTicksLimit: 12,
              maxRotation: 0,
            },
          },
          y: {
            grid: { color: CHART_DEFAULTS.gridColor },
            ticks: {
              color: CHART_DEFAULTS.tickColor,
              font: { size: 10 },
              callback: (v) => `${v}p`,
            },
            beginAtZero: false,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [elecRates, gasRates, fuel]);

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

  const hasData = (fuel === "electricity" ? elecRates : gasRates).length > 0;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Rate History
          </p>
          <InfoTip
            content="Daily Tracker unit rate over the past 90 days. Bars show the actual published rate; the line is a 7-day rolling average. Green = below average, red = above average."
            width={230}
          />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <button style={btnStyle(fuel === "electricity")} onClick={() => setFuel("electricity")}>⚡ Electricity</button>
          {gasRates.length > 0 && (
            <button style={btnStyle(fuel === "gas")} onClick={() => setFuel("gas")}>🔥 Gas</button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingGif height={220} />
      ) : hasData ? (
        <div style={{ height: 220, position: "relative" }}>
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,238,255,0.52)", fontSize: 13 }}>
          No rate data — configure your tariff in Settings.
        </div>
      )}
    </Card>
  );
}
