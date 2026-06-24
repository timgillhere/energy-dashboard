"use client";

import { useEffect, useRef } from "react";
import { Chart } from "chart.js";
import "@/lib/chartSetup";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import { buildAveragePattern, SLOT_LABELS } from "@/lib/dataUtils";
import type { ConsumptionInterval } from "@/lib/types";
import { CHART_DEFAULTS } from "@/lib/chartSetup";

interface UsagePatternsProps {
  electricityData: ConsumptionInterval[];
  gasData: ConsumptionInterval[];
}

export default function UsagePatterns({ electricityData, gasData }: UsagePatternsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const elecPattern = buildAveragePattern(electricityData);
    const gasPattern = buildAveragePattern(gasData);

    const peakSlot = elecPattern.indexOf(Math.max(...elecPattern));

    const elecColors = elecPattern.map((_, i) =>
      i === peakSlot ? "rgba(0,240,255,1)" : "rgba(0,240,255,0.40)"
    );

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: SLOT_LABELS,
        datasets: [
          {
            label: "Avg electricity (kWh)",
            data: elecPattern.map((v) => parseFloat(v.toFixed(4))),
            backgroundColor: elecColors,
            borderRadius: 2,
            barPercentage: 0.95,
            categoryPercentage: 0.6,
            yAxisID: "y",
          },
          {
            label: "Avg gas (kWh)",
            data: gasPattern.map((v) => parseFloat(v.toFixed(4))),
            backgroundColor: "rgba(191,95,255,0.40)",
            borderRadius: 2,
            barPercentage: 0.95,
            categoryPercentage: 0.6,
            yAxisID: "y",
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
              title: (items) => `${SLOT_LABELS[items[0].dataIndex]}`,
              label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(3)} kWh`,
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
              callback: (v) => `${v} kWh`,
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [electricityData, gasData]);

  const elecPattern = buildAveragePattern(electricityData);
  const peakSlot = elecPattern.indexOf(Math.max(...elecPattern));
  const peakTime = SLOT_LABELS[peakSlot];
  const hasData = electricityData.length > 0;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Usage Patterns
        </p>
        <InfoTip
          content="Your average electricity and gas consumption by time of day, calculated across all available data. Helps identify when you habitually use the most energy."
          width={220}
        />
      </div>

      {hasData && (
        <p style={{ color: "rgba(240,238,255,0.60)", fontSize: 12, marginBottom: 12 }}>
          Your peak electricity use is typically around{" "}
          <span style={{ color: "#00F0FF", fontWeight: 600, textShadow: "0 0 8px rgba(0,240,255,0.50)" }}>{peakTime}</span>
        </p>
      )}

      {hasData ? (
        <div style={{ height: 160, position: "relative" }}>
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,238,255,0.52)", fontSize: 13 }}>
          No consumption data yet.
        </div>
      )}
    </Card>
  );
}
