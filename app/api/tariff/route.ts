import { NextRequest, NextResponse } from "next/server";

const OCTOPUS_BASE = "https://api.octopus.energy/v1";

function activeAgreement(agreements: Array<{ tariff_code: string; valid_from: string; valid_to: string | null }>) {
  const now = new Date();
  return agreements.find((a) => {
    const from = new Date(a.valid_from);
    const to = a.valid_to ? new Date(a.valid_to) : null;
    return from <= now && (to === null || to > now);
  }) ?? agreements[0] ?? null;
}

function productCodeFromTariff(tariffCode: string): string {
  // E-1R-SILVER-FLEX-22-11-25-J  →  SILVER-FLEX-22-11-25
  return tariffCode.replace(/^[EG]-\dR-/, "").replace(/-[A-Z]$/, "");
}

function gasFromElecTariff(elecTariffCode: string): string {
  // E-1R-SILVER-FLEX-22-11-25-J  →  G-1R-SILVER-FLEX-22-11-25-J
  return elecTariffCode.replace(/^E-/, "G-");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mpan = searchParams.get("mpan");
  const mprn = searchParams.get("mprn");

  const apiKey = process.env.OCTOPUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured on server" }, { status: 500 });
  }

  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");

  let electricityTariffCode: string | null = null;
  let gasTariffCode: string | null = null;

  if (mpan) {
    try {
      const res = await fetch(`${OCTOPUS_BASE}/electricity-meter-points/${mpan}/`, {
        headers: { Authorization: auth },
      });
      if (res.ok) {
        const data = await res.json();
        const agreement = activeAgreement(data.agreements ?? []);
        electricityTariffCode = agreement?.tariff_code ?? null;
      }
    } catch {}
  }

  if (mprn) {
    try {
      const res = await fetch(`${OCTOPUS_BASE}/gas-meter-points/${mprn}/`, {
        headers: { Authorization: auth },
      });
      if (res.ok) {
        const data = await res.json();
        const agreement = activeAgreement(data.agreements ?? []);
        gasTariffCode = agreement?.tariff_code ?? null;
      }
    } catch {}
  }

  // If gas tariff wasn't independently found, derive it from the electricity one
  if (!gasTariffCode && electricityTariffCode) {
    gasTariffCode = gasFromElecTariff(electricityTariffCode);
  }

  const productCode = electricityTariffCode ? productCodeFromTariff(electricityTariffCode) : null;

  return NextResponse.json({
    electricityTariffCode,
    gasTariffCode,
    productCode,
  });
}
