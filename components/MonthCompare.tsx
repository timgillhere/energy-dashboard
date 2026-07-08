"use client";

import { Zap, Flame, TrendingUp } from "lucide-react";
import Card from "./Card";
import LoadingGif from "./LoadingGif";
import type { DayCost } from "@/lib/dataUtils";

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
    return <Card><LoadingGif height={202} /></Card>;
  }

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const thisKey = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}`;
  const lastKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const thisDays = yearCosts.filter((d) => d.dateKey.startsWith(thisKey));
  const thisTotal = thisDays.reduce((s, d) => s + d.total, 0);
  const thisElecCost = thisDays.reduce((s, d) => s + d.electricityCost, 0);
  const thisGasCost = thisDays.reduce((s, d) => s + d.gasCost, 0);
  const thisElecKwh = thisDays.reduce((s, d) => s + d.electricityKwh, 0);
  const thisGasKwh = thisDays.reduce((s, d) => s + d.gasKwh, 0);

  // Last month full total
  const lastFullDays = yearCosts.filter((d) => d.dateKey.startsWith(lastKey));
  const lastFullTotal = lastFullDays.reduce((s, d) => s + d.total, 0);
  const hasLastFull = lastFullDays.length >= 20;

  // Projection: daily average × days in month
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const dailyAvg = thisDays.length > 0 ? thisTotal / thisDays.length : 0;
  const projected = dailyAvg * daysInMonth;
  const showProjection = thisDays.length >= 5;
  const projectionConfident = thisDays.length >= 15;

  // Badge compares projection vs last month full
  const projPct = showProjection && hasLastFull && lastFullTotal > 0
    ? Math.round(((projected - lastFullTotal) / lastFullTotal) * 100)
    : null;
  const projDir = projPct !== null
    ? (projPct > 2 ? "up" : projPct < -2 ? "down" : "flat")
    : null;

  const hasThisData = thisDays.length > 0;
  const thisMonthName = monthName(thisKey);
  const lastMonthName = monthName(lastKey);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {thisMonthName} so far
          </p>
          <p style={{ color: "rgba(240,238,255,0.62)", fontSize: 13, marginTop: 2 }}>
            {thisDays.length > 0
              ? `Based on ${thisDays.length} day${thisDays.length !== 1 ? "s" : ""} of readings`
              : "Based on available meter readings"}
          </p>
        </div>

        {projDir !== null && projPct !== null && (
          <div style={{ textAlign: "right" }}>
            <span style={{
              fontSize: 13, fontWeight: 700, display: "inline-block",
              borderRadius: 10, padding: "4px 10px",
              color: projDir === "up" ? "#FF2D78" : projDir === "down" ? "#39FF14" : "rgba(240,238,255,0.55)",
              background: projDir === "up" ? "rgba(255,45,120,0.10)" : projDir === "down" ? "rgba(57,255,20,0.10)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${projDir === "up" ? "rgba(255,45,120,0.35)" : projDir === "down" ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.12)"}`,
            }}>
              {projDir === "up" ? `↑ ${projPct}%` : projDir === "down" ? `↓ ${Math.abs(projPct)}%` : "≈ on track"}
            </span>
            <p style={{ color: "rgba(240,238,255,0.35)", fontSize: 10, marginTop: 3 }}>
              projected vs {lastMonthName}
            </p>
          </div>
        )}
      </div>

      {!hasThisData ? (
        <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 13, marginTop: 12 }}>No data yet for {thisMonthName}.</p>
      ) : (
        <>
          <div style={{ margin: showProjection ? "14px 0 8px" : "14px 0 16px" }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#F0EEFF", letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(240,238,255,0.25)" }}>
              £{thisTotal.toFixed(2)}
            </span>
          </div>

          {showProjection && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <TrendingUp size={13} color="rgba(240,238,255,0.40)" />
              <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 13, fontWeight: 600 }}>
                {projectionConfident ? "" : "~"}£{projected.toFixed(0)} projected
              </span>
              {hasLastFull && (
                <span style={{ color: "rgba(240,238,255,0.30)", fontSize: 11 }}>
                  · vs £{lastFullTotal.toFixed(0)} {lastMonthName}
                </span>
              )}
            </div>
          )}

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
