import { db } from "./db";

// US Census Bureau International Trade API
// Free, no API key, no daily quota.
// Docs: https://www.census.gov/data/developers/data-sets/international-trade.html
const IMPORTS_BASE = "https://api.census.gov/data/timeseries/intltrade/imports";
const EXPORTS_BASE = "https://api.census.gov/data/timeseries/intltrade/exports";

// US Census country codes (CTY_CODE) for key bilateral partners
const US_PARTNERS: { code: string; ctyCd: string }[] = [
  { code: "CN", ctyCd: "5700" }, // China
  { code: "TW", ctyCd: "5830" }, // Taiwan
  { code: "VN", ctyCd: "5880" }, // Vietnam
  { code: "TH", ctyCd: "5490" }, // Thailand
  { code: "JP", ctyCd: "5880" }, // Japan — TODO: verify exact code
  { code: "DE", ctyCd: "4280" }, // Germany
  { code: "IT", ctyCd: "4750" }, // Italy
];

// HS codes — US Census uses HS4/HS6/HS10 via COMM_LVL parameter
// 871430 skipped (non-standard HS code); 8714 covers all bicycle parts
const HS_CODES = ["8712", "8714", "871160"];

type CensusRow = string[]; // [field1, field2, ...]

async function fetchCensusMonth(opts: {
  base: string;
  cmdCode: string;   // e.g. "8712"
  commLvl: string;   // "HS4", "HS6"
  yyyyMM: string;    // "2024-01"
  ctyCd?: string;    // omit for world total
}): Promise<number> {
  const valueField = opts.base === IMPORTS_BASE ? "GEN_VAL_MO" : "ALL_VAL_MO";
  const fields = [valueField, "CTY_CODE"];
  const params = new URLSearchParams({
    get: fields.join(","),
    COMM_LVL: opts.commLvl,
    cmdCode: opts.cmdCode,
    time: opts.yyyyMM,
  });
  if (opts.ctyCd) params.set("CTY_CODE", opts.ctyCd);

  try {
    const res = await fetch(`${opts.base}?${params}`, { cache: "no-store" });
    await new Promise((r) => setTimeout(r, 100));
    if (!res.ok) return -1;

    const rows = await res.json() as CensusRow[];
    // rows[0] = header, rows[1..] = data
    const header = rows[0];
    const valIdx = header.indexOf(valueField);
    if (valIdx === -1 || rows.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < rows.length; i++) {
      const val = parseFloat(rows[i][valIdx]);
      if (!isNaN(val)) total += val;
    }
    return total;
  } catch {
    return -1;
  }
}

function addMonths(yyyymm: string, n: number): string {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6));
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYYYYMM(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getLatestPeriod(hsCode: string, flow: string, partnerCode = "WORLD") {
  const rec = await db.tradeMetric.findFirst({
    where: { source: "uscensus", reporterCode: "US", hsCode, flow, partnerCode },
    orderBy: { period: "desc" },
    select: { period: true },
  });
  return rec?.period ?? null;
}

async function upsertMetric(args: {
  hsCode: string; partnerCode: string; flow: string; period: string; value: number;
}) {
  const { value, ...keyFields } = args;
  await db.tradeMetric.upsert({
    where: {
      source_hsCode_reporterCode_partnerCode_flow_period: {
        source: "uscensus", reporterCode: "US", ...keyFields,
      },
    },
    update: { value },
    create: { source: "uscensus", reporterCode: "US", ...keyFields, value, unit: "USD" },
  });
}

export type UsCensusIngestOptions = {
  triggeredBy?: "cron" | "manual";
  fromPeriod?: string; // YYYYMM e.g. "201901"
  hsCodes?: string[];
  maxCalls?: number;
};

export async function ingestUsCensusUpdates(opts: UsCensusIngestOptions = {}): Promise<{ saved: number; errors: number }> {
  const hsCodesToRun = opts.hsCodes
    ? HS_CODES.filter((c) => opts.hsCodes!.includes(c))
    : HS_CODES;

  const run = await db.tradeIngestRun.create({
    data: { triggeredBy: `uscensus-${opts.triggeredBy ?? "manual"}`, status: "running" },
  });

  const maxCalls = opts.maxCalls ?? 200;
  const upTo = currentYYYYMM();
  const startFrom = opts.fromPeriod ?? "201901";

  let totalSaved = 0;
  let totalErrors = 0;
  let callCount = 0;

  // commLvl mapping: 4-digit → HS4, 6-digit → HS6
  function commLvl(hsCode: string): string {
    return hsCode.length <= 4 ? "HS4" : "HS6";
  }

  // ── 1. US world totals: imports + exports ────────────────────────────────
  for (const flow of ["import", "export"] as const) {
    const base = flow === "import" ? IMPORTS_BASE : EXPORTS_BASE;
    const flowLabel = flow === "import" ? "import" : "export";

    for (const hsCode of hsCodesToRun) {
      const latest = await getLatestPeriod(hsCode, flowLabel);
      let cur = latest
        ? addMonths(latest.replace("-", ""), 1)
        : startFrom;

      while (cur <= upTo && callCount < maxCalls) {
        const yyyyMM = `${cur.slice(0, 4)}-${cur.slice(4, 6)}`;
        const value = await fetchCensusMonth({
          base, cmdCode: hsCode, commLvl: commLvl(hsCode), yyyyMM,
        });
        callCount++;

        if (value >= 0) {
          const dbPeriod = yyyyMM;
          await upsertMetric({ hsCode, partnerCode: "WORLD", flow: flowLabel, period: dbPeriod, value });
          totalSaved++;
        } else {
          totalErrors++;
        }
        cur = addMonths(cur, 1);
      }
    }
  }

  // ── 2. US bilateral imports (by origin country) ───────────────────────────
  for (const { code: originCode, ctyCd } of US_PARTNERS) {
    for (const hsCode of hsCodesToRun) {
      if (callCount >= maxCalls) break;

      const dbPartnerCode = `PARTNER_${originCode}`;
      const latest = await getLatestPeriod(hsCode, "import", dbPartnerCode);
      let cur = latest
        ? addMonths(latest.replace("-", ""), 1)
        : startFrom;

      while (cur <= upTo && callCount < maxCalls) {
        const yyyyMM = `${cur.slice(0, 4)}-${cur.slice(4, 6)}`;
        const value = await fetchCensusMonth({
          base: IMPORTS_BASE, cmdCode: hsCode, commLvl: commLvl(hsCode), yyyyMM, ctyCd,
        });
        callCount++;

        if (value >= 0) {
          await upsertMetric({ hsCode, partnerCode: dbPartnerCode, flow: "import", period: yyyyMM, value });
          totalSaved++;
        } else {
          totalErrors++;
        }
        cur = addMonths(cur, 1);
      }
    }
  }

  await db.tradeIngestRun.update({
    where: { id: run.id },
    data: { status: "done", finishedAt: new Date(), totalSaved, totalErrors, callsUsed: callCount },
  });

  return { saved: totalSaved, errors: totalErrors };
}
