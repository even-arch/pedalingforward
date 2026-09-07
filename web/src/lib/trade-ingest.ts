import { db } from "./db";

// UN Comtrade public preview API (no key required)
const COMTRADE_BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

const COUNTRIES: { code: string; reporterCode: number }[] = [
  { code: "DE", reporterCode: 276 },
  { code: "US", reporterCode: 842 },
  { code: "JP", reporterCode: 392 },
  { code: "NL", reporterCode: 528 },
  { code: "GB", reporterCode: 826 },
];

function periodToYYYYMM(period: string) {
  return period.replace("-", "");
}

function addMonths(yyyymm: string, n: number): string {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6));
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYYYYMM(): string {
  const now = new Date();
  // Comtrade data typically lags 2 months
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function ingestComtradeUpdates(): Promise<{
  country: string;
  fetched: number;
  saved: number;
  latestPeriod: string;
  error?: string;
}[]> {
  const results = [];
  const upTo = currentYYYYMM();

  for (const { code, reporterCode } of COUNTRIES) {
    // Find latest period in DB for this country
    const latest = await db.tradeMetric.findFirst({
      where: { reporterCode: code, source: "comtrade", hsCode: "8714" },
      orderBy: { period: "desc" },
      select: { period: true },
    });

    const startFrom = latest
      ? addMonths(periodToYYYYMM(latest.period), 1) // month after last
      : "201901";

    if (startFrom > upTo) {
      results.push({ country: code, fetched: 0, saved: 0, latestPeriod: latest?.period ?? "none" });
      continue;
    }

    // Build list of months to fetch
    const months: string[] = [];
    let cur = startFrom;
    while (cur <= upTo) {
      months.push(cur);
      cur = addMonths(cur, 1);
    }

    let fetched = 0;
    let saved = 0;
    let error: string | undefined;

    for (const period of months) {
      try {
        const url = `${COMTRADE_BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=8714`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          error = `HTTP ${res.status} for ${period}`;
          continue;
        }
        const data = await res.json();
        const records = (data.data ?? []) as {
          flowCode: string; partnerCode: number; partner2Code: number;
          primaryValue: number; netWgt: number;
        }[];

        const importTotal = records
          .filter((r) => r.flowCode === "M" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
          .reduce((sum, r) => sum + r.primaryValue, 0);

        if (importTotal > 0) {
          const periodKey = `${period.slice(0, 4)}-${period.slice(4)}`;
          await db.tradeMetric.upsert({
            where: {
              source_hsCode_reporterCode_partnerCode_flow_period: {
                source: "comtrade", hsCode: "8714", reporterCode: code,
                partnerCode: "WORLD", flow: "import", period: periodKey,
              },
            },
            update: { value: importTotal },
            create: {
              source: "comtrade", hsCode: "8714", reporterCode: code,
              partnerCode: "WORLD", flow: "import", period: periodKey,
              value: importTotal, unit: "USD",
            },
          });
          saved++;
        }
        fetched++;
        // Respect rate limit
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
    }

    const newLatest = await db.tradeMetric.findFirst({
      where: { reporterCode: code, source: "comtrade", hsCode: "8714" },
      orderBy: { period: "desc" },
      select: { period: true },
    });

    results.push({ country: code, fetched, saved, latestPeriod: newLatest?.period ?? "unknown", error });
  }

  return results;
}
