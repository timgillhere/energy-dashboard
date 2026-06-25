"use client";

import { Zap, Clock, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { buildAveragePattern, SLOT_LABELS } from "@/lib/dataUtils";
import type { ConsumptionInterval, Rate } from "@/lib/types";
import type { DayCost } from "@/lib/dataUtils";

interface EnergyInsightsProps {
  electricityData: ConsumptionInterval[];
  gasData: ConsumptionInterval[];
  allElecRates: Rate[];
  dailyCosts: DayCost[];
}

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  headline: string;
  detail: string;
  accentColor: string;
}

function InsightCard({ icon, label, headline, detail, accentColor }: InsightCardProps) {
  return (
    <div
      style={{
        flex: "1 1 180px",
        minWidth: 160,
        background: "linear-gradient(135deg, #0C0C1A 0%, #110A1E 100%)",
        border: "1px solid rgba(255,0,110,0.22)",
        borderRadius: 18,
        padding: "14px 16px",
        boxShadow: "0 0 16px rgba(255,0,110,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ color: accentColor }}>{icon}</span>
        <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: accentColor, lineHeight: 1.3, marginBottom: 4, textShadow: `0 0 12px ${accentColor}50` }}>
        {headline}
      </p>
      <p style={{ fontSize: 11, color: "rgba(240,238,255,0.50)", lineHeight: 1.4 }}>{detail}</p>
    </div>
  );
}

// Find the cheapest 2-hour window (4 consecutive 30-min slots) by average usage
function cheapestWindow(pattern: number[]): { start: string; end: string } {
  let minSum = Infinity;
  let minIdx = 0;
  for (let i = 0; i <= 44; i++) {
    const sum = pattern[i] + pattern[i + 1] + pattern[i + 2] + pattern[i + 3];
    if (sum < minSum) { minSum = sum; minIdx = i; }
  }
  return { start: SLOT_LABELS[minIdx], end: SLOT_LABELS[minIdx + 4] ?? "00:00" };
}

// Weekend vs weekday daily average from DayCost array
function weekendVsWeekday(dailyCosts: DayCost[]): { weekday: number; weekend: number } | null {
  const weekday: number[] = [];
  const weekend: number[] = [];
  for (const d of dailyCosts) {
    const dow = new Date(d.dateKey).getDay();
    if (dow === 0 || dow === 6) weekend.push(d.electricityKwh);
    else weekday.push(d.electricityKwh);
  }
  if (weekday.length === 0 || weekend.length === 0) return null;
  return {
    weekday: weekday.reduce((s, v) => s + v, 0) / weekday.length,
    weekend: weekend.reduce((s, v) => s + v, 0) / weekend.length,
  };
}

// Rate trend: compare last 3 days vs prior 3 days
function rateTrend(rates: Rate[]): { direction: "up" | "down" | "flat"; pct: number } | null {
  const sorted = [...rates]
    .filter((r) => new Date(r.valid_from) <= new Date())
    .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime());
  if (sorted.length < 6) return null;
  const recent = sorted.slice(0, 3).reduce((s, r) => s + r.value_inc_vat, 0) / 3;
  const prior = sorted.slice(3, 6).reduce((s, r) => s + r.value_inc_vat, 0) / 3;
  if (prior === 0) return null;
  const pct = Math.round(((recent - prior) / prior) * 100);
  return { direction: pct > 1 ? "up" : pct < -1 ? "down" : "flat", pct: Math.abs(pct) };
}

// Best rate day in the last 14 days
function bestRateDay(rates: Rate[]): { label: string; value: number } | null {
  const recent = rates
    .filter((r) => new Date(r.valid_from) <= new Date())
    .sort((a, b) => a.value_inc_vat - b.value_inc_vat);
  if (!recent.length) return null;
  const r = recent[0];
  const ukDate = new Date(new Date(r.valid_from).getTime() + 60 * 60 * 1000);
  return {
    label: ukDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    value: r.value_inc_vat,
  };
}

export default function EnergyInsights({ electricityData, gasData, allElecRates, dailyCosts }: EnergyInsightsProps) {
  if (electricityData.length === 0 && allElecRates.length === 0) return null;

  const elecPattern = buildAveragePattern(electricityData);
  const peakSlot = elecPattern.indexOf(Math.max(...elecPattern));
  const peakTime = SLOT_LABELS[peakSlot];

  const cheapWindow = electricityData.length > 0 ? cheapestWindow(elecPattern) : null;
  const wkRatio = dailyCosts.length >= 5 ? weekendVsWeekday(dailyCosts) : null;
  const trend = allElecRates.length >= 6 ? rateTrend(allElecRates) : null;
  const bestDay = allElecRates.length > 0 ? bestRateDay(allElecRates) : null;

  const insights: InsightCardProps[] = [];

  if (electricityData.length > 0) {
    insights.push({
      icon: <Zap size={14} />,
      label: "Peak usage",
      headline: peakTime,
      detail: "Your electricity demand typically peaks at this time. Running heavy appliances before or after saves the most energy.",
      accentColor: "#00F0FF",
    });
  }

  if (cheapWindow) {
    insights.push({
      icon: <Clock size={14} />,
      label: "Cheapest hours",
      headline: `${cheapWindow.start} – ${cheapWindow.end}`,
      detail: "Your lowest consumption window. Schedule washing machines, dishwashers or EV charging here.",
      accentColor: "#39FF14",
    });
  }

  if (trend) {
    const TrendIcon = trend.direction === "up" ? TrendingUp : TrendingDown;
    insights.push({
      icon: <TrendIcon size={14} />,
      label: "Rate trend",
      headline: trend.direction === "flat"
        ? "Rates stable"
        : `${trend.direction === "up" ? "↑" : "↓"} ${trend.pct}% this week`,
      detail: trend.direction === "flat"
        ? "Electricity rates have been consistent over the past few days."
        : trend.direction === "up"
        ? "Rates are higher than earlier this week. Hold off high-consumption tasks if possible."
        : "Rates have eased this week — a good time to run energy-heavy appliances.",
      accentColor: trend.direction === "up" ? "#FF2D78" : trend.direction === "down" ? "#39FF14" : "rgba(240,238,255,0.72)",
    });
  }

  if (wkRatio && Math.abs(wkRatio.weekend - wkRatio.weekday) > 0.05) {
    const higher = wkRatio.weekend > wkRatio.weekday ? "weekends" : "weekdays";
    const diff = Math.abs(wkRatio.weekend - wkRatio.weekday).toFixed(1);
    insights.push({
      icon: <Calendar size={14} />,
      label: "Weekend vs weekday",
      headline: `+${diff} kWh on ${higher}`,
      detail: `You use more electricity on ${higher} on average. This could reflect home vs office patterns.`,
      accentColor: "#BF5FFF",
    });
  } else if (bestDay) {
    insights.push({
      icon: <Calendar size={14} />,
      label: "Best rate recently",
      headline: `${bestDay.value.toFixed(2)}p — ${bestDay.label}`,
      detail: "The cheapest electricity rate in your recent history. Tracker rates vary daily based on wholesale prices.",
      accentColor: "#BF5FFF",
    });
  }

  if (insights.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {insights.map((ins, i) => (
        <InsightCard key={i} {...ins} />
      ))}
    </div>
  );
}
