"use client";

import { RefreshCw, Settings } from "lucide-react";
import Card from "./Card";
import type { Rate, Settings as SettingsType } from "@/lib/types";
import { getRateStatus, STATUS_COLORS, STATUS_BG } from "@/lib/rateStatus";

interface RateHeroProps {
  elecRate: Rate | null;
  gasRate: Rate | null;
  tomorrowRate: Rate | null;
  tomorrowRates: Rate[];
  settings: SettingsType;
  lastFetch: Date | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGoToSettings: () => void;
}

export default function RateHero({
  elecRate,
  gasRate,
  tomorrowRate,
  tomorrowRates,
  settings,
  lastFetch,
  loading,
  error,
  onRefresh,
  onGoToSettings,
}: RateHeroProps) {
  const rate = elecRate?.value_inc_vat ?? null;
  const status = rate !== null ? getRateStatus(rate, settings.alertThreshold) : null;
  const tomorrowMin = tomorrowRate?.value_inc_vat ?? null;

  const slotEnd = elecRate?.valid_to
    ? new Date(elecRate.valid_to).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const tomorrowAvg =
    tomorrowRates.length > 0
      ? tomorrowRates.reduce((s, r) => s + r.value_inc_vat, 0) / tomorrowRates.length
      : null;

  // Is this a half-hourly tariff (Agile) or daily (Tracker)?
  // If the slot duration is ~30 min, it's half-hourly
  const isHalfHourly = elecRate?.valid_to
    ? new Date(elecRate.valid_to).getTime() - new Date(elecRate.valid_from).getTime() <= 30 * 60 * 1000 + 60000
    : false;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Tracker Rate — Electricity
          </p>

          {error ? (
            <div style={{ marginBottom: 8 }}>
              <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>{error}</p>
              <button
                onClick={onGoToSettings}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#1e1e1e",
                  border: "1px solid #2a2a2a",
                  borderRadius: 10,
                  padding: "8px 14px",
                  color: "#a3e635",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <Settings size={13} />
                Open Settings
              </button>
            </div>
          ) : rate !== null ? (
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
            <div style={{ fontSize: 48, color: "#374151", lineHeight: 1, marginBottom: 4 }}>—</div>
          )}

          {!error && (
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <p style={{ color: "#6b7280", fontSize: 13 }}>
                + {settings.electricityStandingCharge.toFixed(1)}p/day standing charge
              </p>
              {slotEnd && isHalfHourly && (
                <p style={{ color: "#4b5563", fontSize: 13 }}>Until {slotEnd}</p>
              )}
              {slotEnd && !isHalfHourly && (
                <p style={{ color: "#4b5563", fontSize: 13 }}>Valid today</p>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 16 }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: "#1e1e1e",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: loading ? "not-allowed" : "pointer",
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

      {/* Gas rate row */}
      {gasRate !== null && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e1e1e", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#4b5563", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Gas</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#f97316" }}>{gasRate.value_inc_vat.toFixed(2)}p/kWh</span>
          <span style={{ color: "#4b5563", fontSize: 12 }}>+ {settings.gasStandingCharge.toFixed(1)}p/day</span>
        </div>
      )}

      {/* Go/no-go banner */}
      {!error && status && rate !== null && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 12,
            background: STATUS_BG[status],
            border: `1px solid ${STATUS_COLORS[status]}33`,
          }}
        >
          <span style={{ fontSize: 13, color: STATUS_COLORS[status], fontWeight: 500 }}>
            {status === "cheap" &&
              `✅ Good time to run appliances or charge the van — rate is ${rate.toFixed(2)}p`}
            {status === "borderline" &&
              `⚠️ Borderline — consider waiting (threshold: ${settings.alertThreshold}p)`}
            {status === "expensive" && `❌ Expensive right now — delay if you can`}
          </span>
        </div>
      )}

      {/* Tomorrow */}
      {!error && tomorrowMin !== null && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e1e1e", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <span style={{ color: "#4b5563", fontSize: 11, display: "block" }}>
              {isHalfHourly ? "Tomorrow cheapest" : "Tomorrow"}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color:
                  tomorrowMin <= settings.alertThreshold
                    ? "#a3e635"
                    : tomorrowMin <= settings.alertThreshold * 1.2
                    ? "#f97316"
                    : "#ef4444",
              }}
            >
              {tomorrowMin.toFixed(2)}p
            </span>
          </div>
          {isHalfHourly && tomorrowAvg !== null && (
            <div>
              <span style={{ color: "#4b5563", fontSize: 11, display: "block" }}>avg</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af" }}>{tomorrowAvg.toFixed(2)}p</span>
            </div>
          )}
          {rate !== null && tomorrowAvg !== null && (
            <span style={{ color: "#4b5563", fontSize: 13, paddingBottom: 2 }}>
              {tomorrowAvg < rate ? "↓ looks cheaper tomorrow" : "↑ looks pricier tomorrow"}
            </span>
          )}
        </div>
      )}

      {!error && !loading && rate === null && !settings.productCode && (
        <p style={{ color: "#4b5563", fontSize: 13, marginTop: 12 }}>
          No tariff configured.{" "}
          <button onClick={onGoToSettings} style={{ background: "none", border: "none", color: "#a3e635", cursor: "pointer", fontSize: 13, padding: 0 }}>
            Open Settings to auto-detect →
          </button>
        </p>
      )}

      {!error && tomorrowRates.length === 0 && rate !== null && (
        <p style={{ color: "#374151", fontSize: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e1e1e" }}>
          Tomorrow's rate not yet published — usually available after 5pm
        </p>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
}
