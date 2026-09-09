import { db } from "./db";

const BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

const IMPORT_MARKETS: { code: string; reporterCode: number }[] = [
  { code: "DE", reporterCode: 276 },
  { code: "US", reporterCode: 842 },
  { code: "JP", reporterCode: 392 },
  { code: "NL", reporterCode: 528 },
  { code: "GB", reporterCode: 826 },
];

const EXPORT_ORIGINS: { code: string; reporterCode: number }[] = [
  { code: "CN", reporterCode: 156 },
  { code: "IT", reporterCode: 380 },
  { code: "JP", reporterCode: 392 },
  { code: "VN", reporterCode: 704 },
  { code: "PL", reporterCode: 616 },
];

// Map UN M49 numeric codes → ISO 3166-1 alpha-2 for bicycle-relevant trade partners.
// Comtrade uses M49 codes which mostly match ISO numeric (exceptions: FR=251 not 250, TW=490).
const UN_TO_ISO2: Record<number, string> = {
  36: "AU",  40: "AT",  50: "BD",  56: "BE",  76: "BR", 100: "BG",
  116: "KH", 124: "CA", 156: "CN", 191: "HR", 203: "CZ", 208: "DK",
  246: "FI", 251: "FR", 276: "DE", 344: "HK", 348: "HU", 356: "IN",
  360: "ID", 380: "IT", 392: "JP", 410: "KR", 442: "LU", 458: "MY",
  484: "MX", 490: "TW", 528: "NL", 578: "NO", 608: "PH", 616: "PL",
  620: "PT", 642: "RO", 688: "RS", 703: "SK", 705: "SI", 710: "ZA",
  724: "ES", 752: "SE", 756: "CH", 757: "CH", 764: "TH", 792: "TR",
  826: "GB", 840: "US", 842: "US", 704: "VN",
};

// 871430 = e-bike parts (sub-code of 8714); 871160 = complete e-bikes with electric motor
const HS_CODES = ["8714", "8712", "871430", "871160"];

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

// Returns the latest period where comprehensive all-partner bilateral data was saved
async function getLatestBilateralPeriod(reporterCode: string, hsCode: string): Promise<string | null> {
  const rec = await db.tradeMetric.findFirst({
    where: { reporterCode, hsCode, flow: "import", partnerCode: "_ALL_" },
    orderBy: { period: "desc" },
    select: { period: true },
  });
  return rec?.period ?? null;
}

async function getLatestPeriod(reporterCode: string, hsCode: string, flow: string, partnerCode = "WORLD") {
  const rec = await db.tradeMetric.findFirst({
    where: { reporterCode, hsCode, flow, partnerCode },
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
        source: "comtrade", ...keyFields,
      },
    },
    update: { value },
    create: { source: "comtrade", ...keyFields, value, unit: "USD" },
  });
}

async function fetchComtrade(url: string): Promise<{ ok: boolean; status?: number; data: unknown[] }> {
  const res = await fetch(url, { cache: "no-store" });
  await new Promise((r) => setTimeout(r, 200));
  if (!res.ok) return { ok: false, status: res.status, data: [] };
  const json = await res.json() as { data?: unknown[] };
  return { ok: true, data: json.data ?? [] };
}

type ComtradeRow = { flowCode: string; partnerCode: number; partner2Code: number; primaryValue: number };

export type IngestResult = {
  task: string; saved: number; latestPeriod?: string; error?: string; limitReached?: boolean;
};

async function updateProgress(runId: string, callCount: number, totalSaved: number) {
  try {
    await db.tradeIngestRun.update({
      where: { id: runId },
      data: { callsUsed: callCount, totalSaved },
    });
  } catch { /* ignore — column may not exist yet */ }
}

export async function ingestComtradeUpdates(triggeredBy: "cron" | "manual" = "manual", maxCalls = 50): Promise<IngestResult[]> {
  const run = await db.tradeIngestRun.create({
    data: { triggeredBy, status: "running" },
  });

  const results: IngestResult[] = [];
  const upTo = currentYYYYMM();
  let callCount = 0;
  let limitReached = false;
  let lastProgressUpdate = 0;

  // ── 1. Import markets (HS8714 + HS8712) ──────────────────────────────────
  outer1: for (const { code, reporterCode } of IMPORT_MARKETS) {
    for (const hsCode of HS_CODES) {
      if (callCount >= maxCalls) { limitReached = true; break outer1; }

      const latest = await getLatestPeriod(code, hsCode, "import");
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
      if (startFrom > upTo) continue;

      const months: string[] = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      let error: string | undefined;
      let taskLimitReached = false;
      for (const period of months) {
        if (callCount >= maxCalls) { taskLimitReached = true; limitReached = true; break; }
        const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchComtrade(url);
        callCount++;
        if (callCount - lastProgressUpdate >= 30) {
          lastProgressUpdate = callCount;
          await updateProgress(run.id, callCount, results.reduce((s, r) => s + r.saved, 0) + saved);
        }
        if (!ok) { error = `HTTP ${status} @ ${period}`; continue; }

        const total = (data as ComtradeRow[])
          .filter((r) => r.flowCode === "M" && r.partnerCode === 0 && (!r.partner2Code || r.partner2Code === 0) && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

        if (total > 0) {
          await upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "import", period: `${period.slice(0, 4)}-${period.slice(4)}`, value: total });
          saved++;
        }
      }
      const newLatest = await getLatestPeriod(code, hsCode, "import");
      results.push({ task: `${code} ${hsCode} import`, saved, latestPeriod: newLatest ?? undefined, error, ...(taskLimitReached && { limitReached: true }) });
      if (limitReached) break outer1;
    }
  }

  // ── 2. Export totals (major exporters) ───────────────────────────────────
  if (!limitReached) {
  outer2: for (const { code, reporterCode } of EXPORT_ORIGINS) {
    for (const hsCode of HS_CODES) {
      if (callCount >= maxCalls) { limitReached = true; break outer2; }

      const latest = await getLatestPeriod(code, hsCode, "export");
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
      if (startFrom > upTo) continue;

      const months: string[] = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      let error: string | undefined;
      let taskLimitReached = false;
      for (const period of months) {
        if (callCount >= maxCalls) { taskLimitReached = true; limitReached = true; break; }
        const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchComtrade(url);
        callCount++;
        if (callCount - lastProgressUpdate >= 30) {
          lastProgressUpdate = callCount;
          await updateProgress(run.id, callCount, results.reduce((s, r) => s + r.saved, 0) + saved);
        }
        if (!ok) { error = `HTTP ${status} @ ${period}`; continue; }

        const total = (data as ComtradeRow[])
          .filter((r) => r.flowCode === "X" && r.partnerCode === 0 && (!r.partner2Code || r.partner2Code === 0) && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

        if (total > 0) {
          await upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "export", period: `${period.slice(0, 4)}-${period.slice(4)}`, value: total });
          saved++;
        }
      }
      results.push({ task: `${code} ${hsCode} export`, saved, error, ...(taskLimitReached && { limitReached: true }) });
      if (limitReached) break outer2;
    }
  }
  }

  // ── 3. Comprehensive bilateral breakdown (all partners, one call per market+hs+period) ────────
  // Each call returns ALL origin countries. Filter: flowCode=M, partner2Code==partnerCode (direct trade).
  // Progress tracked via special partnerCode="_ALL_" marker — if that marker exists for a period, skip it.
  if (!limitReached) {
  outer3: for (const { code: marketCode, reporterCode: marketReporter } of IMPORT_MARKETS) {
    for (const hsCode of HS_CODES) {
      if (callCount >= maxCalls) { limitReached = true; break outer3; }

      const latest = await getLatestBilateralPeriod(marketCode, hsCode);
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
      if (startFrom > upTo) continue;

      const months: string[] = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      let error: string | undefined;
      let taskLimitReached = false;
      for (const period of months) {
        if (callCount >= maxCalls) { taskLimitReached = true; limitReached = true; break; }
        // No partnerCode param → API returns all individual partner rows
        const url = `${BASE}?reporterCode=${marketReporter}&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchComtrade(url);
        callCount++;
        if (callCount - lastProgressUpdate >= 30) {
          lastProgressUpdate = callCount;
          await updateProgress(run.id, callCount, results.reduce((s, r) => s + r.saved, 0) + saved);
        }
        if (!ok) { error = `HTTP ${status} @ ${period}`; continue; }

        // Group by partnerCode, sum values where partner2Code === partnerCode (direct trade, avoids double-counting)
        const byPartner: Record<number, number> = {};
        for (const r of data as ComtradeRow[]) {
          if (r.flowCode === "M" && r.partnerCode !== 0 && r.partner2Code === r.partnerCode && r.primaryValue > 0) {
            byPartner[r.partnerCode] = (byPartner[r.partnerCode] ?? 0) + r.primaryValue;
          }
        }

        const formattedPeriod = `${period.slice(0, 4)}-${period.slice(4)}`;
        let partnersSaved = 0;
        for (const [numCode, value] of Object.entries(byPartner)) {
          if (value < 100) continue; // skip negligible (<$100)
          const isoCode = UN_TO_ISO2[Number(numCode)];
          if (!isoCode) continue;
          if (isoCode === marketCode) continue; // skip self-import
          await upsertMetric({
            hsCode, reporterCode: marketCode,
            partnerCode: `PARTNER_${isoCode}`,
            flow: "import", period: formattedPeriod, value,
          });
          partnersSaved++;
        }

        if (partnersSaved > 0) {
          // Mark this period as comprehensively covered
          await upsertMetric({
            hsCode, reporterCode: marketCode, partnerCode: "_ALL_",
            flow: "import", period: formattedPeriod, value: partnersSaved,
          });
          saved += partnersSaved;
        }
      }
      results.push({ task: `${marketCode} bilateral ${hsCode}`, saved, error, ...(taskLimitReached && { limitReached: true }) });
      if (limitReached) break outer3;
    }
  }
  }

  const totalSaved = results.reduce((s, r) => s + r.saved, 0);
  const totalErrors = results.filter((r) => r.error).length;

  // callsUsed is saved separately to avoid failing if the column isn't in the DB yet
  try {
    await db.tradeIngestRun.update({
      where: { id: run.id },
      data: {
        status: "done",
        finishedAt: new Date(),
        totalSaved,
        totalErrors,
        callsUsed: callCount,
        results: results as object[],
      },
    });
  } catch {
    // Fallback without callsUsed if the column doesn't exist yet
    await db.tradeIngestRun.update({
      where: { id: run.id },
      data: {
        status: "done",
        finishedAt: new Date(),
        totalSaved,
        totalErrors,
        results: results as object[],
      },
    });
  }

  return results;
}
