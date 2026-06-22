"use client";

import { RefreshCw } from "lucide-react";
import Card from "./Card";
import type { Rate, Settings } from "@/lib/types";
import { getRateStatus, STATUS_COLORS, STATUS_BG } from "@/lib/rateStatus";

interface RateHeroProps {
  todayRate: Rate | null;
  tomorrowRate: Rate | null;
  settings: Settings;
  lastFetch: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function RateHero({
  todayRate,
  tomorrowRate,
  settings,
  lastFetch,
  loading,
  onRefresh,
}: RateHeroProps) {
  const rate = todayRate?.value_inc_vat ?? null;
  const status = rate !== null ? getRateStatus(rate, settings.alertThreshold) : null;
  const tomorrowVal = tomorrowRate?.value_inc_vat ?? null;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Today's Tracker Rate
          </p>
          {rate !== null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: status ? STATUS_COLORS[status] : "#ededed",
                  letterSpacing: "-0.03em",
                }}
              >
                {rate.toFixed(2)}
              </span>
              <span style={{ fontSize: 24, color: "#6b7280", fontWeight: 500 }}>p/kWh</span>
            </div>
          ) : (
            <div style={{ fontSize: 48, color: "#374151" }}>—</div>
          )}
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
            + {settings.electricityStandingCharge.toFixed(1)}p/day standing charge
          </p>
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: "#1e1e1e",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          {lastFetch && (
            <p style={{ color: "#4b5563", fontSize: 11 }}>
              {lastFetch.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* Threshold indicator */}
      {status && rate !== null && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            borderRadius: 12,
            background: STATUS_BG[status],
            border: `1px solid ${STATUS_COLORS[status]}33`,
          }}
        >
          <span style={{ fontSize: 13, color: STATUS_COLORS[status], fontWeight: 500 }}>
            {status === "cheap" && "✅ "}
            {status === "borderline" && "⚠️ "}
            {status === "expensive" && "❌ "}
            {status === "cheap" && `Good time to run appliances — rate is ${rate.toFixed(2)}p`}
            {status === "borderline" && `Borderline — consider waiting (threshold: ${settings.alertThreshold}p)`}
            {status === "expensive" && `Expensive right now — delay if you can`}
          </span>
        </div>
      )}

      {/* Tomorrow's rate */}
      {tomorrowVal !== null && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e1e1e" }}>
          <span style={{ color: "#6b7280", fontSize: 13 }}>Tomorrow: </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color:
                tomorrowVal <= settings.alertThreshold
                  ? "#a3e635"
                  : tomorrowVal <= settings.alertThreshold * 1.2
                  ? "#f97316"
                  : "#ef4444",
            }}
          >
            {tomorrowVal.toFixed(2)}p/kWh
          </span>
          {rate !== null && (
            <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 8 }}>
              ({tomorrowVal < rate ? `↓ ${(rate - tomorrowVal).toFixed(2)}p cheaper` : `↑ ${(tomorrowVal - rate).toFixed(2)}p more`})
            </span>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
}
