"use client";

import { RefreshCw, Settings } from "lucide-react";
import Card from "./Card";
import type { Rate, Settings as SettingsType } from "@/lib/types";
import { getRateStatus, STATUS_COLORS, STATUS_BG, STATUS_ICONS, STATUS_LABELS } from "@/lib/rateStatus";

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
  const glowColor = displayColor;

  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 0 16px ${accentColor}18`,
        minWidth: 0,
      }}
    >
      <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </p>

      {rate !== null ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: displayColor, letterSpacing: "-0.03em", textShadow: `0 0 20px ${glowColor}80` }}>
            {rate.toFixed(2)}
          </span>
          <span style={{ fontSize: 18, color: "rgba(240,238,255,0.35)", fontWeight: 500 }}>p</span>
        </div>
      ) : (
        <span style={{ fontSize: 52, color: "rgba(240,238,255,0.18)", fontWeight: 800, lineHeight: 1 }}>—</span>
      )}

      <p style={{ color: "rgba(240,238,255,0.35)", fontSize: 11, marginTop: 6 }}>
        + {standingCharge.toFixed(1)}p/day sc
        {slotEnd && <span style={{ marginLeft: 8 }}>· until {slotEnd}</span>}
      </p>

      {tomorrowRate !== null && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${accentColor}28` }}>
          <span style={{ color: "rgba(240,238,255,0.38)", fontSize: 11 }}>Tomorrow </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: accentColor }}>{tomorrowRate.toFixed(2)}p</span>
          {rate !== null && (
            <span style={{ color: "rgba(240,238,255,0.38)", fontSize: 11, marginLeft: 6 }}>
              {tomorrowRate > rate ? `↑ +${(tomorrowRate - rate).toFixed(2)}` : `↓ ${(tomorrowRate - rate).toFixed(2)}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function RateHero({ elecRate, gasRate, tomorrowElec, tomorrowGas, settings, lastFetch, loading, error, onRefresh, onGoToSettings }: RateHeroProps) {
  const elecVal = elecRate?.value_inc_vat ?? null;
  const status = elecVal !== null ? getRateStatus(elecVal, settings.alertThreshold) : null;

  const slotEnd = elecRate?.valid_to
    ? new Date(elecRate.valid_to).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Today's Tracker Rates
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastFetch && (
            <span style={{ color: "rgba(240,238,255,0.30)", fontSize: 11 }}>
              {lastFetch.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: "rgba(255,0,110,0.08)",
              border: "1px solid rgba(255,0,110,0.35)",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: loading ? "not-allowed" : "pointer",
              color: "rgba(255,45,120,0.80)",
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
          <p style={{ color: "#FF2D78", fontSize: 14, marginBottom: 12, textShadow: "0 0 12px rgba(255,45,120,0.50)" }}>{error}</p>
          <button
            onClick={onGoToSettings}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,0,110,0.08)", border: "1px solid rgba(255,0,110,0.35)", borderRadius: 12, padding: "8px 14px", color: "#FF2D78", fontSize: 13, cursor: "pointer" }}
          >
            <Settings size={13} /> Open Settings to auto-detect
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12 }}>
            <RateTile label="⚡ Electricity" rate={elecVal} tomorrowRate={tomorrowElec?.value_inc_vat ?? null} threshold={settings.alertThreshold} accentColor="#00F0FF" standingCharge={settings.electricityStandingCharge} slotEnd={slotEnd} />
            <RateTile label="🔥 Gas" rate={gasRate?.value_inc_vat ?? null} tomorrowRate={tomorrowGas?.value_inc_vat ?? null} accentColor="#BF5FFF" standingCharge={settings.gasStandingCharge} slotEnd={null} />
          </div>

          {status && elecVal !== null && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 14,
                background: STATUS_BG[status],
                border: `1px solid ${STATUS_COLORS[status]}50`,
                boxShadow: `0 0 12px ${STATUS_COLORS[status]}20`,
              }}
            >
              <span style={{ fontSize: 13, color: STATUS_COLORS[status], fontWeight: 600, textShadow: `0 0 10px ${STATUS_COLORS[status]}60` }}>
                {STATUS_ICONS[status]}{" "}
                {status === "cheap"
                  ? `${STATUS_LABELS[status]} — ${elecVal.toFixed(2)}p/kWh`
                  : status === "borderline"
                  ? `${STATUS_LABELS[status]} (threshold: ${settings.alertThreshold}p)`
                  : STATUS_LABELS[status]}
              </span>
            </div>
          )}

          {!settings.productCode && elecVal === null && (
            <p style={{ color: "rgba(240,238,255,0.40)", fontSize: 13, marginTop: 12 }}>
              No tariff configured.{" "}
              <button onClick={onGoToSettings} style={{ background: "none", border: "none", color: "#00F0FF", cursor: "pointer", fontSize: 13, padding: 0, textShadow: "0 0 8px rgba(0,240,255,0.60)" }}>
                Open Settings to auto-detect →
              </button>
            </p>
          )}
        </>
      )}
    </Card>
  );
}
