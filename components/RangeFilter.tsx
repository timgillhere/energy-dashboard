"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Tooltip } from "./Tooltip";

export type Preset = "1D" | "7D" | "30D" | "90D" | "custom";

interface RangeFilterProps {
  preset: Preset;
  selectedDate: Date;
  onPreset: (p: Preset) => void;
  onDayChange: (d: Date) => void;
  customFrom?: string;
  customTo?: string;
  onCustomChange?: (from: string, to: string) => void;
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "1D", label: "Day" },
  { id: "7D", label: "7 days" },
  { id: "30D", label: "30 days" },
  { id: "90D", label: "90 days" },
  { id: "custom", label: "Custom" },
];

function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function toInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function RangeFilter({ preset, selectedDate, onPreset, onDayChange, customFrom, customTo, onCustomChange }: RangeFilterProps) {
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isYesterday = selectedDate.toDateString() === yesterday().toDateString();
  const todayStr = toInputValue(new Date());

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
    color: "rgba(240,238,255,0.60)",
    transition: "all 0.15s",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "rgba(255,0,110,0.15)",
    borderColor: "#FF2D78",
    color: "#FF2D78",
    boxShadow: "0 0 10px rgba(255,45,120,0.30)",
  };

  const dateInputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,0,110,0.35)",
    borderRadius: 10,
    padding: "5px 10px",
    color: "#F0EEFF",
    fontSize: 12,
    outline: "none",
    colorScheme: "dark",
    cursor: "pointer",
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
            style={preset === p.id ? { ...btnActive, display: "flex", alignItems: "center", gap: 5 } : { ...btnBase, display: "flex", alignItems: "center", gap: 5 }}
          >
            {p.id === "custom" && <Calendar size={11} />}
            {p.label}
          </button>
        ))}
      </div>

      {preset !== "custom" && (
        <Tooltip content="Select 'Day' to navigate by date" side="bottom" width={170}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: preset === "1D" ? 1 : 0.35,
              pointerEvents: preset === "1D" ? "auto" : "none",
            }}
          >
            <button onClick={() => stepDay(-1)} style={{ ...btnBase, padding: "6px 10px" }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: "rgba(240,238,255,0.72)", minWidth: 90, textAlign: "center" }}>
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
        </Tooltip>
      )}

      {preset === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 12 }}>From</span>
          <input
            type="date"
            value={customFrom ?? ""}
            max={customTo || todayStr}
            onChange={(e) => onCustomChange?.(e.target.value, customTo ?? e.target.value)}
            style={dateInputStyle}
          />
          <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 12 }}>To</span>
          <input
            type="date"
            value={customTo ?? ""}
            min={customFrom ?? ""}
            max={todayStr}
            onChange={(e) => onCustomChange?.(customFrom ?? e.target.value, e.target.value)}
            style={dateInputStyle}
          />
        </div>
      )}
    </div>
  );
}
