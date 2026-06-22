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
      body: `Good time to run appliances or charge the van — rate is ${rate.toFixed(2)}p/kWh`,
      icon: "/icons/icon-192.png",
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Rate Alerts
        </p>
        <div
          onClick={handleToggle}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: settings.alertsEnabled ? "#a3e635" : "#1e1e1e",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: settings.alertsEnabled ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: settings.alertsEnabled ? "#0a0a0a" : "#4b5563",
              transition: "left 0.2s",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {settings.alertsEnabled ? (
          <Bell size={16} color="#a3e635" />
        ) : (
          <BellOff size={16} color="#4b5563" />
        )}
        <span style={{ color: "#9ca3af", fontSize: 13 }}>
          {settings.alertsEnabled
            ? `Notify when rate ≤ ${settings.alertThreshold}p/kWh`
            : "Alerts disabled"}
        </span>
      </div>

      {!pushSupported && (
        <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
          Push notifications not supported in this browser.
        </p>
      )}

      {permission === "denied" && (
        <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>
          Notifications blocked — enable in browser settings.
        </p>
      )}

      {pushSupported && permission === "granted" && (
        <button
          onClick={sendTestNotification}
          style={{
            background: "#1e1e1e",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: "8px 14px",
            color: testSent ? "#a3e635" : "#9ca3af",
            fontSize: 12,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {testSent ? "✓ Test sent!" : "Send test notification"}
        </button>
      )}
    </Card>
  );
}
