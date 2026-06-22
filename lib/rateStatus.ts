import type { RateStatus } from "./types";

export function getRateStatus(rate: number, threshold: number): RateStatus {
  if (rate <= threshold) return "cheap";
  if (rate <= threshold * 1.2) return "borderline";
  return "expensive";
}

export const STATUS_COLORS: Record<RateStatus, string> = {
  cheap: "#a3e635",
  borderline: "#f97316",
  expensive: "#ef4444",
};

export const STATUS_BG: Record<RateStatus, string> = {
  cheap: "rgba(163,230,53,0.1)",
  borderline: "rgba(249,115,22,0.1)",
  expensive: "rgba(239,68,68,0.1)",
};

export const STATUS_LABELS: Record<RateStatus, string> = {
  cheap: "Good time to run appliances",
  borderline: "Borderline — consider waiting",
  expensive: "Expensive right now — delay if you can",
};

export const STATUS_ICONS: Record<RateStatus, string> = {
  cheap: "✅",
  borderline: "⚠️",
  expensive: "❌",
};
