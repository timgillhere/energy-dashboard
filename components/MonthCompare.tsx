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

function monthName(yyyyMm: string): string {
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

  const now = new Date();
  const todayDay = now.getDate(); // e.g. 29

  // Current month YYYY-MM and last month YYYY-MM
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth(); // 0-indexed
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const thisKey = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}`;
  const lastKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // This month days (all data we have so far)
  const thisDays = yearCosts.filter((d) => d.dateKey.startsWith(thisKey));

  // Last month: same number of days (e.g. if today is the 29th, use days 1–28 of last month)
  // Use todayDay - 1 because today may be incomplete
  const compareDayCount = todayDay - 1;
  const lastDays = yearCosts.filter((d) => {
    if (!d.dateKey.startsWith(lastKey)) return false;
    const day = parseInt(d.dateKey.slice(8), 10);
    return day <= compareDayCount;
  });

  const thisTotal = thisDays.reduce((s, d) => s + d.total, 0);
  const lastTotal = lastDays.reduce((s, d) => s + d.total, 0);
  const thisElecCost = thisDays.reduce((s, d) => s + d.electricityCost, 0);
  const thisGasCost = thisDays.reduce((s, d) => s + d.gasCost, 0);
  const thisElecKwh = thisDays.reduce((s, d) => s + d.electricityKwh, 0);
  const thisGasKwh = thisDays.reduce((s, d) => s + d.gasKwh, 0);

  const hasThisData = thisDays.length > 0;
  const hasLastData = lastDays.length > 0;

  const pct = hasLastData && lastTotal > 0
    ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100)
    : null;
  const direction = pct !== null ? (pct > 2 ? "up" : pct < -2 ? "down" : "flat") : null;

  const thisMonthName = monthName(thisKey);
  const lastMonthName = monthName(lastKey);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {thisMonthName} so far
          </p>
          <p style={{ color: "rgba(240,238,255,0.40)", fontSize: 11, marginTop: 2 }}>
            Based on available meter readings
          </p>
        </div>

        {direction !== null && pct !== null && hasLastData && (
          <div style={{ textAlign: "right" }}>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: direction === "up" ? "#FF2D78" : direction === "down" ? "#39FF14" : "rgba(240,238,255,0.55)",
              background: direction === "up" ? "rgba(255,45,120,0.10)" : direction === "down" ? "rgba(57,255,20,0.10)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${direction === "up" ? "rgba(255,45,120,0.35)" : direction === "down" ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 10,
              padding: "4px 10px",
              display: "inline-block",
            }}>
              {direction === "up" ? `↑ ${pct}%` : direction === "down" ? `↓ ${Math.abs(pct)}%` : "≈ on track"}
            </span>
            <p style={{ color: "rgba(240,238,255,0.35)", fontSize: 10, marginTop: 3 }}>
              vs {lastMonthName} days 1–{compareDayCount}
            </p>
          </div>
        )}
      </div>

      {!hasThisData ? (
        <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 13, marginTop: 12 }}>No data yet for {thisMonthName}.</p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "14px 0 16px" }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#F0EEFF", letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(240,238,255,0.25)" }}>
              £{thisTotal.toFixed(2)}
            </span>
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
