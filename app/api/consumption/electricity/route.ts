import { NextRequest, NextResponse } from "next/server";

const OCTOPUS_BASE = "https://api.octopus.energy/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periodFrom = searchParams.get("period_from");
  const periodTo = searchParams.get("period_to");

  const mpan = process.env.MPAN;
  const serial = process.env.ELECTRICITY_SERIAL;
  const apiKey = process.env.OCTOPUS_API_KEY;

  if (!mpan || !serial) {
    return NextResponse.json({ error: "MPAN or ELECTRICITY_SERIAL not configured on server" }, { status: 500 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured on server" }, { status: 500 });
  }

  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");
  let nextUrl: string | null = `${OCTOPUS_BASE}/electricity-meter-points/${mpan}/meters/${serial}/consumption/?page_size=10000&order_by=period`;
  if (periodFrom) nextUrl += `&period_from=${periodFrom}`;
  if (periodTo) nextUrl += `&period_to=${periodTo}`;

  const allResults: unknown[] = [];

  try {
    while (nextUrl) {
      const res: Response = await fetch(nextUrl, {
        headers: { Authorization: auth },
        next: { revalidate: 1800 },
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Octopus API error: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      allResults.push(...(data.results ?? []));
      nextUrl = data.next ?? null;
    }
    return NextResponse.json({ results: allResults });
  } catch {
    return NextResponse.json({ error: "Failed to fetch electricity consumption" }, { status: 500 });
  }
}
