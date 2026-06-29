"use client";

import { PoundSterling, Zap, Flame, TrendingUp, CalendarDays } from "lucide-react";
import { InfoTip } from "./Tooltip";
import LoadingGif from "./LoadingGif";
import type { DayCost } from "@/lib/dataUtils";

interface StatsRowProps {
  days: DayCost[];
  periodLabel: string;
  loading?: boolean;
  singleDayView?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tip: string;
  accent?: string;
  glowColor?: string;
}

function StatCard({ icon, label, value, sub, tip, accent = "#F0EEFF", glowColor }: StatCardProps) {
  const glow = glowColor ?? accent;
  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: 140,
        background: "linear-gradient(135deg, #0C0C1A 0%, #110A1E 100%)",
        border: "1px solid rgba(255,0,110,0.30)",
        borderRadius: 18,
        padding: "14px 16px",
        boxShadow: "0 0 16px rgba(255,0,110,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ color: "rgba(240,238,255,0.55)" }}>{icon}</span>
        <span style={{ color: "rgba(240,238,255,0.65)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", flex: 1, minWidth: 0 }}>
          {label}
        </span>
        <InfoTip content={tip} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: "-0.02em", lineHeight: 1, textShadow: `0 0 16px ${glow}60` }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "rgba(240,238,255,0.50)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function StatsRow({ days, periodLabel, loading, singleDayView }: StatsRowProps) {
  if (loading) return <LoadingGif height={91} />;

  if (days.length === 0) {
    return (
      <div style={{ color: "rgba(240,238,255,0.55)", fontSize: 13, padding: "12px 0" }}>
        No consumption data for this period — configure your meter serial numbers in Settings.
      </div>
    );
  }

  if (singleDayView && days.length === 1 && days[0].elecIntervalCount < 48) {
    return (
      <div style={{ color: "rgba(240,238,255,0.45)", fontSize: 13, padding: "12px 0" }}>
        Data for {days[0].label} isn't fully available yet — Octopus typically updates within a few hours. Check back later.
      </div>
    );
  }

  const totalCost = days.reduce((s, d) => s + d.total, 0);
  const avgCostPerDay = totalCost / days.length;
  const totalElecKwh = days.reduce((s, d) => s + d.electricityKwh, 0);
  const totalGasKwh = days.reduce((s, d) => s + d.gasKwh, 0);
  const projectedMonthly = avgCostPerDay * 30;
  const hasEstimated = days.some((d) => d.estimated);
  const showForecast = days.length > 1;
  const showDailyAvg = days.length > 1;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <StatCard icon={<PoundSterling size={14} />} label="Total spend" value={`£${totalCost.toFixed(2)}`} sub={periodLabel} tip="Total combined electricity and gas cost including standing charges." accent="#F0EEFF" />
      {showDailyAvg && <StatCard icon={<CalendarDays size={14} />} label="Daily average" value={`£${avgCostPerDay.toFixed(2)}`} sub="per day" tip="Average daily energy bill over the selected period." accent="#F0EEFF" />}
      <StatCard icon={<Zap size={14} />} label="Electricity" value={`${totalElecKwh.toFixed(0)} kWh`} sub={`${(totalElecKwh / days.length).toFixed(1)} kWh/day`} tip="Total electricity consumed, read from your smart meter." accent="#00F0FF" glowColor="#00F0FF" />
      <StatCard icon={<Flame size={14} />} label="Gas" value={`${totalGasKwh.toFixed(0)} kWh`} sub={`${(totalGasKwh / days.length).toFixed(1)} kWh/day`} tip="Total gas consumed in kWh." accent="#BF5FFF" glowColor="#BF5FFF" />
      {showForecast && (
        <StatCard icon={<TrendingUp size={14} />} label="Monthly est." value={`£${projectedMonthly.toFixed(0)}`} sub={hasEstimated ? "estimated" : `avg × ${days.length} days`} tip="Projects your daily average spend across 30 days." accent="rgba(240,238,255,0.75)" />
      )}
    </div>
  );
}
