"use client";

import { Zap, Flame } from "lucide-react";
import Card from "./Card";
import type { DayCost } from "@/lib/dataUtils";

const SKEL: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 6,
  animation: "pulse 1.5s ease-in-out infinite",
};

interface MonthCompareProps {
  yearCosts: DayCost[];
  loading?: boolean;
}

function monthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long" });
}

export default function MonthCompare({ yearCosts, loading }: MonthCompareProps) {
  if (loading) {
    return (
      <Card>
        <div style={{ ...SKEL, height: 12, width: "55%", marginBottom: 14 }} />
        <div style={{ ...SKEL, height: 52, width: 160, marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: "rgba(0,240,255,0.03)", borderRadius: 14, padding: 12, border: "1px solid rgba(0,240,255,0.12)" }}>
            <div style={{ ...SKEL, height: 10, width: "50%", marginBottom: 12 }} />
            <div style={{ ...SKEL, height: 24, width: "65%" }} />
          </div>
          <div style={{ flex: 1, background: "rgba(191,95,255,0.03)", borderRadius: 14, padding: 12, border: "1px solid rgba(191,95,255,0.12)" }}>
            <div style={{ ...SKEL, height: 10, width: "50%", marginBottom: 12 }} />
            <div style={{ ...SKEL, height: 24, width: "65%" }} />
          </div>
        </div>
      </Card>
    );
  }

  const thisKey = monthKey(0);
  const lastKey = monthKey(-1);
  const thisLabel = monthLabel(thisKey);
  const lastLabel = monthLabel(lastKey);

  const thisMonth = yearCosts.filter((d) => d.dateKey.startsWith(thisKey));
  const lastMonth = yearCosts.filter((d) => d.dateKey.startsWith(lastKey));

  const thisTotal = thisMonth.reduce((s, d) => s + d.total, 0);
  const lastTotal = lastMonth.reduce((s, d) => s + d.total, 0);
  const thisElecCost = thisMonth.reduce((s, d) => s + d.electricityCost, 0);
  const thisGasCost = thisMonth.reduce((s, d) => s + d.gasCost, 0);
  const thisElecKwh = thisMonth.reduce((s, d) => s + d.electricityKwh, 0);
  const thisGasKwh = thisMonth.reduce((s, d) => s + d.gasKwh, 0);

  const pct = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : null;
  const direction = pct !== null ? (pct > 2 ? "up" : pct < -2 ? "down" : "flat") : null;

  const hasData = thisMonth.length > 0;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            This month vs last month
          </p>
          <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 11, marginTop: 2 }}>
            {thisLabel} vs {lastLabel}
          </p>
        </div>
        {direction !== null && pct !== null && (
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: direction === "up" ? "#FF2D78" : direction === "down" ? "#39FF14" : "rgba(240,238,255,0.55)",
            background: direction === "up" ? "rgba(255,45,120,0.10)" : direction === "down" ? "rgba(57,255,20,0.10)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${direction === "up" ? "rgba(255,45,120,0.35)" : direction === "down" ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 10,
            padding: "4px 10px",
          }}>
            {direction === "up" ? `↑ ${pct}%` : direction === "down" ? `↓ ${Math.abs(pct)}%` : "≈ on track"}
          </span>
        )}
      </div>

      {!hasData ? (
        <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 13 }}>No data yet for {thisLabel}.</p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#F0EEFF", letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(240,238,255,0.25)" }}>
              £{thisTotal.toFixed(2)}
            </span>
            <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 14 }}>month to date</span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "rgba(0,240,255,0.05)", borderRadius: 14, padding: 12, border: "1px solid rgba(0,240,255,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Zap size={14} color="#00F0FF" />
                <span style={{ color: "rgba(0,240,255,0.85)", fontSize: 12, fontWeight: 600 }}>Electricity</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#F0EEFF", marginBottom: 2 }}>
                £{thisElecCost.toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: "rgba(240,238,255,0.55)" }}>{thisElecKwh.toFixed(0)} kWh</p>
            </div>

            <div style={{ flex: 1, background: "rgba(191,95,255,0.05)", borderRadius: 14, padding: 12, border: "1px solid rgba(191,95,255,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color="#BF5FFF" />
                <span style={{ color: "rgba(191,95,255,0.95)", fontSize: 12, fontWeight: 600 }}>Gas</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#F0EEFF", marginBottom: 2 }}>
                £{thisGasCost.toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: "rgba(240,238,255,0.55)" }}>{thisGasKwh.toFixed(0)} kWh</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
