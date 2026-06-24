import type { RateStatus } from "./types";

export function getRateStatus(rate: number, threshold: number): RateStatus {
  if (rate <= threshold) return "cheap";
  if (rate <= threshold * 1.2) return "borderline";
  return "expensive";
}

export const STATUS_COLORS: Record<RateStatus, string> = {
  cheap: "#39FF14",
  borderline: "#FFE500",
  expensive: "#FF2D78",
};

export const STATUS_BG: Record<RateStatus, string> = {
  cheap: "rgba(57,255,20,0.10)",
  borderline: "rgba(255,229,0,0.10)",
  expensive: "rgba(255,45,120,0.10)",
};

export const STATUS_LABELS: Record<RateStatus, string> = {
  cheap: "Good time to run appliances",
  borderline: "Borderline — consider waiting",
  expensive: "Rates are elevated right now",
};

export const STATUS_ICONS: Record<RateStatus, string> = {
  cheap: "✓",
  borderline: "~",
  expensive: "↑",
};
