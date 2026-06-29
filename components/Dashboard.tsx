"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Nav from "./Nav";
import RateHero from "./RateHero";
import MonthCompare from "./MonthCompare";
import WeekCompare from "./WeekCompare";
import SettingsPanel from "./SettingsPanel";
import RateForecast from "./RateForecast";
import RateTrendChart from "./RateTrendChart";
import CostTrendChart from "./CostTrendChart";
import WeeklyHeatmap from "./WeeklyHeatmap";
import MonthlyChart from "./MonthlyChart";
import CalendarHeatmap from "./CalendarHeatmap";
import StatsRow from "./StatsRow";
import DailyCostChart from "./DailyCostChart";
import UsagePatterns from "./UsagePatterns";
import EnergyInsights from "./EnergyInsights";
import RangeFilter, { type Preset } from "./RangeFilter";
import type { Rate, ConsumptionInterval, Settings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/settings";
import { computeDailyCosts, avgRate } from "@/lib/dataUtils";
import { useBreakpoint } from "@/lib/useBreakpoint";

type View = "dashboard" | "settings";

function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function presetToDateRange(
  preset: Preset,
  selectedDate: Date,
  customFrom?: string,
  customTo?: string
): { from: Date; to: Date } {
  if (preset === "custom" && customFrom && customTo) {
    return {
      from: new Date(customFrom + "T00:00:00"),
      to: new Date(customTo + "T23:59:59"),
    };
  }
  const to = new Date();
  const from = new Date();
  if (preset === "1D") return { from: selectedDate, to: selectedDate };
  const days = preset === "7D" ? 7 : preset === "30D" ? 30 : 90;
  from.setDate(from.getDate() - days + 1);
  return { from, to };
}

function periodLabel(preset: Preset, selectedDate: Date, customFrom?: string, customTo?: string): string {
  if (preset === "1D") {
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const isYesterday = selectedDate.toDateString() === yesterday().toDateString();
    if (isToday) return "today";
    if (isYesterday) return "yesterday";
    return selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  if (preset === "custom" && customFrom && customTo) {
    const from = new Date(customFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const to = new Date(customTo).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${from} – ${to}`;
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
  const { isMobile, isTablet } = useBreakpoint();
  const [view, setView] = useState<View>("dashboard");
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const [preset, setPreset] = useState<Preset>("1D");
  const [selectedDate, setSelectedDate] = useState<Date>(yesterday);
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputValue(d);
  });
  const [customTo, setCustomTo] = useState<string>(() => toInputValue(new Date()));

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
  const [consumptionLoading, setConsumptionLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateRange = useMemo(
    () => presetToDateRange(preset, selectedDate, customFrom, customTo),
    [preset, selectedDate, customFrom, customTo]
  );
  const label = useMemo(
    () => periodLabel(preset, selectedDate, customFrom, customTo),
    [preset, selectedDate, customFrom, customTo]
  );

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

  const trendCosts = useMemo(
    () => computeDailyCosts(
      electricityData, gasData, allElecRates, allGasRates,
      settings.electricityStandingCharge, settings.gasStandingCharge,
      fallbackElecRate || settings.alertThreshold, fallbackGasRate || settings.gasUnitRate,
      new Date(Date.now() - 90 * 86400000), new Date()
    ),
    [electricityData, gasData, allElecRates, allGasRates, settings, fallbackElecRate, fallbackGasRate]
  );

  const yearCosts = useMemo(
    () => computeDailyCosts(
      electricityData, gasData, allElecRates, allGasRates,
      settings.electricityStandingCharge, settings.gasStandingCharge,
      fallbackElecRate || settings.alertThreshold, fallbackGasRate || settings.gasUnitRate,
      new Date(Date.now() - 365 * 86400000), new Date()
    ),
    [electricityData, gasData, allElecRates, allGasRates, settings, fallbackElecRate, fallbackGasRate]
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
        fetch(`/api/rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.tariffCode)}&days_back=365`, { cache: "no-store" }),
        settings.gasTariffCode
          ? fetch(`/api/gas-rates?product_code=${encodeURIComponent(settings.productCode)}&tariff_code=${encodeURIComponent(settings.gasTariffCode)}&days_back=365`, { cache: "no-store" })
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
    setConsumptionLoading(true);
    const { from, to } = getDateRange(365);
    try {
      const [elecRes, gasRes] = await Promise.all([
        fetch(`/api/consumption/electricity?period_from=${from}&period_to=${to}`, { cache: "no-store" }),
        fetch(`/api/consumption/gas?period_from=${from}&period_to=${to}`, { cache: "no-store" }),
      ]);
      if (elecRes.ok) { const d = await elecRes.json(); setElectricityData(d.results ?? []); }
      if (gasRes.ok) { const d = await gasRes.json(); setGasData(d.results ?? []); }
    } catch {}
    setConsumptionLoading(false);
  }, []);

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
    saveSettings(updated);
  }

  const gasRateValue = gasRate?.value_inc_vat ?? settings.gasUnitRate;

  function triggerFilter(fn: () => void) {
    fn();
    setFilterLoading(true);
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => setFilterLoading(false), 300);
  }

  const dataLoading = consumptionLoading || filterLoading;

  const sectionLabel: React.CSSProperties = {
    color: "rgba(0,240,255,0.80)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 6,
  };

  const contentPadding = isMobile ? "20px 16px 84px" : "28px 28px 60px";
  const contentMarginLeft = isMobile ? 0 : 64;

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#07070F" }}>
      <Nav view={view} onNavigate={setView} />

      <main style={{ marginLeft: contentMarginLeft, flex: 1, padding: contentPadding, maxWidth: isMobile ? "100%" : 1040 }}>

        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-start",
          marginBottom: 20,
          gap: 12,
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#FF2D78", letterSpacing: "0.06em", textTransform: "uppercase", textShadow: "0 0 20px rgba(255,45,120,0.60)" }}>
              {view === "dashboard" ? "Dashboard" : "Settings"}
            </h1>
            <p style={{ color: "rgba(240,238,255,0.60)", fontSize: 13, marginTop: 3 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          {view !== "settings" && (
            <RangeFilter
              preset={preset}
              onPreset={(p) => triggerFilter(() => setPreset(p))}
              customFrom={customFrom}
              customTo={customTo}
              onCustomChange={(from, to) => triggerFilter(() => { setCustomFrom(from); setCustomTo(to); })}
            />
          )}
        </div>

        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RateHero
              elecRate={elecRate}
              gasRate={gasRate}
              tomorrowElec={tomorrowElec}
              tomorrowGas={tomorrowGas}
              settings={settings}
              lastFetch={lastFetch}
              loading={ratesLoading}
              error={ratesError}
              onRefresh={fetchRates}
              onGoToSettings={() => setView("settings")}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#00F0FF", background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.30)", borderRadius: 8, padding: "4px 10px" }}>
                <span>⚡</span> Electricity
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#BF5FFF", background: "rgba(191,95,255,0.08)", border: "1px solid rgba(191,95,255,0.30)", borderRadius: 8, padding: "4px 10px" }}>
                <span>🔥</span> Gas
              </span>
            </div>

            <div>
              <p style={sectionLabel}>{preset === "1D" ? label.charAt(0).toUpperCase() + label.slice(1) : label} at a glance</p>
              <StatsRow days={dailyCosts} periodLabel={label} loading={dataLoading} singleDayView={preset === "1D"} />
            </div>

            <MonthCompare yearCosts={yearCosts} loading={consumptionLoading} />
            <WeekCompare yearCosts={yearCosts} loading={consumptionLoading} />

            <div>
              <p style={sectionLabel}>Insights</p>
              <EnergyInsights
                electricityData={electricityData}
                gasData={gasData}
                allElecRates={allElecRates}
                dailyCosts={dailyCosts}
                loading={dataLoading}
              />
            </div>

            <div>
              <p style={sectionLabel}>Monthly spend — last 12 months</p>
              <MonthlyChart days={yearCosts} />
            </div>

            {preset !== "1D" && (
              <div>
                <p style={sectionLabel}>Daily cost — {label}</p>
                <DailyCostChart days={dailyCosts} periodLabel={label} loading={dataLoading} />
              </div>
            )}

            <div>
              <p style={sectionLabel}>Usage patterns by time of day</p>
              <UsagePatterns electricityData={electricityData} gasData={gasData} />
            </div>

            <div>
              <p style={sectionLabel}>Weekly usage rhythm</p>
              <WeeklyHeatmap electricityData={electricityData} />
            </div>

            <div>
              <p style={sectionLabel}>Annual spend calendar</p>
              <CalendarHeatmap days={yearCosts} />
            </div>

            {preset !== "1D" && (
              <div>
                <p style={sectionLabel}>Spend trend — last 90 days</p>
                <CostTrendChart days={trendCosts} />
              </div>
            )}

            <div>
              <p style={sectionLabel}>Tracker rates</p>
              <RateForecast elecRates={allElecRates} gasRates={allGasRates} />
            </div>

            <div>
              <p style={sectionLabel}>Rate history — 365 days</p>
              <RateTrendChart elecRates={allElecRates} gasRates={allGasRates} />
            </div>
          </div>
        )}

        {view === "settings" && <SettingsPanel settings={settings} onSave={handleSaveSettings} currentRate={elecRate?.value_inc_vat ?? null} />}

      </main>
    </div>
  );
}
