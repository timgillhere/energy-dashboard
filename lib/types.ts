export interface Settings {
  mpan: string;
  electricitySerial: string;
  mprn: string;
  gasSerial: string;
  productCode: string;
  tariffCode: string;
  gasUnitRate: number;
  gasStandingCharge: number;
  electricityStandingCharge: number;
  alertThreshold: number;
  alertsEnabled: boolean;
}

export interface Rate {
  value_inc_vat: number;
  valid_from: string;
  valid_to: string | null;
}

export interface ConsumptionInterval {
  consumption: number;
  interval_start: string;
  interval_end: string;
}

export interface DailySpend {
  date: string;
  electricityKwh: number;
  electricityCost: number;
  gasKwh: number;
  gasCost: number;
  total: number;
}

export type RateStatus = "cheap" | "borderline" | "expensive";
