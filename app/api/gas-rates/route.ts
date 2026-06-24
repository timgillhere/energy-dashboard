import { NextRequest, NextResponse } from "next/server";

const OCTOPUS_BASE = "https://api.octopus.energy/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productCode = searchParams.get("product_code");
  const tariffCode = searchParams.get("tariff_code");
  const daysBack = parseInt(searchParams.get("days_back") ?? "14", 10);

  if (!productCode || !tariffCode) {
    return NextResponse.json({ error: "Missing product_code or tariff_code" }, { status: 400 });
  }

  const apiKey = process.env.OCTOPUS_API_KEY;
  const headers: HeadersInit = apiKey
    ? { Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64") }
    : {};

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - daysBack);
  const url = `${OCTOPUS_BASE}/products/${productCode}/gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${from.toISOString()}&page_size=100`;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `Octopus API error ${res.status}: ${body}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch gas rates" }, { status: 500 });
  }
}
