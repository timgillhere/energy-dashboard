import type { Rate, ConsumptionInterval } from "./types";

// Convert UTC timestamp to UK calendar date string ("2026-06-22")
// Simplified: assumes BST (+1h). Accurate for Apr–Oct; GMT = UTC in winter.
export function toUKDateKey(utcDate: Date): string {
  const bst = new Date(utcDate.getTime() + 60 * 60 * 1000);
  return bst.toISOString().slice(0, 10);
}

// Returns 0–47 for the BST half-hour slot of a UTC timestamp
export function toHalfHourSlot(utcDate: Date): number {
  const bst = new Date(utcDate.getTime() + 60 * 60 * 1000);
  return bst.getUTCHours() * 2 + (bst.getUTCMinutes() >= 30 ? 1 : 0);
}

export const SLOT_LABELS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

export function getRateForTime(ts: Date, rates: Rate[]): number | null {
  return (
    rates.find((r) => {
      const from = new Date(r.valid_from);
      const to = r.valid_to ? new Date(r.valid_to) : null;
      return from <= ts && (to === null || to > ts);
    })?.value_inc_vat ?? null
  );
}

export function avgRate(rates: Rate[]): number {
  if (!rates.length) return 0;
  return rates.reduce((s, r) => s + r.value_inc_vat, 0) / rates.length;
}

// Get all intervals for a given UK calendar date string
export function getIntervalsForUKDate(
  data: ConsumptionInterval[],
  ukDateKey: string
): ConsumptionInterval[] {
  return data.filter((d) => toUKDateKey(new Date(d.interval_start)) === ukDateKey);
}

// Build a 48-slot array of kWh for a UK day
export function buildHalfHourlySlots(
  data: ConsumptionInterval[],
  ukDateKey: string
): (number | null)[] {
  const slots: (number | null)[] = Array(48).fill(null);
  for (const d of getIntervalsForUKDate(data, ukDateKey)) {
    const slot = toHalfHourSlot(new Date(d.interval_start));
    slots[slot] = (slots[slot] ?? 0) + d.consumption;
  }
  return slots;
}

// Average consumption by half-hour slot across all available data
export function buildAveragePattern(data: ConsumptionInterval[]): number[] {
  const sums = Array(48).fill(0);
  const counts = Array(48).fill(0);
  for (const d of data) {
    const slot = toHalfHourSlot(new Date(d.interval_start));
    sums[slot] += d.consumption;
    counts[slot]++;
  }
  return sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
}

export interface DayCost {
  dateKey: string;
  label: string;
  electricityKwh: number;
  electricityCost: number;
  gasKwh: number;
  gasCost: number;
  total: number;
  estimated: boolean;
}

export function computeDailyCosts(
  electricityData: ConsumptionInterval[],
  gasData: ConsumptionInterval[],
  elecRates: Rate[],
  gasRates: Rate[],
  elecStanding: number,
  gasStanding: number,
  fallbackElecRate: number,
  fallbackGasRate: number,
  fromDate: Date,
  toDate: Date
): DayCost[] {
  const results: DayCost[] = [];
  const cur = new Date(fromDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const key = toUKDateKey(cur);
    const label = cur.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const elecIntervals = getIntervalsForUKDate(electricityData, key);
    const gasIntervals = getIntervalsForUKDate(gasData, key);

    if (elecIntervals.length === 0 && gasIntervals.length === 0) {
      cur.setDate(cur.getDate() + 1);
      continue;
    }

    let elecKwh = 0, elecCost = 0, elecEst = false;
    for (const d of elecIntervals) {
      const r = getRateForTime(new Date(d.interval_start), elecRates) ?? (elecEst = true, fallbackElecRate);
      elecKwh += d.consumption;
      elecCost += (d.consumption * r) / 100;
    }
    if (elecIntervals.length > 0) elecCost += elecStanding / 100;

    let gasKwh = 0, gasCost = 0, gasEst = false;
    for (const d of gasIntervals) {
      const r = getRateForTime(new Date(d.interval_start), gasRates) ?? (gasEst = true, fallbackGasRate);
      gasKwh += d.consumption;
      gasCost += (d.consumption * r) / 100;
    }
    if (gasIntervals.length > 0) gasCost += gasStanding / 100;

    results.push({
      dateKey: key,
      label,
      electricityKwh: elecKwh,
      electricityCost: elecCost,
      gasKwh,
      gasCost,
      total: elecCost + gasCost,
      estimated: elecEst || gasEst,
    });

    cur.setDate(cur.getDate() + 1);
  }

  return results;
}
