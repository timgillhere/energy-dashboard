"use client";

import { PoundSterling, Zap, Flame, TrendingUp, CalendarDays } from "lucide-react";
import { InfoTip } from "./Tooltip";
import type { DayCost } from "@/lib/dataUtils";

interface StatsRowProps {
  days: DayCost[];
  periodLabel: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tip: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, tip, accent = "#ededed" }: StatCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "#141414",
        border: "1px solid #1e1e1e",
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ color: "#4b5563" }}>{icon}</span>
        <span style={{ color: "#4b5563", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", flex: 1 }}>
          {label}
        </span>
        <InfoTip content={tip} />
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function StatsRow({ days, periodLabel }: StatsRowProps) {
  if (days.length === 0) {
    return (
      <div style={{ color: "#374151", fontSize: 13, padding: "12px 0" }}>
        No consumption data for this period — configure your meter serial numbers in Settings.
      </div>
    );
  }

  const totalCost = days.reduce((s, d) => s + d.total, 0);
  const avgCostPerDay = totalCost / days.length;
  const totalElecKwh = days.reduce((s, d) => s + d.electricityKwh, 0);
  const totalGasKwh = days.reduce((s, d) => s + d.gasKwh, 0);
  const projectedMonthly = avgCostPerDay * 30;
  const hasEstimated = days.some((d) => d.estimated);

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <StatCard
        icon={<PoundSterling size={14} />}
        label="Total spend"
        value={`£${totalCost.toFixed(2)}`}
        sub={periodLabel}
        tip="Total combined electricity and gas cost including standing charges for the selected period."
        accent="#ededed"
      />
      <StatCard
        icon={<CalendarDays size={14} />}
        label="Daily average"
        value={`£${avgCostPerDay.toFixed(2)}`}
        sub="per day"
        tip="Average daily energy bill (electricity + gas combined) over the selected period."
        accent="#ededed"
      />
      <StatCard
        icon={<Zap size={14} />}
        label="Electricity used"
        value={`${totalElecKwh.toFixed(0)} kWh`}
        sub={`${(totalElecKwh / days.length).toFixed(1)} kWh/day avg`}
        tip="Total electricity consumed in the period, read directly from your smart meter."
        accent="#a3e635"
      />
      <StatCard
        icon={<Flame size={14} />}
        label="Gas used"
        value={`${totalGasKwh.toFixed(0)} kWh`}
        sub={`${(totalGasKwh / days.length).toFixed(1)} kWh/day avg`}
        tip="Total gas consumed in the period in kWh (already converted from m³ by Octopus)."
        accent="#f97316"
      />
      <StatCard
        icon={<TrendingUp size={14} />}
        label="Monthly forecast"
        value={`£${projectedMonthly.toFixed(0)}`}
        sub={hasEstimated ? "estimated (partial rates)" : "based on current avg"}
        tip="Projects your current daily average spend across a full 30-day month."
        accent="#9ca3af"
      />
    </div>
  );
}
