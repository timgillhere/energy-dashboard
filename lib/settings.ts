import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  mpan: "",
  electricitySerial: "",
  mprn: "",
  gasSerial: "",
  productCode: "SILVER-FLEX-22-11-25",
  tariffCode: "E-1R-SILVER-FLEX-22-11-25-A",
  gasUnitRate: 6.5,
  gasStandingCharge: 29.0,
  electricityStandingCharge: 53.0,
  alertThreshold: 25,
  alertsEnabled: false,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem("octopus_settings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem("octopus_settings", JSON.stringify(s));
}
