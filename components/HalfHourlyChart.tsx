"use client";

import { useEffect, useRef } from "react";
import { Chart } from "chart.js";
import "@/lib/chartSetup";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import { SLOT_LABELS, buildHalfHourlySlots, getRateForTime } from "@/lib/dataUtils";
import type { ConsumptionInterval, Rate } from "@/lib/types";
import { CHART_DEFAULTS } from "@/lib/chartSetup";

interface HalfHourlyChartProps {
  electricityData: ConsumptionInterval[];
  gasData: ConsumptionInterval[];
  elecRates: Rate[];
  gasRates: Rate[];
  selectedDate: Date;
  todayRate: number | null;
}

export default function HalfHourlyChart({
  electricityData,
  gasData,
  elecRates,
  gasRates,
  selectedDate,
  todayRate,
}: HalfHourlyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const dateKey = selectedDate.toISOString().slice(0, 10);
  const isToday = dateKey === new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!canvasRef.current) return;

    const elecSlots = buildHalfHourlySlots(electricityData, dateKey);
    const gasSlots = buildHalfHourlySlots(gasData, dateKey);

    const hasData = elecSlots.some((v) => v !== null) || gasSlots.some((v) => v !== null);
    if (!hasData) {
      chartRef.current?.destroy();
      chartRef.current = null;
      return;
    }

    // Find current slot if today
    const now = new Date();
    const currentSlot = isToday ? Math.floor(now.getHours() * 2 + now.getMinutes() / 30) : -1;

    // Background colors: highlight current slot
    const elecColors = elecSlots.map((_, i) =>
      i === currentSlot ? "rgba(163,230,53,1)" : "rgba(163,230,53,0.55)"
    );
    const gasColors = gasSlots.map((_, i) =>
      i === currentSlot ? "rgba(249,115,22,1)" : "rgba(249,115,22,0.55)"
    );

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: SLOT_LABELS,
        datasets: [
          {
            label: "Electricity (kWh)",
            data: elecSlots.map((v) => v ?? 0),
            backgroundColor: elecColors,
            borderRadius: 3,
            barPercentage: 0.9,
            categoryPercentage: 0.55,
          },
          {
            label: "Gas (kWh)",
            data: gasSlots.map((v) => v ?? 0),
            backgroundColor: gasColors,
            borderRadius: 3,
            barPercentage: 0.9,
            categoryPercentage: 0.55,
          },
        ],
      },
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
              title: (items) => `${SLOT_LABELS[items[0].dataIndex]} – ${SLOT_LABELS[Math.min(items[0].dataIndex + 1, 47)]}`,
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
  }, [electricityData, gasData, dateKey, isToday]);

  const elecSlots = buildHalfHourlySlots(electricityData, dateKey);
  const gasSlots = buildHalfHourlySlots(gasData, dateKey);
  const totalElec = elecSlots.reduce<number>((s, v) => s + (v ?? 0), 0);
  const totalGas = gasSlots.reduce<number>((s, v) => s + (v ?? 0), 0);
  const rate = todayRate ?? 0;
  const elecCost = (totalElec * rate) / 100;
  const hasData = elecSlots.some((v) => v !== null) || gasSlots.some((v) => v !== null);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Half-hourly Usage
          </p>
          <InfoTip
            content="Your smart meter's half-hourly consumption for the selected day. Each bar is a 30-minute slot. The brighter bar is the current slot (today only)."
            width={220}
          />
        </div>
        {hasData && (
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
            <span>
              <span style={{ color: "#a3e635", fontWeight: 700 }}>{totalElec.toFixed(2)}</span> kWh elec
            </span>
            <span>
              <span style={{ color: "#f97316", fontWeight: 700 }}>{totalGas.toFixed(2)}</span> kWh gas
            </span>
            {rate > 0 && (
              <span>
                <span style={{ color: "#ededed", fontWeight: 700 }}>£{elecCost.toFixed(2)}</span> elec cost
              </span>
            )}
          </div>
        )}
      </div>

      {hasData ? (
        <div style={{ height: 200, position: "relative" }}>
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 13 }}>
          No consumption data for{" "}
          {selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} — data may not have arrived yet.
        </div>
      )}
    </Card>
  );
}
