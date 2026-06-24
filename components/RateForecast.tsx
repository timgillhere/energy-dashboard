"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Card from "./Card";
import type { Rate } from "@/lib/types";

interface DayRow {
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  elec: number | null;
  gas: number | null;
}

function buildRows(elecRates: Rate[], gasRates: Rate[]): DayRow[] {
  const now = new Date();

  const gasMap = new Map<string, number>();
  for (const r of gasRates) {
    gasMap.set(r.valid_from.slice(0, 10), r.value_inc_vat);
  }

  const sorted = [...elecRates].sort(
    (a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime()
  );

  return sorted.map((r) => {
    const from = new Date(r.valid_from);
    const to = r.valid_to ? new Date(r.valid_to) : null;
    const isToday = from <= now && (to === null || to > now);
    const isTomorrow = from > now;
    // +1h shifts UTC 23:00 → BST midnight so the date label matches the UK calendar day
    const ukDate = new Date(from.getTime() + 60 * 60 * 1000);
    return {
      label: ukDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      isToday,
      isTomorrow,
      elec: r.value_inc_vat,
      gas: gasMap.get(r.valid_from.slice(0, 10)) ?? null,
    };
  });
}

function rateColor(val: number, avg: number): string {
  if (val <= avg * 0.85) return "#39FF14";
  if (val <= avg * 1.1) return "rgba(240,238,255,0.72)";
  if (val <= avg * 1.3) return "#FFE500";
  return "#FF2D78";
}

function TableRow({ row, elecAvg, gasAvg }: { row: DayRow; elecAvg: number; gasAvg: number }) {
  const elecDelta = row.elec !== null ? row.elec - elecAvg : null;
  return (
    <tr style={{ borderTop: "1px solid rgba(255,0,110,0.12)", background: row.isToday ? "rgba(255,0,110,0.06)" : "transparent" }}>
      <td style={{ padding: "9px 16px 9px 0", color: row.isToday ? "#F0EEFF" : "rgba(240,238,255,0.55)", fontWeight: row.isToday ? 700 : 400 }}>
        {row.label}
        {row.isToday && (
          <span style={{ marginLeft: 8, fontSize: 10, background: "#FF2D78", color: "#07070F", borderRadius: 6, padding: "1px 5px", fontWeight: 700, boxShadow: "0 0 8px rgba(255,45,120,0.60)" }}>
            TODAY
          </span>
        )}
        {row.isTomorrow && (
          <span style={{ marginLeft: 8, fontSize: 10, background: "rgba(0,240,255,0.12)", color: "#00F0FF", borderRadius: 6, padding: "1px 5px", fontWeight: 600, border: "1px solid rgba(0,240,255,0.35)" }}>
            TOMORROW
          </span>
        )}
      </td>
      <td style={{ textAlign: "right", padding: "9px 16px 9px 0", fontWeight: 600, color: row.elec !== null ? rateColor(row.elec, elecAvg) : "rgba(240,238,255,0.20)" }}>
        {row.elec?.toFixed(2) ?? "—"}
      </td>
      <td style={{ textAlign: "right", padding: "9px 16px 9px 0", fontWeight: 600, color: row.gas !== null ? rateColor(row.gas, gasAvg) : "rgba(240,238,255,0.20)" }}>
        {row.gas?.toFixed(2) ?? "—"}
      </td>
      <td style={{ textAlign: "right", padding: "9px 0", fontSize: 12, color: elecDelta === null ? "rgba(240,238,255,0.20)" : elecDelta > 0 ? "#FF2D78" : "#39FF14" }}>
        {elecDelta !== null ? `${elecDelta > 0 ? "+" : ""}${elecDelta.toFixed(2)}p` : "—"}
      </td>
    </tr>
  );
}

interface RateForecastProps {
  elecRates: Rate[];
  gasRates: Rate[];
}

export default function RateForecast({ elecRates, gasRates }: RateForecastProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  if (elecRates.length === 0) return null;

  const rows = buildRows(elecRates, gasRates);
  const elecAvg = rows.reduce((s, r) => s + (r.elec ?? 0), 0) / rows.filter((r) => r.elec !== null).length;
  const gasAvg = rows.reduce((s, r) => s + (r.gas ?? 0), 0) / rows.filter((r) => r.gas !== null).length;

  const pinnedRows = rows.filter((r) => r.isTomorrow || r.isToday);
  const historyRows = rows.filter((r) => !r.isTomorrow && !r.isToday);

  const thead = (
    <thead>
      <tr>
        <th style={{ textAlign: "left", color: "rgba(240,238,255,0.35)", fontWeight: 500, paddingBottom: 8, paddingRight: 16, fontSize: 12 }}>Date</th>
        <th style={{ textAlign: "right", color: "#00F0FF", fontWeight: 500, paddingBottom: 8, paddingRight: 16, fontSize: 12 }}>⚡ Elec p/kWh</th>
        <th style={{ textAlign: "right", color: "#BF5FFF", fontWeight: 500, paddingBottom: 8, paddingRight: 16, fontSize: 12 }}>🔥 Gas p/kWh</th>
        <th style={{ textAlign: "right", color: "rgba(240,238,255,0.35)", fontWeight: 500, paddingBottom: 8, fontSize: 12 }}>vs avg</th>
      </tr>
    </thead>
  );

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Rates
        </p>
        <span style={{ color: "rgba(240,238,255,0.30)", fontSize: 11 }}>Tracker publishes 1 day ahead only</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          {thead}
          <tbody>
            {pinnedRows.map((row, i) => (
              <TableRow key={i} row={row} elecAvg={elecAvg} gasAvg={gasAvg} />
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => setHistoryOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(240,238,255,0.35)",
          fontSize: 12,
          padding: "6px 0",
          width: "100%",
        }}
      >
        <ChevronDown
          size={14}
          style={{ transition: "transform 0.2s", transform: historyOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
        {historyOpen ? "Hide" : "Show"} 14-day history
        {!historyOpen && (
          <span style={{ marginLeft: "auto", color: "rgba(240,238,255,0.30)" }}>
            14-day avg: ⚡ {elecAvg.toFixed(2)}p · 🔥 {gasAvg.toFixed(2)}p
          </span>
        )}
      </button>

      {historyOpen && (
        <div style={{ overflowX: "auto", marginTop: 4 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {historyRows.map((row, i) => (
                <TableRow key={i} row={row} elecAvg={elecAvg} gasAvg={gasAvg} />
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid rgba(255,0,110,0.20)" }}>
                <td style={{ padding: "9px 16px 0 0", color: "rgba(240,238,255,0.35)", fontSize: 12 }}>14-day avg</td>
                <td style={{ textAlign: "right", padding: "9px 16px 0 0", color: "rgba(240,238,255,0.55)", fontSize: 12 }}>{elecAvg.toFixed(2)}</td>
                <td style={{ textAlign: "right", padding: "9px 16px 0 0", color: "rgba(240,238,255,0.55)", fontSize: 12 }}>{gasAvg.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
