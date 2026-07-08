"use client";

import { useMemo, useState } from "react";
import Card from "./Card";
import { InfoTip } from "./Tooltip";
import LoadingGif from "./LoadingGif";
import { buildWeeklyHeatmap, SLOT_LABELS } from "@/lib/dataUtils";
import type { ConsumptionInterval } from "@/lib/types";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface WeeklyHeatmapProps {
  electricityData: ConsumptionInterval[];
  loading?: boolean;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Time label rows: show label every 6 slots (3h intervals)
const TIME_LABEL_SLOTS = new Set([0, 6, 12, 18, 24, 30, 36, 42]);

export default function WeeklyHeatmap({ electricityData, loading }: WeeklyHeatmapProps) {
  const { isMobile } = useBreakpoint();
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const grid = useMemo(() => buildWeeklyHeatmap(electricityData), [electricityData]);

  const maxVal = useMemo(() => {
    let max = 0;
    for (const row of grid) for (const v of row) if (v > max) max = v;
    return max || 1;
  }, [grid]);

  if (loading) {
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Weekly Rhythm
          </p>
          <InfoTip
            content="Average electricity consumption by time of day and day of week, across all your available history. Brighter = higher average use. Reveals your weekly lifestyle pattern."
            width={230}
          />
        </div>
        <LoadingGif height={280} />
      </Card>
    );
  }

  if (electricityData.length === 0) return null;

  const cellHeight = isMobile ? 3 : 5;
  const labelWidth = 36;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Weekly Rhythm
        </p>
        <InfoTip
          content="Average electricity consumption by time of day and day of week, across all your available history. Brighter = higher average use. Reveals your weekly lifestyle pattern."
          width={230}
        />
      </div>

      <div style={{ position: "relative" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: `${labelWidth}px repeat(7, 1fr)`, marginBottom: 4 }}>
          <div />
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", color: "rgba(240,238,255,0.50)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid rows (one per half-hour slot) */}
        <div style={{ display: "grid", gridTemplateColumns: `${labelWidth}px repeat(7, 1fr)`, gap: 1 }}>
          {Array.from({ length: 48 }, (_, slot) => (
            <>
              {/* Time label */}
              <div
                key={`label-${slot}`}
                style={{
                  height: cellHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 4,
                }}
              >
                {TIME_LABEL_SLOTS.has(slot) && !isMobile && (
                  <span style={{ color: "rgba(240,238,255,0.35)", fontSize: 9, lineHeight: 1, whiteSpace: "nowrap" }}>
                    {SLOT_LABELS[slot]}
                  </span>
                )}
              </div>

              {/* 7 day cells for this slot */}
              {Array.from({ length: 7 }, (_, dow) => {
                const val = grid[dow][slot];
                const intensity = val > 0 ? (val / maxVal) * 0.88 + 0.08 : 0.03;
                return (
                  <div
                    key={`cell-${slot}-${dow}`}
                    style={{
                      height: cellHeight,
                      background: `rgba(0,240,255,${intensity.toFixed(3)})`,
                      borderRadius: 1,
                      cursor: "crosshair",
                    }}
                    onMouseEnter={(e) => {
                      if (val > 0) {
                        setTooltip({
                          text: `${DAYS[dow]} ${SLOT_LABELS[slot]}  avg ${val.toFixed(3)} kWh`,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onMouseMove={(e) => {
                      if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
                    }}
                  />
                );
              })}
            </>
          ))}
        </div>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            style={{
              position: "fixed",
              left: tooltip.x + 12,
              top: tooltip.y - 28,
              background: "#0A0A18",
              border: "1px solid rgba(0,240,255,0.45)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              color: "rgba(240,238,255,0.85)",
              pointerEvents: "none",
              zIndex: 300,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.80)",
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Colour scale legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <span style={{ color: "rgba(240,238,255,0.35)", fontSize: 10 }}>Low</span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: "linear-gradient(to right, rgba(0,240,255,0.08), rgba(0,240,255,0.96))",
          }}
        />
        <span style={{ color: "rgba(240,238,255,0.35)", fontSize: 10 }}>High ({maxVal.toFixed(3)} kWh)</span>
      </div>
    </Card>
  );
}
