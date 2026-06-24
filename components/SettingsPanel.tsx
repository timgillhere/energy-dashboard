"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import Card from "./Card";
import type { Settings } from "@/lib/types";
import { saveSettings } from "@/lib/settings";

interface SettingsPanelProps {
  settings: Settings;
  onSave: (s: Settings) => void;
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "rgba(240,238,255,0.45)", fontSize: 12, marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,0,110,0.25)",
          borderRadius: 12,
          padding: "10px 12px",
          color: "#F0EEFF",
          fontSize: 14,
          outline: "none",
        }}
      />
      {hint && <p style={{ color: "rgba(240,238,255,0.30)", fontSize: 11, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set(key: keyof Settings, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveSettings(form);
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAutoDetect() {
    if (!form.mpan && !form.mprn) {
      setDetectMsg({ ok: false, text: "Enter your MPAN and/or MPRN first." });
      return;
    }
    setDetecting(true);
    setDetectMsg(null);
    try {
      const params = new URLSearchParams();
      if (form.mpan) params.set("mpan", form.mpan);
      if (form.mprn) params.set("mprn", form.mprn);
      const res = await fetch(`/api/tariff?${params}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setDetectMsg({ ok: false, text: data.error ?? "Auto-detect failed — check MPAN/MPRN and API key." });
        return;
      }
      const { electricityTariffCode, gasTariffCode, productCode, mpan, mprn, electricitySerial, gasSerial } = data;
      setForm((prev) => ({
        ...prev,
        ...(productCode ? { productCode } : {}),
        ...(electricityTariffCode ? { tariffCode: electricityTariffCode } : {}),
        ...(gasTariffCode ? { gasTariffCode } : {}),
        ...(mpan ? { mpan } : {}),
        ...(mprn ? { mprn } : {}),
        ...(electricitySerial ? { electricitySerial } : {}),
        ...(gasSerial ? { gasSerial } : {}),
      }));
      setDetectMsg({
        ok: true,
        text: `Detected: ${electricityTariffCode ?? "—"} / gas: ${gasTariffCode ?? "—"}`,
      });
    } catch {
      setDetectMsg({ ok: false, text: "Network error during auto-detect." });
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 16 }}>
          Electricity Meter
        </p>
        <Field label="MPAN" value={form.mpan} onChange={(v) => set("mpan", v)} placeholder="1200000000000" />
        <Field label="Meter Serial Number" value={form.electricitySerial} onChange={(v) => set("electricitySerial", v)} placeholder="E1A00000" />
        <Field label="Standing Charge (p/day)" value={String(form.electricityStandingCharge)} onChange={(v) => set("electricityStandingCharge", parseFloat(v) || 0)} type="number" />
      </Card>

      <Card>
        <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 16 }}>
          Gas Meter
        </p>
        <Field label="MPRN" value={form.mprn} onChange={(v) => set("mprn", v)} placeholder="1234567890" />
        <Field label="Meter Serial Number" value={form.gasSerial} onChange={(v) => set("gasSerial", v)} placeholder="G1A00000" />
        <Field label="Standing Charge (p/day)" value={String(form.gasStandingCharge)} onChange={(v) => set("gasStandingCharge", parseFloat(v) || 0)} type="number" />
        <Field
          label="Fallback unit rate (p/kWh)"
          hint="Used if the Tracker gas rate can't be fetched automatically"
          value={String(form.gasUnitRate)}
          onChange={(v) => set("gasUnitRate", parseFloat(v) || 0)}
          type="number"
        />
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Tracker Tariff
          </p>
          <button
            onClick={handleAutoDetect}
            disabled={detecting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,240,255,0.08)",
              border: "1px solid rgba(0,240,255,0.35)",
              borderRadius: 12,
              padding: "7px 14px",
              color: "#00F0FF",
              fontSize: 12,
              fontWeight: 600,
              cursor: detecting ? "not-allowed" : "pointer",
              boxShadow: "0 0 10px rgba(0,240,255,0.15)",
            }}
          >
            <Zap size={13} />
            {detecting ? "Detecting…" : "Auto-detect from MPAN"}
          </button>
        </div>

        {detectMsg && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              marginBottom: 12,
              background: detectMsg.ok ? "rgba(57,255,20,0.08)" : "rgba(255,45,120,0.08)",
              border: `1px solid ${detectMsg.ok ? "rgba(57,255,20,0.35)" : "rgba(255,45,120,0.35)"}`,
              fontSize: 12,
              color: detectMsg.ok ? "#39FF14" : "#FF2D78",
            }}
          >
            {detectMsg.text}
          </div>
        )}

        <Field
          label="Product Code"
          hint="e.g. SILVER-FLEX-22-11-25 — auto-detected from your MPAN"
          value={form.productCode}
          onChange={(v) => set("productCode", v)}
          placeholder="SILVER-FLEX-22-11-25"
        />
        <Field
          label="Electricity Tariff Code"
          hint="e.g. E-1R-SILVER-FLEX-22-11-25-J (trailing letter = your region)"
          value={form.tariffCode}
          onChange={(v) => set("tariffCode", v)}
          placeholder="E-1R-SILVER-FLEX-22-11-25-J"
        />
        <Field
          label="Gas Tariff Code"
          hint="e.g. G-1R-SILVER-FLEX-22-11-25-J — auto-detected or derived from electricity code"
          value={form.gasTariffCode}
          onChange={(v) => set("gasTariffCode", v)}
          placeholder="G-1R-SILVER-FLEX-22-11-25-J"
        />
      </Card>

      <Card>
        <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 16 }}>
          Alert Settings
        </p>
        <Field
          label="Rate threshold (p/kWh)"
          hint="Get notified when the electricity rate drops below this level"
          value={String(form.alertThreshold)}
          onChange={(v) => set("alertThreshold", parseFloat(v) || 0)}
          type="number"
          placeholder="25"
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(240,238,255,0.55)", fontSize: 13 }}>Rate alerts enabled</span>
          <div
            onClick={() => set("alertsEnabled", !form.alertsEnabled)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: form.alertsEnabled ? "#FF2D78" : "rgba(255,255,255,0.06)",
              border: form.alertsEnabled ? "1px solid #FF2D78" : "1px solid rgba(255,255,255,0.15)",
              boxShadow: form.alertsEnabled ? "0 0 14px rgba(255,45,120,0.70)" : "none",
              position: "relative",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: form.alertsEnabled ? 22 : 3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: form.alertsEnabled ? "#07070F" : "rgba(240,238,255,0.50)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.40)",
                transition: "left 0.2s",
              }}
            />
          </div>
        </div>
      </Card>

      <button
        onClick={handleSave}
        style={{
          background: saved ? "rgba(57,255,20,0.10)" : "rgba(255,0,110,0.15)",
          border: saved ? "1px solid rgba(57,255,20,0.40)" : "1px solid #FF2D78",
          borderRadius: 16,
          padding: "14px 24px",
          fontSize: 15,
          fontWeight: 700,
          color: saved ? "#39FF14" : "#FF2D78",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: saved ? "0 0 16px rgba(57,255,20,0.30)" : "0 0 20px rgba(255,45,120,0.35)",
          textShadow: saved ? "0 0 10px rgba(57,255,20,0.70)" : "0 0 10px rgba(255,45,120,0.70)",
        }}
      >
        {saved ? "✓ Saved" : "Save Settings"}
      </button>

      <p style={{ color: "rgba(240,238,255,0.28)", fontSize: 11, textAlign: "center" }}>
        Settings stored locally in your browser. Octopus API key is on the server.
      </p>
    </div>
  );
}
