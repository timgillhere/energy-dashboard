"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type Preset = "1D" | "7D" | "30D" | "90D";

interface RangeFilterProps {
  preset: Preset;
  selectedDate: Date;
  onPreset: (p: Preset) => void;
  onDayChange: (d: Date) => void;
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "1D", label: "Day" },
  { id: "7D", label: "7 days" },
  { id: "30D", label: "30 days" },
  { id: "90D", label: "90 days" },
];

function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

export default function RangeFilter({ preset, selectedDate, onPreset, onDayChange }: RangeFilterProps) {
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isYesterday = selectedDate.toDateString() === yesterday().toDateString();

  function stepDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) { onDayChange(d); onPreset("1D"); }
  }

  const btnBase: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(255,0,110,0.25)",
    borderRadius: 10,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    color: "rgba(240,238,255,0.45)",
    transition: "all 0.15s",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "rgba(255,0,110,0.15)",
    borderColor: "#FF2D78",
    color: "#FF2D78",
    boxShadow: "0 0 10px rgba(255,45,120,0.30)",
  };

  function dayLabel() {
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 4, background: "rgba(255,0,110,0.05)", borderRadius: 14, padding: 4, border: "1px solid rgba(255,0,110,0.20)" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              onPreset(p.id);
              if (p.id === "1D") onDayChange(yesterday());
            }}
            style={preset === p.id ? btnActive : btnBase}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "1D" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => stepDay(-1)} style={{ ...btnBase, padding: "6px 10px" }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: "rgba(240,238,255,0.60)", minWidth: 90, textAlign: "center" }}>
            {dayLabel()}
          </span>
          <button onClick={() => stepDay(1)} disabled={isToday} style={{ ...btnBase, padding: "6px 10px", opacity: isToday ? 0.3 : 1 }}>
            <ChevronRight size={14} />
          </button>
          {!isYesterday && !isToday && (
            <button
              onClick={() => { onDayChange(yesterday()); onPreset("1D"); }}
              style={{ ...btnBase, color: "#00F0FF", borderColor: "rgba(0,240,255,0.40)", boxShadow: "0 0 8px rgba(0,240,255,0.20)" }}
            >
              Jump to yesterday
            </button>
          )}
        </div>
      )}
    </div>
  );
}
