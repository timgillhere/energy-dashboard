"use client";

import { Zap, Flame, TrendingDown, TrendingUp, Minus } from "lucide-react";
import Card from "./Card";
import type { DayCost } from "@/lib/dataUtils";

const SKEL: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 6,
  animation: "pulse 1.5s ease-in-out infinite",
};

interface WeekCompareProps {
  yearCosts: DayCost[];
  loading?: boolean;
}

interface WeekTotals {
  elecKwh: number;
  gasKwh: number;
  elecCost: number;
  gasCost: number;
  total: number;
  days: number;
}

function getWeekBounds(): { thisMonday: Date; lastMonday: Date; lastSunday: Date; daysIntoWeek: number } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMon = (dayOfWeek + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysFromMon);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  return { thisMonday, lastMonday, lastSunday, daysIntoWeek: daysFromMon + 1 };
}

function sumDays(days: DayCost[]): WeekTotals {
  return {
    elecKwh: days.reduce((s, d) => s + d.electricityKwh, 0),
    gasKwh: days.reduce((s, d) => s + d.gasKwh, 0),
    elecCost: days.reduce((s, d) => s + d.electricityCost, 0),
    gasCost: days.reduce((s, d) => s + d.gasCost, 0),
    total: days.reduce((s, d) => s + d.total, 0),
    days: days.length,
  };
}

function pctBadge(pct: number, direction: "up" | "down" | "flat") {
  const color = direction === "up" ? "#FF2D78" : direction === "down" ? "#39FF14" : "rgba(240,238,255,0.55)";
  const bg = direction === "up" ? "rgba(255,45,120,0.10)" : direction === "down" ? "rgba(57,255,20,0.10)" : "rgba(255,255,255,0.05)";
  const border = direction === "up" ? "rgba(255,45,120,0.35)" : direction === "down" ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.12)";
  const label = direction === "flat" ? "≈ same" : direction === "up" ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`;
  return { color, bg, border, label };
}

export default function WeekCompare({ yearCosts, loading }: WeekCompareProps) {
  if (loading) {
    return (
      <Card>
        <div style={{ ...SKEL, height: 12, width: "50%", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 12 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ ...SKEL, height: 10, width: "60%", marginBottom: 12 }} />
              <div style={{ ...SKEL, height: 22, width: "75%", marginBottom: 8 }} />
              <div style={{ ...SKEL, height: 10, width: "50%", marginBottom: 6 }} />
              <div style={{ ...SKEL, height: 10, width: "50%" }} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const { thisMonday, lastMonday, lastSunday, daysIntoWeek } = getWeekBounds();

  const thisWeekDays = yearCosts.filter((d) => {
    const dt = new Date(d.dateKey + "T12:00:00");
    return dt >= thisMonday && dt < new Date();
  });
  // Last week: same number of days as we have this week (for a fair comparison)
  const compareCount = Math.max(thisWeekDays.length, 1);
  const lastWeekDays = yearCosts
    .filter((d) => {
      const dt = new Date(d.dateKey + "T12:00:00");
      return dt >= lastMonday && dt <= lastSunday;
    })
    .slice(0, compareCount);

  if (thisWeekDays.length === 0 && lastWeekDays.length === 0) return null;

  const thisW = sumDays(thisWeekDays);
  const lastW = sumDays(lastWeekDays);

  const totalPct = lastW.total > 0 ? Math.round(((thisW.total - lastW.total) / lastW.total) * 100) : null;
  const elecPct = lastW.elecKwh > 0 ? Math.round(((thisW.elecKwh - lastW.elecKwh) / lastW.elecKwh) * 100) : null;
  const gasPct = lastW.gasKwh > 0 ? Math.round(((thisW.gasKwh - lastW.gasKwh) / lastW.gasKwh) * 100) : null;

  const totalDir = totalPct !== null ? (totalPct > 2 ? "up" : totalPct < -2 ? "down" : "flat") : null;
  const elecDir = elecPct !== null ? (elecPct > 2 ? "up" : elecPct < -2 ? "down" : "flat") : "flat";
  const gasDir = gasPct !== null ? (gasPct > 2 ? "up" : gasPct < -2 ? "down" : "flat") : "flat";

  const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayName = weekDayNames[(new Date().getDay() + 6) % 7];
  const badge = totalDir && totalPct !== null ? pctBadge(totalPct, totalDir) : null;

  const TrendIcon = totalDir === "down" ? TrendingDown : totalDir === "up" ? TrendingUp : Minus;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            This week vs last week
          </p>
          <p style={{ color: "rgba(240,238,255,0.40)", fontSize: 11, marginTop: 2 }}>
            Mon – {todayName} (same {compareCount} day{compareCount !== 1 ? "s" : ""})
          </p>
        </div>
        {badge && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendIcon size={14} color={badge.color} />
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: badge.color,
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              borderRadius: 10,
              padding: "4px 10px",
            }}>
              {badge.label}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {/* This week */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,238,255,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            This week
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#F0EEFF", letterSpacing: "-0.02em", marginBottom: 10 }}>
            £{thisW.total.toFixed(2)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={12} color="#00F0FF" />
              <span style={{ color: "rgba(0,240,255,0.85)", fontSize: 11, fontWeight: 600, minWidth: 70 }}>Electricity</span>
              <span style={{ color: "#F0EEFF", fontSize: 13, fontWeight: 700 }}>{thisW.elecKwh.toFixed(1)} kWh</span>
              {elecDir !== "flat" && elecPct !== null && (
                <span style={{ fontSize: 10, color: elecDir === "down" ? "#39FF14" : "#FF2D78", fontWeight: 600 }}>
                  {elecDir === "down" ? `↓${Math.abs(elecPct)}%` : `↑${elecPct}%`}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Flame size={12} color="#BF5FFF" />
              <span style={{ color: "rgba(191,95,255,0.95)", fontSize: 11, fontWeight: 600, minWidth: 70 }}>Gas</span>
              <span style={{ color: "#F0EEFF", fontSize: 13, fontWeight: 700 }}>{thisW.gasKwh.toFixed(1)} kWh</span>
              {gasDir !== "flat" && gasPct !== null && (
                <span style={{ fontSize: 10, color: gasDir === "down" ? "#39FF14" : "#FF2D78", fontWeight: 600 }}>
                  {gasDir === "down" ? `↓${Math.abs(gasPct)}%` : `↑${gasPct}%`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ width: 1, background: "rgba(255,0,110,0.15)", alignSelf: "stretch" }} />

        {/* Last week */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,238,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Last week
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "rgba(240,238,255,0.55)", letterSpacing: "-0.02em", marginBottom: 10 }}>
            £{lastW.total.toFixed(2)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={12} color="rgba(0,240,255,0.45)" />
              <span style={{ color: "rgba(0,240,255,0.45)", fontSize: 11, fontWeight: 600, minWidth: 70 }}>Electricity</span>
              <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 13, fontWeight: 700 }}>{lastW.elecKwh.toFixed(1)} kWh</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Flame size={12} color="rgba(191,95,255,0.45)" />
              <span style={{ color: "rgba(191,95,255,0.45)", fontSize: 11, fontWeight: 600, minWidth: 70 }}>Gas</span>
              <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 13, fontWeight: 700 }}>{lastW.gasKwh.toFixed(1)} kWh</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
