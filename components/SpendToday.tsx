"use client";

import Card from "./Card";
import type { ConsumptionInterval, Settings } from "@/lib/types";
import { Zap, Flame } from "lucide-react";

interface SpendTodayProps {
  electricityData: ConsumptionInterval[];
  gasData: ConsumptionInterval[];
  todayRate: number | null;
  gasUnitRate: number;
  settings: Settings;
}

function calcSpend(
  data: ConsumptionInterval[],
  unitRate: number,
  standingCharge: number
): { kwh: number; cost: number } {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayData = data.filter((d) => d.interval_start.startsWith(todayStr));
  const kwh = todayData.reduce((sum, d) => sum + d.consumption, 0);
  const cost = (kwh * unitRate) / 100 + standingCharge / 100;
  return { kwh, cost };
}

export default function SpendToday({ electricityData, gasData, todayRate, gasUnitRate, settings }: SpendTodayProps) {
  const elecRate = todayRate ?? 0;
  const elec = calcSpend(electricityData, elecRate, settings.electricityStandingCharge);
  const gas = calcSpend(gasData, gasUnitRate, settings.gasStandingCharge);
  const total = elec.cost + gas.cost;

  return (
    <Card>
      <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
        Today's Spend
      </p>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: "#ededed", letterSpacing: "-0.03em" }}>
          £{total.toFixed(2)}
        </span>
        <span style={{ color: "#6b7280", fontSize: 14 }}>combined</span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, background: "#0f0f0f", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Zap size={14} color="#a3e635" />
            <span style={{ color: "#9ca3af", fontSize: 12 }}>Electricity</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#ededed", marginBottom: 2 }}>
            £{elec.cost.toFixed(2)}
          </p>
          <p style={{ fontSize: 11, color: "#4b5563" }}>{elec.kwh.toFixed(2)} kWh</p>
        </div>

        <div style={{ flex: 1, background: "#0f0f0f", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Flame size={14} color="#f97316" />
            <span style={{ color: "#9ca3af", fontSize: 12 }}>Gas</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#ededed", marginBottom: 2 }}>
            £{gas.cost.toFixed(2)}
          </p>
          <p style={{ fontSize: 11, color: "#4b5563" }}>{gas.kwh.toFixed(2)} kWh</p>
        </div>
      </div>

      {elecRate === 0 && (
        <p style={{ color: "#4b5563", fontSize: 11, marginTop: 10 }}>
          Rate unavailable — configure tariff in settings
        </p>
      )}
    </Card>
  );
}
