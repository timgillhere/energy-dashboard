"use client";

import { useState } from "react";
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
      <label style={{ display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#0f0f0f",
          border: "1px solid #2a2a2a",
          borderRadius: 10,
          padding: "10px 12px",
          color: "#ededed",
          fontSize: 14,
          outline: "none",
        }}
      />
      {hint && <p style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function set(key: keyof Settings, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveSettings(form);
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Electricity Meter
        </p>
        <Field label="MPAN" value={form.mpan} onChange={(v) => set("mpan", v)} placeholder="1200000000000" />
        <Field label="Meter Serial Number" value={form.electricitySerial} onChange={(v) => set("electricitySerial", v)} placeholder="E1A00000" />
        <Field label="Standing Charge (p/day)" value={String(form.electricityStandingCharge)} onChange={(v) => set("electricityStandingCharge", parseFloat(v) || 0)} type="number" />
      </Card>

      <Card>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Gas Meter
        </p>
        <Field label="MPRN" value={form.mprn} onChange={(v) => set("mprn", v)} placeholder="1234567890" />
        <Field label="Meter Serial Number" value={form.gasSerial} onChange={(v) => set("gasSerial", v)} placeholder="G1A00000" />
        <Field label="Unit Rate (p/kWh)" value={String(form.gasUnitRate)} onChange={(v) => set("gasUnitRate", parseFloat(v) || 0)} type="number" />
        <Field label="Standing Charge (p/day)" value={String(form.gasStandingCharge)} onChange={(v) => set("gasStandingCharge", parseFloat(v) || 0)} type="number" />
      </Card>

      <Card>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Tracker Tariff
        </p>
        <Field
          label="Product Code"
          hint="e.g. SILVER-FLEX-22-11-25"
          value={form.productCode}
          onChange={(v) => set("productCode", v)}
          placeholder="SILVER-FLEX-22-11-25"
        />
        <Field
          label="Tariff Code"
          hint="e.g. E-1R-SILVER-FLEX-22-11-25-A (change trailing letter to your region)"
          value={form.tariffCode}
          onChange={(v) => set("tariffCode", v)}
          placeholder="E-1R-SILVER-FLEX-22-11-25-A"
        />
      </Card>

      <Card>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Alert Settings
        </p>
        <Field
          label="Rate threshold (p/kWh)"
          hint="Get notified when the rate drops below this level"
          value={String(form.alertThreshold)}
          onChange={(v) => set("alertThreshold", parseFloat(v) || 0)}
          type="number"
          placeholder="25"
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>Rate alerts enabled</span>
          <div
            onClick={() => set("alertsEnabled", !form.alertsEnabled)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: form.alertsEnabled ? "#a3e635" : "#1e1e1e",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: form.alertsEnabled ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: form.alertsEnabled ? "#0a0a0a" : "#4b5563",
                transition: "left 0.2s",
              }}
            />
          </div>
        </div>
      </Card>

      <button
        onClick={handleSave}
        style={{
          background: saved ? "#1a2e0a" : "#a3e635",
          border: "none",
          borderRadius: 14,
          padding: "14px 24px",
          fontSize: 15,
          fontWeight: 700,
          color: saved ? "#a3e635" : "#0a0a0a",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {saved ? "✓ Saved" : "Save Settings"}
      </button>

      <p style={{ color: "#374151", fontSize: 11, textAlign: "center" }}>
        Settings are stored locally in your browser. The Octopus API key is stored securely on the server.
      </p>
    </div>
  );
}
