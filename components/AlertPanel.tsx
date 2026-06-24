"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import Card from "./Card";
import type { Settings } from "@/lib/types";

interface AlertPanelProps {
  settings: Settings;
  onToggle: (enabled: boolean) => void;
  currentRate: number | null;
}

export default function AlertPanel({ settings, onToggle, currentRate }: AlertPanelProps) {
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setPushSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  async function handleToggle() {
    if (!settings.alertsEnabled) {
      if (permission !== "granted") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") return;
      }
    }
    onToggle(!settings.alertsEnabled);
  }

  async function sendTestNotification() {
    if (permission !== "granted") return;
    const rate = currentRate ?? settings.alertThreshold;
    new Notification("Energy Alert — Test", {
      body: `Good time to run appliances — rate is ${rate.toFixed(2)}p/kWh`,
      icon: "/icons/icon-192.png",
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ color: "rgba(240,238,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Rate Alerts
        </p>
        <div
          onClick={handleToggle}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: settings.alertsEnabled ? "#FF2D78" : "rgba(255,255,255,0.06)",
            border: settings.alertsEnabled ? "1px solid #FF2D78" : "1px solid rgba(255,255,255,0.15)",
            boxShadow: settings.alertsEnabled ? "0 0 14px rgba(255,45,120,0.70)" : "none",
            position: "relative",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: settings.alertsEnabled ? 22 : 3,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: settings.alertsEnabled ? "#07070F" : "rgba(240,238,255,0.50)",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.40)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {settings.alertsEnabled ? (
          <Bell size={16} color="#FF2D78" style={{ filter: "drop-shadow(0 0 6px rgba(255,45,120,0.80))" }} />
        ) : (
          <BellOff size={16} color="rgba(240,238,255,0.30)" />
        )}
        <span style={{ color: "rgba(240,238,255,0.60)", fontSize: 13 }}>
          {settings.alertsEnabled
            ? `Notify when rate ≤ ${settings.alertThreshold}p/kWh`
            : "Alerts disabled"}
        </span>
      </div>

      {!pushSupported && (
        <p style={{ color: "rgba(240,238,255,0.32)", fontSize: 12, marginBottom: 8 }}>
          Push notifications not supported in this browser.
        </p>
      )}

      {permission === "denied" && (
        <p style={{ color: "#FF2D78", fontSize: 12, marginBottom: 8 }}>
          Notifications blocked — enable in browser settings.
        </p>
      )}

      {pushSupported && permission === "granted" && (
        <button
          onClick={sendTestNotification}
          style={{
            background: "rgba(255,0,110,0.08)",
            border: "1px solid rgba(255,0,110,0.35)",
            borderRadius: 12,
            padding: "8px 14px",
            color: testSent ? "#39FF14" : "rgba(240,238,255,0.60)",
            fontSize: 12,
            cursor: "pointer",
            width: "100%",
            textShadow: testSent ? "0 0 10px rgba(57,255,20,0.60)" : "none",
          }}
        >
          {testSent ? "✓ Test sent!" : "Send test notification"}
        </button>
      )}
    </Card>
  );
}
