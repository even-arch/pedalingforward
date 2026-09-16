import { db } from "./db";

const BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/DS-018995";

// EU import markets NOT already covered by Comtrade (which has DE, NL, GB, US, JP).
// Adding these 6 via Eurostat avoids double-counting while expanding coverage.
const EU_REPORTERS: { code: string }[] = [
  { code: "FR" }, // France
  { code: "IT" }, // Italy
  { code: "BE" }, // Belgium
  { code: "AT" }, // Austria
  { code: "ES" }, // Spain
  { code: "PL" }, // Poland
];

// Key origin countries for bilateral breakdown (same as Comtrade bilateral list)
const BILATERAL_ORIGINS: { code: string }[] = [
  { code: "CN" },
  { code: "TW" },
  { code: "VN" },
  { code: "TH" },
  { code: "JP" },
  { code: "US" },
];

// 8714.30 doesn't exist in standard HS/EU CN — skip for Eurostat.
// 871160 = electric motorcycles/e-bikes (HS 8711.60).
const HS_CODES = ["8712", "8714", "871160"];

type EurostatJSON = {
  id?: string[];
  size?: number[];
  dimension?: Record<string, {
    category?: {
      index?: Record<string, number>;
    };
  }>;
  value?: Record<string, number> | null;
};

// Parse Eurostat SDMX-JSON format → Map<YYYY-MM, EUR value>
function parseEurostatJSON(json: EurostatJSON): Map<string, number> {
  const result = new Map<string, number>();
  if (!json.id || !json.size || !json.dimension || !json.value) return result;

  const timeDimIdx = json.id.indexOf("time");
  if (timeDimIdx === -1) return result;

  const timeIndex = json.dimension.time?.category?.index;
  if (!timeIndex) return result;

  // Reverse map: position → YYYY-MM
  const posToperiod: Record<number, string> = {};
  for (const [period, pos] of Object.entries(timeIndex)) {
    posToperiod[pos] = period;
  }

  // Stride = product of sizes of all dimensions after time
  let stride = 1;
  for (let i = timeDimIdx + 1; i < json.size.length; i++) {
    stride *= json.size[i];
  }
  const timeSize = json.size[timeDimIdx] ?? 0;

  for (const [keyStr, val] of Object.entries(json.value)) {
    if (typeof val !== "number" || isNaN(val)) continue;

    let timePos: number;
    if (keyStr.includes(":")) {
      timePos = parseInt(keyStr.split(":")[timeDimIdx]);
    } else {
      timePos = Math.floor(parseInt(keyStr) / stride) % timeSize;
    }

    const period = posToperiod[timePos];
    if (period) {
      result.set(period, (result.get(period) ?? 0) + val);
    }
  }

  return result;
}

// One API call → all months for the given combination.
// Eurostat has no daily quota, so no rate-limit handling needed.
async function fetchEurostatSeries(opts: {
  reporter: string;
  partner: string;   // "WORLD" or ISO code like "CN"
  prccode: string;   // HS code: "8712", "871160", etc.
  flow: "1" | "2";   // 1=import, 2=export
  fromPeriod: string; // YYYY-MM
}): Promise<{ data: Map<string, number>; httpStatus: number }> {
  const params = new URLSearchParams({
    format: "json",
    lang: "en",
    geo: opts.reporter,
    partner: opts.partner,
    prccode: opts.prccode,
    flow: opts.flow,
    freq: "M",
    sinceTimePeriod: opts.fromPeriod,
  });

  try {
    const res = await fetch(`${BASE}?${params}`, { cache: "no-store" });
    await new Promise((r) => setTimeout(r, 150)); // polite delay
    if (!res.ok) return { data: new Map(), httpStatus: res.status };
    const json = await res.json() as EurostatJSON;
    return { data: parseEurostatJSON(json), httpStatus: 200 };
  } catch {
    return { data: new Map(), httpStatus: 0 };
  }
}

function nextPeriod(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(y, m, 1); // JS month m=6 → July (0-indexed), so this advances by 1 month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentUpTo(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getLatestPeriod(reporterCode: string, hsCode: string, flow: string, partnerCode = "WORLD") {
  const rec = await db.tradeMetric.findFirst({
    where: { source: "eurostat", reporterCode, hsCode, flow, partnerCode },
    orderBy: { period: "desc" },
    select: { period: true },
  });
  return rec?.period ?? null;
}

async function upsertMetric(args: {
  hsCode: string; reporterCode: string; partnerCode: string;
  flow: string; period: string; value: number;
}) {
  const { value, ...keyFields } = args;
  await db.tradeMetric.upsert({
    where: {
      source_hsCode_reporterCode_partnerCode_flow_period: {
        source: "eurostat", ...keyFields,
      },
    },
    update: { value },
    create: { source: "eurostat", ...keyFields, value, unit: "EUR" },
  });
}

export type EurostatIngestResult = {
  task: string; saved: number; error?: string;
};

export type EurostatIngestOptions = {
  triggeredBy?: "cron" | "manual";
  fromPeriod?: string; // YYYYMM override (e.g. "201901")
  hsCodes?: string[];
  skipBilateral?: boolean;
};

export async function ingestEurostatUpdates(opts: EurostatIngestOptions = {}): Promise<EurostatIngestResult[]> {
  const hsCodesToRun = opts.hsCodes
    ? HS_CODES.filter((c) => opts.hsCodes!.includes(c))
    : HS_CODES;

  const run = await db.tradeIngestRun.create({
    data: { triggeredBy: `eurostat-${opts.triggeredBy ?? "manual"}`, status: "running" },
  });

  const results: EurostatIngestResult[] = [];
  const upTo = currentUpTo();
  const defaultFrom = opts.fromPeriod
    ? `${opts.fromPeriod.slice(0, 4)}-${opts.fromPeriod.slice(4, 6)}`
    : "2019-01";

  let totalSaved = 0;
  let totalErrors = 0;

  // ── 1. EU import market totals (WORLD partner) ───────────────────────────
  for (const { code } of EU_REPORTERS) {
    for (const hsCode of hsCodesToRun) {
      const latest = await getLatestPeriod(code, hsCode, "import");
      const fromPeriod = latest ? nextPeriod(latest) : defaultFrom;
      if (fromPeriod > upTo) continue;

      const { data, httpStatus } = await fetchEurostatSeries({
        reporter: code, partner: "WORLD", prccode: hsCode, flow: "1", fromPeriod,
      });

      if (httpStatus !== 200) {
        results.push({ task: `${code} ${hsCode} import WORLD`, saved: 0, error: `HTTP ${httpStatus}` });
        totalErrors++;
        continue;
      }

      let saved = 0;
      for (const [period, value] of data) {
        if (period < fromPeriod || period > upTo) continue;
        await upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "import", period, value });
        saved++;
      }
      totalSaved += saved;
      results.push({ task: `${code} ${hsCode} import WORLD`, saved });
    }
  }

  // ── 2. Bilateral: EU importing FROM key origins ───────────────────────────
  if (!opts.skipBilateral) {
    for (const { code: reporterCode } of EU_REPORTERS) {
      for (const { code: originCode } of BILATERAL_ORIGINS) {
        for (const hsCode of hsCodesToRun) {
          const dbPartnerCode = `PARTNER_${originCode}`;
          const latest = await getLatestPeriod(reporterCode, hsCode, "import", dbPartnerCode);
          const fromPeriod = latest ? nextPeriod(latest) : defaultFrom;
          if (fromPeriod > upTo) continue;

          const { data, httpStatus } = await fetchEurostatSeries({
            reporter: reporterCode, partner: originCode, prccode: hsCode, flow: "1", fromPeriod,
          });

          if (httpStatus !== 200 && httpStatus !== 404) {
            // 404 = no data for this combination (normal for rare trade flows)
            results.push({ task: `${reporterCode}←${originCode} ${hsCode}`, saved: 0, error: `HTTP ${httpStatus}` });
            totalErrors++;
            continue;
          }

          let saved = 0;
          for (const [period, value] of data) {
            if (period < fromPeriod || period > upTo) continue;
            await upsertMetric({ hsCode, reporterCode, partnerCode: dbPartnerCode, flow: "import", period, value });
            saved++;
          }
          totalSaved += saved;
          if (saved > 0) {
            results.push({ task: `${reporterCode}←${originCode} ${hsCode}`, saved });
          }
        }
      }
    }
  }

  const totalErrorsFinal = results.filter((r) => r.error).length;
  await db.tradeIngestRun.update({
    where: { id: run.id },
    data: {
      status: "done",
      finishedAt: new Date(),
      totalSaved,
      totalErrors: totalErrorsFinal,
      results: results as object[],
    },
  });

  return results;
}
