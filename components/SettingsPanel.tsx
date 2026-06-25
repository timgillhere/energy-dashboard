"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import Card from "./Card";
import AlertPanel from "./AlertPanel";
import type { Settings } from "@/lib/types";
import { saveSettings } from "@/lib/settings";

interface SettingsPanelProps {
  settings: Settings;
  onSave: (s: Settings) => void;
  currentRate?: number | null;
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
      <label style={{ display: "block", color: "rgba(240,238,255,0.65)", fontSize: 12, marginBottom: 4 }}>
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
      {hint && <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 11, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function SettingsPanel({ settings, onSave, currentRate }: SettingsPanelProps) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set(key: keyof Settings, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    saveSettings(form);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) setSaveError("Saved locally — cloud sync unavailable.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Saved locally — network error syncing to cloud.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
      onSave(form);
    }
  }

  async function handleAutoDetect() {
    setDetecting(true);
    setDetectMsg(null);
    try {
      const res = await fetch("/api/tariff");
      const data = await res.json();
      if (!res.ok || data.error) {
        setDetectMsg({ ok: false, text: data.error ?? "Auto-detect failed — check API key." });
        return;
      }
      const { electricityTariffCode, gasTariffCode, productCode } = data;
      setForm((prev) => ({
        ...prev,
        ...(productCode ? { productCode } : {}),
        ...(electricityTariffCode ? { tariffCode: electricityTariffCode } : {}),
        ...(gasTariffCode ? { gasTariffCode } : {}),
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
        <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 16 }}>
          Electricity Meter
        </p>
        <Field label="Standing Charge (p/day)" value={String(form.electricityStandingCharge)} onChange={(v) => set("electricityStandingCharge", parseFloat(v) || 0)} type="number" />
      </Card>

      <Card>
        <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 16 }}>
          Gas Meter
        </p>
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
          <p style={{ color: "rgba(240,238,255,0.72)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
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
            {detecting ? "Detecting…" : "Auto-detect tariff"}
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

      <div>
        <Field
          label="Rate threshold (p/kWh)"
          hint="Get notified when the electricity rate drops below this level"
          value={String(form.alertThreshold)}
          onChange={(v) => set("alertThreshold", parseFloat(v) || 0)}
          type="number"
          placeholder="25"
        />
        <AlertPanel
          settings={form}
          onToggle={(enabled) => set("alertsEnabled", enabled)}
          currentRate={currentRate ?? null}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: saved ? "rgba(57,255,20,0.10)" : saving ? "rgba(255,0,110,0.07)" : "rgba(255,0,110,0.15)",
          border: saved ? "1px solid rgba(57,255,20,0.40)" : saving ? "1px solid rgba(255,45,120,0.40)" : "1px solid #FF2D78",
          borderRadius: 16,
          padding: "14px 24px",
          fontSize: 15,
          fontWeight: 700,
          color: saved ? "#39FF14" : saving ? "rgba(255,45,120,0.50)" : "#FF2D78",
          cursor: saving ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          boxShadow: saved ? "0 0 16px rgba(57,255,20,0.30)" : saving ? "none" : "0 0 20px rgba(255,45,120,0.35)",
          textShadow: saved ? "0 0 10px rgba(57,255,20,0.70)" : saving ? "none" : "0 0 10px rgba(255,45,120,0.70)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
        }}
      >
        {saving && (
          <span style={{ width: 14, height: 14, border: "2px solid rgba(255,45,120,0.30)", borderTopColor: "rgba(255,45,120,0.70)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        )}
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save Settings"}
      </button>

      {saveError && (
        <p style={{ color: "rgba(255,180,0,0.85)", fontSize: 12, textAlign: "center", marginTop: -8 }}>
          {saveError}
        </p>
      )}

      <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 11, textAlign: "center" }}>
        Settings stored locally in your browser. Meter IDs and API key are on the server.
      </p>
    </div>
  );
}
