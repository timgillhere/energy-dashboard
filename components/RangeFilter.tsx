"use client";

import { Calendar } from "lucide-react";

export type Preset = "1D" | "7D" | "30D" | "90D" | "custom";

interface RangeFilterProps {
  preset: Preset;
  onPreset: (p: Preset) => void;
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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RangeFilter({ preset, onPreset, customFrom, customTo, onCustomChange }: RangeFilterProps) {
  const todayStr = toDateStr(new Date());

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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 4, background: "rgba(255,0,110,0.05)", borderRadius: 14, padding: 4, border: "1px solid rgba(255,0,110,0.20)" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPreset(p.id)}
            style={preset === p.id ? { ...btnActive, display: "flex", alignItems: "center", gap: 5 } : { ...btnBase, display: "flex", alignItems: "center", gap: 5 }}
          >
            {p.id === "custom" && <Calendar size={11} />}
            {p.label}
          </button>
        ))}
      </div>

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
