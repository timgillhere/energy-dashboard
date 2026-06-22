"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "./Nav";
import RateHero from "./RateHero";
import SpendToday from "./SpendToday";
import WeeklyChart from "./WeeklyChart";
import AlertPanel from "./AlertPanel";
import SettingsPanel from "./SettingsPanel";
import type { Rate, ConsumptionInterval, Settings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/settings";

type View = "dashboard" | "history" | "settings";

function getDateRange(daysBack: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return { from: from.toISOString(), to: to.toISOString() };
}

function findCurrentSlot(results: Rate[]): Rate | null {
  const now = new Date();
  return (
    results.find((r) => {
      const from = new Date(r.valid_from);
      const to = r.valid_to ? new Date(r.valid_to) : null;
      return from <= now && (to === null || to > now);
    }) ?? null
  );
}

function findTomorrowSlots(results: Rate[]): Rate[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  return results.filter((r) => r.valid_from?.startsWith(tomorrowStr));
}

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const [elecRate, setElecRate] = useState<Rate | null>(null);
  const [gasRate, setGasRate] = useState<Rate | null>(null);
  const [tomorrowRate, setTomorrowRate] = useState<Rate | null>(null);
  const [tomorrowRates, setTomorrowRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const [electricityData, setElectricityData] = useState<ConsumptionInterval[]>([]);
  const [gasData, setGasData] = useState<ConsumptionInterval[]>([]);

  // Alert on cheap rate
  useEffect(() => {
    if (!settings.alertsEnabled || !elecRate) return;
    if ("Notification" in window && Notification.permission === "granted") {
      const rate = elecRate.value_inc_vat;
      if (rate <= settings.alertThreshold) {
        new Notification("Energy Alert — Low Rate Now", {
          body: `Good time to run appliances or charge the van — rate is ${rate.toFixed(2)}p/kWh`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  }, [elecRate, settings.alertsEnabled, settings.alertThreshold]);

  useEffect(() => {
    if (!settings.alertsEnabled || !tomorrowRate) return;
    if ("Notification" in window && Notification.permission === "granted") {
      const rate = tomorrowRate.value_inc_vat;
      if (rate <= settings.alertThreshold) {
        new Notification("Energy Alert — Cheap Tomorrow", {
          body: `Tomorrow's cheapest rate is ${rate.toFixed(2)}p/kWh — good time to plan charging the van`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  }, [tomorrowRate, settings.alertsEnabled, settings.alertThreshold]);

  const fetchRates = useCallback(async () => {
    if (!settings.productCode || !settings.tariffCode) {
      setRatesError("Tariff not configured — use Auto-detect in Settings or enter codes manually.");
      return;
    }
    setRatesLoading(true);
    setRatesError(null);

    try {
      // Electricity rate
      const elecRes = await fetch(
        `/api/rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.tariffCode)}`
      );
      const elecData = await elecRes.json();
      if (!elecRes.ok || elecData.error) {
        setRatesError(elecData.error ?? `API error ${elecRes.status} — check tariff codes in Settings`);
        return;
      }
      const elecResults: Rate[] = elecData.results ?? [];
      setElecRate(findCurrentSlot(elecResults));
      const tmrSlots = findTomorrowSlots(elecResults);
      setTomorrowRates(tmrSlots);
      setTomorrowRate(
        tmrSlots.length
          ? tmrSlots.reduce((min, r) => (r.value_inc_vat < min.value_inc_vat ? r : min))
          : null
      );

      // Gas rate (Tracker has a separate gas-tariffs endpoint)
      if (settings.gasTariffCode) {
        const gasRes = await fetch(
          `/api/gas-rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.gasTariffCode)}`
        );
        if (gasRes.ok) {
          const gasData = await gasRes.json();
          const gasResults: Rate[] = gasData.results ?? [];
          setGasRate(findCurrentSlot(gasResults));
        }
      }

      setLastFetch(new Date());
    } catch (e) {
      setRatesError("Network error fetching rates — check your connection.");
    } finally {
      setRatesLoading(false);
    }
  }, [settings.productCode, settings.tariffCode, settings.gasTariffCode]);

  const fetchConsumption = useCallback(async () => {
    const { from, to } = getDateRange(180);
    if (settings.mpan && settings.electricitySerial) {
      try {
        const res = await fetch(
          `/api/consumption/electricity?mpan=${settings.mpan}&serial=${settings.electricitySerial}&period_from=${from}&period_to=${to}&page_size=2000`
        );
        const data = await res.json();
        setElectricityData(data.results ?? []);
      } catch {}
    }
    if (settings.mprn && settings.gasSerial) {
      try {
        const res = await fetch(
          `/api/consumption/gas?mprn=${settings.mprn}&serial=${settings.gasSerial}&period_from=${from}&period_to=${to}&page_size=2000`
        );
        const data = await res.json();
        setGasData(data.results ?? []);
      } catch {}
    }
  }, [settings.mpan, settings.electricitySerial, settings.mprn, settings.gasSerial]);

  useEffect(() => {
    fetchRates();
    fetchConsumption();
  }, [fetchRates, fetchConsumption]);

  // Auto-refresh rates every 30 min
  useEffect(() => {
    const id = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchRates]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  function handleSaveSettings(updated: Settings) {
    setSettings(updated);
    // Clear rates so they re-fetch with new tariff codes
    setElecRate(null);
    setGasRate(null);
    setRatesError(null);
  }

  const gasRateValue = gasRate?.value_inc_vat ?? settings.gasUnitRate;

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#0a0a0a" }}>
      <Nav view={view} onNavigate={setView} />

      <main style={{ marginLeft: 64, flex: 1, padding: "28px 28px 40px", maxWidth: 900 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ededed", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            {view === "dashboard" ? "Dashboard" : view === "history" ? "History" : "Settings"}
          </h1>
          {view === "dashboard" && (
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          )}
        </div>

        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <RateHero
              elecRate={elecRate}
              gasRate={gasRate}
              tomorrowRate={tomorrowRate}
              tomorrowRates={tomorrowRates}
              settings={settings}
              lastFetch={lastFetch}
              loading={ratesLoading}
              error={ratesError}
              onRefresh={fetchRates}
              onGoToSettings={() => setView("settings")}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <SpendToday
                electricityData={electricityData}
                gasData={gasData}
                todayRate={elecRate?.value_inc_vat ?? null}
                gasUnitRate={gasRateValue}
                settings={settings}
              />
              <AlertPanel
                settings={settings}
                onToggle={(enabled) => {
                  const updated = { ...settings, alertsEnabled: enabled };
                  setSettings(updated);
                  saveSettings(updated);
                }}
                currentRate={elecRate?.value_inc_vat ?? null}
              />
            </div>

            {!settings.mpan && !settings.mprn && (
              <div style={{ background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 20, padding: 24, textAlign: "center", color: "#4b5563" }}>
                <p style={{ marginBottom: 8 }}>Add your MPAN and MPRN in Settings to see consumption data.</p>
                <button
                  onClick={() => setView("settings")}
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 10, padding: "8px 16px", color: "#a3e635", fontSize: 13, cursor: "pointer" }}
                >
                  Go to Settings →
                </button>
              </div>
            )}
          </div>
        )}

        {view === "history" && (
          <WeeklyChart
            electricityData={electricityData}
            gasData={gasData}
            settings={settings}
            todayRate={elecRate?.value_inc_vat ?? null}
          />
        )}

        {view === "settings" && (
          <SettingsPanel settings={settings} onSave={handleSaveSettings} />
        )}
      </main>
    </div>
  );
}
