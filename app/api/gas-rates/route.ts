import { NextRequest, NextResponse } from "next/server";

const OCTOPUS_BASE = "https://api.octopus.energy/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productCode = searchParams.get("product_code");
  const tariffCode = searchParams.get("tariff_code");

  if (!productCode || !tariffCode) {
    return NextResponse.json({ error: "Missing product_code or tariff_code" }, { status: 400 });
  }

  const apiKey = process.env.OCTOPUS_API_KEY;
  const headers: HeadersInit = apiKey
    ? { Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64") }
    : {};

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const url = `${OCTOPUS_BASE}/products/${productCode}/gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${todayStart.toISOString()}&period_to=${dayAfterTomorrow.toISOString()}`;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Octopus API error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch gas rates" }, { status: 500 });
  }
}
