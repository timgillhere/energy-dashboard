import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_PATH = "energy-dashboard/settings.json";
const METER_FIELDS = ["mpan", "mprn", "electricitySerial", "gasSerial"] as const;

function stripMeterFields(obj: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...obj };
  for (const f of METER_FIELDS) delete copy[f];
  return copy;
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
    if (!blobs.length) return NextResponse.json({});
    const res = await fetch(blobs[0].downloadUrl, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({});
    return NextResponse.json(stripMeterFields(await res.json()));
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const body = stripMeterFields(await request.json());
    await put(BLOB_PATH, JSON.stringify(body), {
      access: "private",
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[settings POST]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
