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

export default function RangeFilter({ preset, selectedDate, onPreset, onDayChange }: RangeFilterProps) {
  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  function stepDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) {
      onDayChange(d);
      onPreset("1D");
    }
  }

  const btnBase: React.CSSProperties = {
    background: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    color: "#6b7280",
    transition: "all 0.15s",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "#1e2e0e",
    borderColor: "#a3e63555",
    color: "#a3e635",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Preset buttons */}
      <div style={{ display: "flex", gap: 4, background: "#0f0f0f", borderRadius: 12, padding: 4, border: "1px solid #1e1e1e" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              onPreset(p.id);
              if (p.id === "1D") onDayChange(new Date());
            }}
            style={preset === p.id ? btnActive : btnBase}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Day navigator — visible when in 1D mode */}
      {preset === "1D" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => stepDay(-1)}
            style={{ ...btnBase, padding: "6px 10px" }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 90, textAlign: "center" }}>
            {isToday
              ? "Today"
              : selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
          <button
            onClick={() => stepDay(1)}
            disabled={isToday}
            style={{ ...btnBase, padding: "6px 10px", opacity: isToday ? 0.3 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
          {!isToday && (
            <button onClick={() => { onDayChange(new Date()); onPreset("1D"); }} style={{ ...btnBase, color: "#a3e635", borderColor: "#a3e63544" }}>
              Jump to today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
