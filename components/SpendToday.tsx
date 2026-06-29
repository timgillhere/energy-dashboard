"use client";

import { RefreshCw, Zap, Flame } from "lucide-react";
import Card from "./Card";
import LoadingGif from "./LoadingGif";
import type { Rate, ConsumptionInterval, Settings } from "@/lib/types";
import { getIntervalsForUKDate, toUKDateKey, getRateForTime } from "@/lib/dataUtils";

interface SpendTodayProps {
  electricityData: ConsumptionInterval[];
  gasData: ConsumptionInterval[];
  allElecRates: Rate[];
  allGasRates: Rate[];
  fallbackElecRate: number;
  gasUnitRate: number;
  settings: Settings;
  displayDate?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}

function calcSpend(
  data: ConsumptionInterval[],
  rates: Rate[],
  fallbackRate: number,
  standingCharge: number,
  date: Date
): { kwh: number; cost: number } {
  const ukKey = toUKDateKey(date);
  const dayData = getIntervalsForUKDate(data, ukKey);
  if (dayData.length === 0) return { kwh: 0, cost: 0 };
  let kwh = 0, cost = 0;
  for (const d of dayData) {
    const r = getRateForTime(new Date(d.interval_start), rates) ?? fallbackRate;
    kwh += d.consumption;
    cost += (d.consumption * r) / 100;
  }
  cost += standingCharge / 100;
  return { kwh, cost };
}

function getSpendLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today's Spend";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday's Spend";
  return `Spend — ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

export default function SpendToday({ electricityData, gasData, allElecRates, allGasRates, fallbackElecRate, gasUnitRate, settings, displayDate, onRefresh, refreshing, loading }: SpendTodayProps) {
  const date = displayDate ?? new Date();
  const elec = calcSpend(electricityData, allElecRates, fallbackElecRate, settings.electricityStandingCharge, date);
  const gas  = calcSpend(gasData,         allGasRates,  gasUnitRate,       settings.gasStandingCharge,         date);
  const total = elec.cost + gas.cost;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          {getSpendLabel(date)}
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              background: "rgba(255,0,110,0.08)",
              border: "1px solid rgba(255,0,110,0.35)",
              borderRadius: 10,
              padding: "5px 10px",
              cursor: refreshing ? "not-allowed" : "pointer",
              color: "rgba(255,45,120,0.80)",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
            }}
          >
            <RefreshCw size={12} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <LoadingGif height={156} />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#F0EEFF", letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(240,238,255,0.25)" }}>
              £{total.toFixed(2)}
            </span>
            <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 14 }}>combined</span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "rgba(0,240,255,0.05)", borderRadius: 14, padding: 12, border: "1px solid rgba(0,240,255,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Zap size={14} color="#00F0FF" />
                <span style={{ color: "rgba(0,240,255,0.85)", fontSize: 12, fontWeight: 600 }}>Electricity</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#F0EEFF", marginBottom: 2 }}>
                £{elec.cost.toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: "rgba(240,238,255,0.55)" }}>{elec.kwh.toFixed(2)} kWh</p>
            </div>

            <div style={{ flex: 1, background: "rgba(191,95,255,0.05)", borderRadius: 14, padding: 12, border: "1px solid rgba(191,95,255,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color="#BF5FFF" />
                <span style={{ color: "rgba(191,95,255,0.95)", fontSize: 12, fontWeight: 600 }}>Gas</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#F0EEFF", marginBottom: 2 }}>
                £{gas.cost.toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: "rgba(240,238,255,0.55)" }}>{gas.kwh.toFixed(2)} kWh</p>
            </div>
          </div>

          {elec.kwh === 0 && gas.kwh === 0 && allElecRates.length === 0 && (
            <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 11, marginTop: 10 }}>
              Rates loading — configure tariff in settings if this persists
            </p>
          )}
        </>
      )}
    </Card>
  );
}
