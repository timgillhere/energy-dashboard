"use client";

import { RefreshCw, Settings } from "lucide-react";
import Card from "./Card";
import type { Rate, Settings as SettingsType } from "@/lib/types";
import { getRateStatus, STATUS_COLORS, STATUS_BG } from "@/lib/rateStatus";

interface RateHeroProps {
  elecRate: Rate | null;
  gasRate: Rate | null;
  tomorrowElec: Rate | null;
  tomorrowGas: Rate | null;
  settings: SettingsType;
  lastFetch: Date | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGoToSettings: () => void;
}

function RateTile({
  label,
  rate,
  tomorrowRate,
  threshold,
  accentColor,
  standingCharge,
  slotEnd,
}: {
  label: string;
  rate: number | null;
  tomorrowRate: number | null;
  threshold?: number;
  accentColor: string;
  standingCharge: number;
  slotEnd: string | null;
}) {
  const status = rate !== null && threshold !== undefined ? getRateStatus(rate, threshold) : null;
  const displayColor = status ? STATUS_COLORS[status] : accentColor;

  return (
    <div
      style={{
        flex: 1,
        background: "#0f0f0f",
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${displayColor}22`,
        minWidth: 0,
      }}
    >
      <p style={{ color: "#4b5563", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </p>

      {rate !== null ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: displayColor, letterSpacing: "-0.03em" }}>
            {rate.toFixed(2)}
          </span>
          <span style={{ fontSize: 18, color: "#4b5563", fontWeight: 500 }}>p</span>
        </div>
      ) : (
        <span style={{ fontSize: 52, color: "#2a2a2a", fontWeight: 800, lineHeight: 1 }}>—</span>
      )}

      <p style={{ color: "#374151", fontSize: 11, marginTop: 6 }}>
        + {standingCharge.toFixed(1)}p/day sc
        {slotEnd && <span style={{ marginLeft: 8 }}>· until {slotEnd}</span>}
      </p>

      {tomorrowRate !== null && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid #1e1e1e` }}>
          <span style={{ color: "#374151", fontSize: 11 }}>Tomorrow </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: accentColor }}>{tomorrowRate.toFixed(2)}p</span>
          {rate !== null && (
            <span style={{ color: "#374151", fontSize: 11, marginLeft: 6 }}>
              {tomorrowRate > rate ? `↑ +${(tomorrowRate - rate).toFixed(2)}` : `↓ ${(tomorrowRate - rate).toFixed(2)}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function RateHero({
  elecRate,
  gasRate,
  tomorrowElec,
  tomorrowGas,
  settings,
  lastFetch,
  loading,
  error,
  onRefresh,
  onGoToSettings,
}: RateHeroProps) {
  const elecVal = elecRate?.value_inc_vat ?? null;
  const status = elecVal !== null ? getRateStatus(elecVal, settings.alertThreshold) : null;

  const slotEnd = elecRate?.valid_to
    ? new Date(elecRate.valid_to).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Today's Tracker Rates
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastFetch && (
            <span style={{ color: "#374151", fontSize: 11 }}>
              {lastFetch.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: "#1e1e1e",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: loading ? "not-allowed" : "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ padding: "16px 0" }}>
          <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button
            onClick={onGoToSettings}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 10, padding: "8px 14px", color: "#a3e635", fontSize: 13, cursor: "pointer" }}
          >
            <Settings size={13} /> Open Settings to auto-detect
          </button>
        </div>
      ) : (
        <>
          {/* Twin rate tiles */}
          <div style={{ display: "flex", gap: 12 }}>
            <RateTile
              label="⚡ Electricity"
              rate={elecVal}
              tomorrowRate={tomorrowElec?.value_inc_vat ?? null}
              threshold={settings.alertThreshold}
              accentColor="#a3e635"
              standingCharge={settings.electricityStandingCharge}
              slotEnd={slotEnd}
            />
            <RateTile
              label="🔥 Gas"
              rate={gasRate?.value_inc_vat ?? null}
              tomorrowRate={tomorrowGas?.value_inc_vat ?? null}
              accentColor="#f97316"
              standingCharge={settings.gasStandingCharge}
              slotEnd={null}
            />
          </div>

          {/* Go/no-go banner */}
          {status && elecVal !== null && (
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
                {status === "cheap" && `✅ Good time to run appliances or charge the van — ${elecVal.toFixed(2)}p/kWh`}
                {status === "borderline" && `⚠️ Borderline — consider waiting (threshold: ${settings.alertThreshold}p)`}
                {status === "expensive" && `❌ Expensive right now — delay if you can`}
              </span>
            </div>
          )}

          {!settings.productCode && elecVal === null && (
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 12 }}>
              No tariff configured.{" "}
              <button onClick={onGoToSettings} style={{ background: "none", border: "none", color: "#a3e635", cursor: "pointer", fontSize: 13, padding: 0 }}>
                Open Settings to auto-detect →
              </button>
            </p>
          )}
        </>
      )}

    </Card>
  );
}
