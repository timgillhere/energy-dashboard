import { NextRequest, NextResponse } from "next/server";

const GQL = "https://api.octopus.energy/v1/graphql/";

async function getKrakenToken(apiKey: string): Promise<string> {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation { obtainKrakenToken(input: { APIKey: "${apiKey}" }) { token } }`,
    }),
  });
  const { data } = await res.json();
  return data.obtainKrakenToken.token;
}

function activeAgreement<T extends { validFrom: string; validTo: string | null; tariff?: { tariffCode?: string } }>(
  agreements: T[]
): T | null {
  const now = new Date();
  return (
    agreements.find((a) => {
      const from = new Date(a.validFrom);
      const to = a.validTo ? new Date(a.validTo) : null;
      return from <= now && (to === null || to > now);
    }) ?? agreements[0] ?? null
  );
}

function productCodeFromTariff(tariffCode: string): string {
  // E-1R-SILVER-25-09-02-J  →  SILVER-25-09-02
  return tariffCode.replace(/^[EG]-\dR-/, "").replace(/-[A-Z]$/, "");
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.OCTOPUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured on server" }, { status: 500 });
  }

  try {
    const token = await getKrakenToken(apiKey);

    const res = await fetch(GQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        query: `{
          viewer {
            accounts {
              ... on AccountType {
                properties {
                  electricityMeterPoints {
                    agreements {
                      validFrom
                      validTo
                      tariff {
                        ... on StandardTariff { tariffCode }
                        ... on HalfHourlyTariff { tariffCode }
                      }
                    }
                  }
                  gasMeterPoints {
                    agreements {
                      validFrom
                      validTo
                      tariff { tariffCode }
                    }
                  }
                }
              }
            }
          }
        }`,
      }),
    });

    const { data, errors } = await res.json();
    if (errors?.length) {
      return NextResponse.json({ error: errors[0].message }, { status: 400 });
    }

    const properties = data?.viewer?.accounts?.[0]?.properties?.[0];
    if (!properties) {
      return NextResponse.json({ error: "No account properties found" }, { status: 404 });
    }

    const elecPoint = properties.electricityMeterPoints?.[0];
    const gasPoint = properties.gasMeterPoints?.[0];

    const elecAgreement = activeAgreement(elecPoint?.agreements ?? []);
    const gasAgreement = activeAgreement(gasPoint?.agreements ?? []);

    const electricityTariffCode = elecAgreement?.tariff?.tariffCode ?? null;
    const gasTariffCode = gasAgreement?.tariff?.tariffCode ?? null;
    const productCode = electricityTariffCode ? productCodeFromTariff(electricityTariffCode) : null;

    return NextResponse.json({ electricityTariffCode, gasTariffCode, productCode });
  } catch (err) {
    return NextResponse.json({ error: "Failed to query Octopus account" }, { status: 500 });
  }
}
