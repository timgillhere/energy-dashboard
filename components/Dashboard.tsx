"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Nav from "./Nav";
import RateHero from "./RateHero";
import SpendToday from "./SpendToday";
import AlertPanel from "./AlertPanel";
import SettingsPanel from "./SettingsPanel";
import RateForecast from "./RateForecast";
import StatsRow from "./StatsRow";
import HalfHourlyChart from "./HalfHourlyChart";
import DailyCostChart from "./DailyCostChart";
import UsagePatterns from "./UsagePatterns";
import RangeFilter, { type Preset } from "./RangeFilter";
import type { Rate, ConsumptionInterval, Settings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/settings";
import { computeDailyCosts, avgRate } from "@/lib/dataUtils";

type View = "dashboard" | "history" | "settings";

function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function presetToDateRange(preset: Preset, selectedDate: Date): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (preset === "1D") return { from: selectedDate, to: selectedDate };
  const days = preset === "7D" ? 7 : preset === "30D" ? 30 : 90;
  from.setDate(from.getDate() - days + 1);
  return { from, to };
}

function periodLabel(preset: Preset, selectedDate: Date): string {
  if (preset === "1D") {
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const isYesterday = selectedDate.toDateString() === yesterday().toDateString();
    if (isToday) return "today";
    if (isYesterday) return "yesterday";
    return selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  return `last ${preset === "7D" ? "7" : preset === "30D" ? "30" : "90"} days`;
}

function getDateRange(daysBack: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return { from: from.toISOString(), to: to.toISOString() };
}

function findCurrentSlot(results: Rate[]): Rate | null {
  const now = new Date();
  return results.find((r) => {
    const from = new Date(r.valid_from);
    const to = r.valid_to ? new Date(r.valid_to) : null;
    return from <= now && (to === null || to > now);
  }) ?? null;
}

function findNextSlot(results: Rate[]): Rate | null {
  const now = new Date();
  return (
    results
      .filter((r) => new Date(r.valid_from) > now)
      .sort((a, b) => new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime())[0] ?? null
  );
}

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const [preset, setPreset] = useState<Preset>("1D");
  const [selectedDate, setSelectedDate] = useState<Date>(yesterday);

  const [elecRate, setElecRate] = useState<Rate | null>(null);
  const [gasRate, setGasRate] = useState<Rate | null>(null);
  const [tomorrowElec, setTomorrowElec] = useState<Rate | null>(null);
  const [tomorrowGas, setTomorrowGas] = useState<Rate | null>(null);
  const [allElecRates, setAllElecRates] = useState<Rate[]>([]);
  const [allGasRates, setAllGasRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const [electricityData, setElectricityData] = useState<ConsumptionInterval[]>([]);
  const [gasData, setGasData] = useState<ConsumptionInterval[]>([]);

  const dateRange = useMemo(() => presetToDateRange(preset, selectedDate), [preset, selectedDate]);
  const label = useMemo(() => periodLabel(preset, selectedDate), [preset, selectedDate]);

  const fallbackElecRate = useMemo(() => avgRate(allElecRates), [allElecRates]);
  const fallbackGasRate = useMemo(() => avgRate(allGasRates), [allGasRates]);

  const dailyCosts = useMemo(
    () => computeDailyCosts(
      electricityData, gasData, allElecRates, allGasRates,
      settings.electricityStandingCharge, settings.gasStandingCharge,
      fallbackElecRate || settings.alertThreshold, fallbackGasRate || settings.gasUnitRate,
      dateRange.from, dateRange.to
    ),
    [electricityData, gasData, allElecRates, allGasRates, settings, fallbackElecRate, fallbackGasRate, dateRange]
  );

  useEffect(() => {
    if (!settings.alertsEnabled || !elecRate) return;
    if ("Notification" in window && Notification.permission === "granted") {
      const rate = elecRate.value_inc_vat;
      if (rate <= settings.alertThreshold) {
        new Notification("Energy Alert — Low Rate Now", {
          body: `Good time to run appliances — rate is ${rate.toFixed(2)}p/kWh`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  }, [elecRate, settings.alertsEnabled, settings.alertThreshold]);

  useEffect(() => {
    if (!settings.alertsEnabled || !tomorrowElec) return;
    if ("Notification" in window && Notification.permission === "granted") {
      const rate = tomorrowElec.value_inc_vat;
      if (rate <= settings.alertThreshold) {
        new Notification("Energy Alert — Cheap Tomorrow", {
          body: `Tomorrow's rate is ${rate.toFixed(2)}p/kWh`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  }, [tomorrowElec, settings.alertsEnabled, settings.alertThreshold]);

  const fetchRates = useCallback(async () => {
    if (!settings.productCode || !settings.tariffCode) {
      setRatesError("Tariff not configured — use Auto-detect in Settings.");
      return;
    }
    setRatesLoading(true);
    setRatesError(null);
    try {
      const [elecRes, gasRes] = await Promise.all([
        fetch(`/api/rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.tariffCode)}&days_back=90`, { cache: "no-store" }),
        settings.gasTariffCode
          ? fetch(`/api/gas-rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.gasTariffCode)}&days_back=90`, { cache: "no-store" })
          : Promise.resolve(null),
      ]);
      const elecData = await elecRes.json();
      if (!elecRes.ok || elecData.error) { setRatesError(elecData.error ?? `API error ${elecRes.status}`); return; }
      const elecResults: Rate[] = elecData.results ?? [];
      setAllElecRates(elecResults);
      setElecRate(findCurrentSlot(elecResults));
      setTomorrowElec(findNextSlot(elecResults));
      if (gasRes?.ok) {
        const gasData = await gasRes.json();
        const gasResults: Rate[] = gasData.results ?? [];
        setAllGasRates(gasResults);
        setGasRate(findCurrentSlot(gasResults));
        setTomorrowGas(findNextSlot(gasResults));
      }
      setLastFetch(new Date());
    } catch { setRatesError("Network error fetching rates."); }
    finally { setRatesLoading(false); }
  }, [settings.productCode, settings.tariffCode, settings.gasTariffCode]);

  const fetchConsumption = useCallback(async () => {
    const { from, to } = getDateRange(180);
    if (settings.mpan && settings.electricitySerial) {
      try {
        const res = await fetch(`/api/consumption/electricity?mpan=${settings.mpan}&serial=${settings.electricitySerial}&period_from=${from}&period_to=${to}&page_size=10000`, { cache: "no-store" });
        const data = await res.json();
        setElectricityData(data.results ?? []);
      } catch {}
    }
    if (settings.mprn && settings.gasSerial) {
      try {
        const res = await fetch(`/api/consumption/gas?mprn=${settings.mprn}&serial=${settings.gasSerial}&period_from=${from}&period_to=${to}&page_size=10000`, { cache: "no-store" });
        const data = await res.json();
        setGasData(data.results ?? []);
      } catch {}
    }
  }, [settings.mpan, settings.electricitySerial, settings.mprn, settings.gasSerial]);

  useEffect(() => { fetchRates(); fetchConsumption(); }, [fetchRates, fetchConsumption]);
  useEffect(() => { const id = setInterval(fetchRates, 30 * 60 * 1000); return () => clearInterval(id); }, [fetchRates]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((cloud: Partial<Settings>) => {
      if (cloud && Object.keys(cloud).length > 0) {
        const merged: Settings = { ...loadSettings(), ...cloud };
        setSettings(merged); saveSettings(merged);
      }
    }).catch(() => {}).finally(() => setCloudLoaded(true));
  }, []);

  useEffect(() => {
    if (!cloudLoaded || settings.productCode) return;
    fetch("/api/tariff").then((r) => r.json()).then((data) => {
      if (!data.productCode) return;
      setSettings((prev) => {
        if (prev.productCode) return prev;
        const updated: Settings = {
          ...prev,
          productCode: data.productCode,
          tariffCode: data.electricityTariffCode ?? prev.tariffCode,
          gasTariffCode: data.gasTariffCode ?? prev.gasTariffCode,
          mpan: data.mpan ?? prev.mpan,
          mprn: data.mprn ?? prev.mprn,
          electricitySerial: data.electricitySerial ?? prev.electricitySerial,
          gasSerial: data.gasSerial ?? prev.gasSerial,
        };
        saveSettings(updated);
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) }).catch(() => {});
        return updated;
      });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudLoaded]);

  function persistSettings(updated: Settings) {
    saveSettings(updated);
    fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) }).catch(() => {});
  }

  function handleSaveSettings(updated: Settings) {
    setSettings(updated);
    setElecRate(null); setGasRate(null);
    setRatesError(null);
    setAllElecRates([]); setAllGasRates([]);
    persistSettings(updated);
  }

  const gasRateValue = gasRate?.value_inc_vat ?? settings.gasUnitRate;

  const sectionLabel: React.CSSProperties = {
    color: "rgba(0,240,255,0.70)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 6,
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#07070F" }}>
      <Nav view={view} onNavigate={setView} />

      <main style={{ marginLeft: 64, flex: 1, padding: "28px 28px 60px", maxWidth: 1040 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FF2D78", letterSpacing: "0.06em", textTransform: "uppercase", textShadow: "0 0 20px rgba(255,45,120,0.60)" }}>
              {view === "dashboard" ? "Dashboard" : view === "history" ? "History" : "Settings"}
            </h1>
            <p style={{ color: "rgba(240,238,255,0.45)", fontSize: 13, marginTop: 3 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          {view !== "settings" && (
            <RangeFilter preset={preset} selectedDate={selectedDate} onPreset={setPreset} onDayChange={setSelectedDate} />
          )}
        </div>

        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RateHero elecRate={elecRate} gasRate={gasRate} tomorrowElec={tomorrowElec} tomorrowGas={tomorrowGas} settings={settings} lastFetch={lastFetch} loading={ratesLoading} error={ratesError} onRefresh={fetchRates} onGoToSettings={() => setView("settings")} />
            <div>
              <p style={sectionLabel}>{preset === "1D" ? label.charAt(0).toUpperCase() + label.slice(1) : label} at a glance</p>
              <StatsRow days={dailyCosts} periodLabel={label} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SpendToday electricityData={electricityData} gasData={gasData} todayRate={elecRate?.value_inc_vat ?? fallbackElecRate} gasUnitRate={gasRateValue} settings={settings} displayDate={selectedDate} onRefresh={fetchConsumption} />
              <AlertPanel settings={settings} onToggle={(enabled) => { const updated = { ...settings, alertsEnabled: enabled }; setSettings(updated); persistSettings(updated); }} currentRate={elecRate?.value_inc_vat ?? null} />
            </div>
            <div>
              <p style={sectionLabel}>Half-hourly consumption — {label}</p>
              <HalfHourlyChart electricityData={electricityData} gasData={gasData} elecRates={allElecRates} gasRates={allGasRates} selectedDate={selectedDate} todayRate={elecRate?.value_inc_vat ?? null} />
            </div>
            {preset !== "1D" && (
              <div>
                <p style={sectionLabel}>Daily cost — {label}</p>
                <DailyCostChart days={dailyCosts} periodLabel={label} />
              </div>
            )}
            <div>
              <p style={sectionLabel}>Tracker rates</p>
              <RateForecast elecRates={allElecRates} gasRates={allGasRates} />
            </div>
          </div>
        )}

        {view === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={sectionLabel}>{label} at a glance</p>
              <StatsRow days={dailyCosts} periodLabel={label} />
            </div>
            <div>
              <p style={sectionLabel}>Daily spend — {label}</p>
              <DailyCostChart days={dailyCosts} periodLabel={label} />
            </div>
            <div>
              <p style={sectionLabel}>Half-hourly breakdown — {label}</p>
              <HalfHourlyChart electricityData={electricityData} gasData={gasData} elecRates={allElecRates} gasRates={allGasRates} selectedDate={selectedDate} todayRate={elecRate?.value_inc_vat ?? null} />
            </div>
            <div>
              <p style={sectionLabel}>Usage patterns by time of day</p>
              <UsagePatterns electricityData={electricityData} gasData={gasData} />
            </div>
            <div>
              <p style={sectionLabel}>Tracker rate history</p>
              <RateForecast elecRates={allElecRates} gasRates={allGasRates} />
            </div>
          </div>
        )}

        {view === "settings" && <SettingsPanel settings={settings} onSave={handleSaveSettings} />}

      </main>
    </div>
  );
}
