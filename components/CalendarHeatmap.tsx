"use client";

import { useMemo, useState } from "react";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import LoadingGif from "./LoadingGif";
import type { DayCost } from "@/lib/dataUtils";

interface CalendarHeatmapProps {
  days: DayCost[];
  loading?: boolean;
}

const CELL = 12;
const GAP = 2;
const LABEL_W = 28;
const CELL_STEP = CELL + GAP;

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

const COLORS = [
  "rgba(255,0,110,0.06)",
  "rgba(255,0,110,0.18)",
  "rgba(255,0,110,0.38)",
  "rgba(255,0,110,0.60)",
  "rgba(255,0,110,0.82)",
  "#FF2D78",
];

function getLevel(value: number, thresholds: number[]): number {
  if (value <= 0 || thresholds.length === 0) return 0;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (value <= thresholds[i]) return i + 1;
  }
  return 5;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendar(days: DayCost[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 364);

  // Snap start back to Monday
  const startDate = new Date(oneYearAgo);
  const dow = startDate.getDay();
  startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));

  // Build index
  const index = new Map<string, DayCost>();
  for (const d of days) index.set(d.dateKey, d);

  // Quintile thresholds from non-zero totals
  const nonZero = days.filter((d) => d.total > 0).map((d) => d.total).sort((a, b) => a - b);
  const thresholds: number[] = [];
  if (nonZero.length >= 5) {
    for (let q = 1; q <= 4; q++) {
      thresholds.push(nonZero[Math.floor((q / 5) * nonZero.length)]);
    }
  }

  // Build weeks
  const weeks: { date: Date; inRange: boolean }[][] = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const week: { date: Date; inRange: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cur);
      week.push({ date, inRange: date >= oneYearAgo && date <= today });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, index, thresholds, today };
}

export default function CalendarHeatmap({ days, loading }: CalendarHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const { weeks, index, thresholds, today } = useMemo(() => buildCalendar(days), [days]);

  if (loading) {
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Annual Spend Calendar
          </p>
          <InfoTip
            content="Daily total energy spend over the past year. Each square is one day — brighter pink = higher spend. Shows seasonal patterns, outliers, and gaps in smart meter data."
            width={240}
          />
        </div>
        <LoadingGif height={160} />
      </Card>
    );
  }

  if (days.length === 0) return null;

  const maxTotal = days.reduce((m, d) => Math.max(m, d.total), 0);

  // Month labels: first cell in each month
  const monthLabels: { colIndex: number; label: string }[] = [];
  weeks.forEach((week, colIndex) => {
    for (const { date, inRange } of week) {
      if (inRange && date.getDate() === 1) {
        monthLabels.push({
          colIndex,
          label: date.toLocaleDateString("en-GB", { month: "short" }),
        });
        break;
      }
    }
  });

  const totalWidth = LABEL_W + weeks.length * CELL_STEP;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Annual Spend Calendar
        </p>
        <InfoTip
          content="Daily total energy spend over the past year. Each square is one day — brighter pink = higher spend. Shows seasonal patterns, outliers, and gaps in smart meter data."
          width={240}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ width: totalWidth, position: "relative" }}>

          {/* Month labels */}
          <div style={{ marginLeft: LABEL_W, position: "relative", height: 18, marginBottom: 2 }}>
            {monthLabels.map(({ colIndex, label }) => (
              <span
                key={colIndex}
                style={{
                  position: "absolute",
                  left: colIndex * CELL_STEP,
                  fontSize: 9,
                  color: "rgba(240,238,255,0.50)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "flex" }}>
            {/* Day-of-week labels */}
            <div style={{ width: LABEL_W, flexShrink: 0, display: "flex", flexDirection: "column", gap: GAP }}>
              {DAY_LABELS.map((lbl, i) => (
                <div
                  key={i}
                  style={{
                    height: CELL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 4,
                  }}
                >
                  {lbl && (
                    <span style={{ fontSize: 9, color: "rgba(240,238,255,0.35)", lineHeight: 1 }}>
                      {lbl}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div style={{ display: "flex", gap: GAP }}>
              {weeks.map((week, colIndex) => (
                <div key={colIndex} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                  {week.map(({ date, inRange }, rowIndex) => {
                    if (!inRange) {
                      return <div key={rowIndex} style={{ width: CELL, height: CELL }} />;
                    }

                    const dateKey = toDateKey(date);
                    const dayCost = index.get(dateKey);
                    const level = dayCost ? getLevel(dayCost.total, thresholds) : 0;
                    const isToday = date.getTime() === today.getTime();

                    return (
                      <div
                        key={rowIndex}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 2,
                          background: COLORS[level],
                          boxShadow: level === 5 ? "0 0 4px rgba(255,45,120,0.60)" : "none",
                          outline: isToday ? "1px solid rgba(0,240,255,0.70)" : "none",
                          cursor: dayCost ? "crosshair" : "default",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (dayCost) {
                            const lines = [
                              date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "2-digit" }),
                              `Total: £${dayCost.total.toFixed(2)}`,
                              `Elec: £${dayCost.electricityCost.toFixed(2)}`,
                              dayCost.gasCost > 0 ? `Gas: £${dayCost.gasCost.toFixed(2)}` : "",
                            ].filter(Boolean).join("\n");
                            setTooltip({ text: lines, x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onMouseMove={(e) => {
                          if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
            <span style={{ fontSize: 10, color: "rgba(240,238,255,0.35)" }}>Less</span>
            {COLORS.map((c, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: c,
                  boxShadow: i === 5 ? "0 0 4px rgba(255,45,120,0.60)" : "none",
                  flexShrink: 0,
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: "rgba(240,238,255,0.35)" }}>More (max £{maxTotal.toFixed(2)}/day)</span>
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 70,
            background: "#0A0A18",
            border: "1px solid rgba(255,45,120,0.45)",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            color: "rgba(240,238,255,0.85)",
            pointerEvents: "none",
            zIndex: 300,
            whiteSpace: "pre",
            boxShadow: "0 4px 16px rgba(0,0,0,0.80)",
            lineHeight: 1.65,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </Card>
  );
}
