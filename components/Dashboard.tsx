"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "./Nav";
import RateHero from "./RateHero";
import SpendToday from "./SpendToday";
import WeeklyChart from "./WeeklyChart";
import AlertPanel from "./AlertPanel";
import SettingsPanel from "./SettingsPanel";
import type { Rate, ConsumptionInterval, Settings } from "@/lib/types";
import { loadSettings } from "@/lib/settings";
import { getRateStatus } from "@/lib/rateStatus";

type View = "dashboard" | "history" | "settings";

function getDateRange(daysBack: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const [todayRate, setTodayRate] = useState<Rate | null>(null);
  const [tomorrowRate, setTomorrowRate] = useState<Rate | null>(null);
  const [tomorrowRates, setTomorrowRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const [electricityData, setElectricityData] = useState<ConsumptionInterval[]>([]);
  const [gasData, setGasData] = useState<ConsumptionInterval[]>([]);

  // Rate alert check
  useEffect(() => {
    if (!settings.alertsEnabled || todayRate === null) return;
    if ("Notification" in window && Notification.permission === "granted") {
      const rate = todayRate.value_inc_vat;
      if (rate <= settings.alertThreshold) {
        new Notification("Energy Alert — Low Rate Now", {
          body: `Good time to run appliances or charge the van — rate is ${rate.toFixed(2)}p/kWh`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  }, [todayRate, settings.alertsEnabled, settings.alertThreshold]);

  // Check tomorrow's rate alert
  useEffect(() => {
    if (!settings.alertsEnabled || tomorrowRate === null) return;
    if ("Notification" in window && Notification.permission === "granted") {
      const rate = tomorrowRate.value_inc_vat;
      if (rate <= settings.alertThreshold) {
        new Notification("Energy Alert — Cheap Tomorrow", {
          body: `Tomorrow's rate is ${rate.toFixed(2)}p/kWh — good time to plan charging the van`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  }, [tomorrowRate, settings.alertsEnabled, settings.alertThreshold]);

  const fetchRates = useCallback(async () => {
    if (!settings.productCode || !settings.tariffCode) return;
    setRatesLoading(true);
    try {
      const res = await fetch(
        `/api/rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.tariffCode)}`
      );
      const data = await res.json();
      const results: Rate[] = data.results ?? [];

      const now = new Date();
      const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

      // For Agile (and Tracker): find the slot active right now
      const current = results.find((r) => {
        const from = new Date(r.valid_from);
        const to = r.valid_to ? new Date(r.valid_to) : null;
        return from <= now && (to === null || to > now);
      }) ?? null;

      // Tomorrow's slots — cheapest as the headline, keep all for display
      const tomorrowSlots = results.filter((r) => r.valid_from?.startsWith(tomorrowStr));
      const cheapestTomorrow = tomorrowSlots.length
        ? tomorrowSlots.reduce((min, r) => r.value_inc_vat < min.value_inc_vat ? r : min)
        : null;

      setTodayRate(current);
      setTomorrowRate(cheapestTomorrow);
      setTomorrowRates(tomorrowSlots);
      setLastFetch(new Date());
    } catch (e) {
      console.error("Failed to fetch rates", e);
    } finally {
      setRatesLoading(false);
    }
  }, [settings.productCode, settings.tariffCode]);

  const fetchConsumption = useCallback(async () => {
    const { from, to } = getDateRange(180);

    if (settings.mpan && settings.electricitySerial) {
      try {
        const res = await fetch(
          `/api/consumption/electricity?mpan=${settings.mpan}&serial=${settings.electricitySerial}&period_from=${from}&period_to=${to}&page_size=2000`
        );
        const data = await res.json();
        setElectricityData(data.results ?? []);
      } catch {
        console.error("Failed to fetch electricity consumption");
      }
    }

    if (settings.mprn && settings.gasSerial) {
      try {
        const res = await fetch(
          `/api/consumption/gas?mprn=${settings.mprn}&serial=${settings.gasSerial}&period_from=${from}&period_to=${to}&page_size=2000`
        );
        const data = await res.json();
        setGasData(data.results ?? []);
      } catch {
        console.error("Failed to fetch gas consumption");
      }
    }
  }, [settings.mpan, settings.electricitySerial, settings.mprn, settings.gasSerial]);

  useEffect(() => {
    fetchRates();
    fetchConsumption();
  }, [fetchRates, fetchConsumption]);

  // Auto-refresh rates every 30 min so the active Agile slot stays current
  useEffect(() => {
    const id = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchRates]);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const isConfigured = settings.mpan || settings.mprn;

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#0a0a0a" }}>
      <Nav view={view} onNavigate={setView} />

      <main
        style={{
          marginLeft: 64,
          flex: 1,
          padding: "28px 28px 40px",
          maxWidth: 900,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#ededed",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {view === "dashboard" && "Dashboard"}
            {view === "history" && "History"}
            {view === "settings" && "Settings"}
          </h1>
          {view === "dashboard" && (
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          )}
        </div>

        {/* Dashboard view */}
        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <RateHero
              todayRate={todayRate}
              tomorrowRate={tomorrowRate}
              tomorrowRates={tomorrowRates}
              settings={settings}
              lastFetch={lastFetch}
              loading={ratesLoading}
              onRefresh={fetchRates}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <SpendToday
                electricityData={electricityData}
                gasData={gasData}
                todayRate={todayRate?.value_inc_vat ?? null}
                settings={settings}
              />
              <AlertPanel
                settings={settings}
                onToggle={(enabled) => {
                  const updated = { ...settings, alertsEnabled: enabled };
                  setSettings(updated);
                  import("@/lib/settings").then((m) => m.saveSettings(updated));
                }}
                currentRate={todayRate?.value_inc_vat ?? null}
              />
            </div>

            {!isConfigured && (
              <div
                style={{
                  background: "#141414",
                  border: "1px dashed #2a2a2a",
                  borderRadius: 20,
                  padding: 24,
                  textAlign: "center",
                  color: "#4b5563",
                }}
              >
                <p style={{ marginBottom: 8 }}>Configure your meter details in Settings to see consumption data.</p>
                <button
                  onClick={() => setView("settings")}
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #2a2a2a",
                    borderRadius: 10,
                    padding: "8px 16px",
                    color: "#a3e635",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Go to Settings →
                </button>
              </div>
            )}
          </div>
        )}

        {/* History view */}
        {view === "history" && (
          <WeeklyChart
            electricityData={electricityData}
            gasData={gasData}
            settings={settings}
            todayRate={todayRate?.value_inc_vat ?? null}
          />
        )}

        {/* Settings view */}
        {view === "settings" && (
          <SettingsPanel settings={settings} onSave={setSettings} />
        )}
      </main>
    </div>
  );
}
