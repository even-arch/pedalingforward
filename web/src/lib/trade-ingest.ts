import { db } from "./db";

const BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

// Comtrade public preview API does NOT support comma-separated periods —
// each call must query exactly one month. Keep at 1.
const BATCH_MONTHS = 1;

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

// Bilateral partner countries to track for each import market.
const BILATERAL_PARTNERS: { code: string; partnerCode: number }[] = [
  { code: "TW", partnerCode: 490 },
  { code: "CN", partnerCode: 156 },
  { code: "IT", partnerCode: 380 },
  { code: "VN", partnerCode: 704 },
  { code: "PL", partnerCode: 616 },
  { code: "JP", partnerCode: 392 },
  { code: "CZ", partnerCode: 203 },
  { code: "TH", partnerCode: 764 },
  { code: "PT", partnerCode: 620 },
  { code: "FR", partnerCode: 251 },
  { code: "BE", partnerCode: 56  },
  { code: "AT", partnerCode: 40  },
  { code: "GB", partnerCode: 826 },
  { code: "KR", partnerCode: 410 },
  { code: "MY", partnerCode: 458 },
];

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

// Returns the latest ATTEMPTED period (value may be 0) — not just periods with data.
// This prevents re-querying months that returned no trade data.
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

// Fetches one API call (may cover multiple months via comma-separated period).
async function fetchComtrade(url: string): Promise<{ ok: boolean; status?: number; data: unknown[] }> {
  const res = await fetch(url, { cache: "no-store" });
  await new Promise((r) => setTimeout(r, 200));
  if (!res.ok) return { ok: false, status: res.status, data: [] };
  const json = await res.json() as { data?: unknown[] };
  return { ok: true, data: json.data ?? [] };
}

type ComtradeRow = {
  flowCode: string;
  partnerCode: number;
  partner2Code: number;
  primaryValue: number;
  period: number; // e.g. 202301
};

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

// Process a batch of months for a given reporter+partner+flow+hsCode combination.
// Returns { saved, error } where saved = count of periods written (including 0-value periods).
async function processBatches(opts: {
  months: string[];
  url: (batch: string[]) => string;
  filterRow: (r: ComtradeRow) => boolean;
  saveMetric: (period: string, value: number) => Promise<void>;
  maxCalls: number;
  callCountRef: { v: number };
  limitReachedRef: { v: boolean };
}): Promise<{ saved: number; error?: string; limitReached: boolean }> {
  const { months, url, filterRow, saveMetric, maxCalls, callCountRef, limitReachedRef } = opts;
  let saved = 0;
  let error: string | undefined;
  let limitReached = false;

  for (let i = 0; i < months.length; i += BATCH_MONTHS) {
    if (callCountRef.v >= maxCalls) { limitReached = true; limitReachedRef.v = true; break; }

    const batch = months.slice(i, i + BATCH_MONTHS);
    const { ok, status, data } = await fetchComtrade(url(batch));
    callCountRef.v++;

    if (!ok) {
      error = `HTTP ${status} @ ${batch[0]}${batch.length > 1 ? `–${batch[batch.length - 1]}` : ""}`;
      continue;
    }

    // Group values by period from the batch response.
    // Initialize all batch months to 0 so that months with no data also get saved,
    // preventing them from being re-queried on the next run.
    const byPeriod = new Map<string, number>();
    for (const m of batch) byPeriod.set(m, 0);

    for (const r of data as ComtradeRow[]) {
      if (filterRow(r) && r.primaryValue > 0) {
        const p = String(r.period);
        byPeriod.set(p, (byPeriod.get(p) ?? 0) + r.primaryValue);
      }
    }

    for (const [period, value] of byPeriod) {
      const dbPeriod = `${period.slice(0, 4)}-${period.slice(4)}`;
      await saveMetric(dbPeriod, value);
      saved++;
    }
  }

  return { saved, error, limitReached };
}

export type IngestOptions = {
  triggeredBy?: "cron" | "manual";
  maxCalls?: number;
  /** Skip bilateral section (section 3) — use for fast historical backfill of totals */
  skipBilateral?: boolean;
  /** Restrict to these HS codes only (default: all) */
  hsCodes?: string[];
  /** Override start period for all tasks (YYYYMM, e.g. "201901") */
  fromPeriod?: string;
};

export async function ingestComtradeUpdates(
  triggeredByOrOpts: "cron" | "manual" | IngestOptions = "manual",
  maxCallsLegacy = 50,
): Promise<IngestResult[]> {
  // Support both old call signature (string, number) and new options object
  const opts: IngestOptions = typeof triggeredByOrOpts === "string"
    ? { triggeredBy: triggeredByOrOpts, maxCalls: maxCallsLegacy }
    : triggeredByOrOpts;

  const triggeredBy = opts.triggeredBy ?? "manual";
  const maxCalls = opts.maxCalls ?? maxCallsLegacy;
  const skipBilateral = opts.skipBilateral ?? false;
  const hsCodesToRun = opts.hsCodes ? HS_CODES.filter(c => opts.hsCodes!.includes(c)) : HS_CODES;

  const run = await db.tradeIngestRun.create({
    data: { triggeredBy, status: "running" },
  });

  const results: IngestResult[] = [];
  const upTo = currentYYYYMM();
  const callCountRef = { v: 0 };
  const limitReachedRef = { v: false };
  let lastProgressUpdate = 0;

  function maybeUpdateProgress() {
    if (callCountRef.v - lastProgressUpdate >= 30) {
      lastProgressUpdate = callCountRef.v;
      updateProgress(run.id, callCountRef.v, results.reduce((s, r) => s + r.saved, 0));
    }
  }

  // ── 1. Import markets (WORLD totals) ─────────────────────────────────────
  outer1: for (const { code, reporterCode } of IMPORT_MARKETS) {
    for (const hsCode of hsCodesToRun) {
      if (limitReachedRef.v) break outer1;

      const latest = await getLatestPeriod(code, hsCode, "import");
      const startFrom = opts.fromPeriod ?? (latest ? addMonths(latest.replace("-", ""), 1) : "201901");
      if (startFrom > upTo) continue;

      const months: string[] = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      const { saved, error, limitReached } = await processBatches({
        months,
        url: (batch) => `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${batch.join(",")}&cmdCode=${hsCode}`,
        filterRow: (r) => r.flowCode === "M" && r.partnerCode === 0 && (!r.partner2Code || r.partner2Code === 0),
        saveMetric: (period, value) => upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "import", period, value }),
        maxCalls, callCountRef, limitReachedRef,
      });

      maybeUpdateProgress();
      const newLatest = await getLatestPeriod(code, hsCode, "import");
      results.push({ task: `${code} ${hsCode} import`, saved, latestPeriod: newLatest ?? undefined, error, ...(limitReached && { limitReached: true }) });
    }
  }

  // ── 2. Export totals (major exporters) ───────────────────────────────────
  if (!limitReachedRef.v) {
    outer2: for (const { code, reporterCode } of EXPORT_ORIGINS) {
      for (const hsCode of hsCodesToRun) {
        if (limitReachedRef.v) break outer2;

        const latest = await getLatestPeriod(code, hsCode, "export");
        const startFrom = opts.fromPeriod ?? (latest ? addMonths(latest.replace("-", ""), 1) : "201901");
        if (startFrom > upTo) continue;

        const months: string[] = [];
        let cur = startFrom;
        while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

        const { saved, error, limitReached } = await processBatches({
          months,
          url: (batch) => `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${batch.join(",")}&cmdCode=${hsCode}`,
          filterRow: (r) => r.flowCode === "X" && r.partnerCode === 0 && (!r.partner2Code || r.partner2Code === 0),
          saveMetric: (period, value) => upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "export", period, value }),
          maxCalls, callCountRef, limitReachedRef,
        });

        maybeUpdateProgress();
        results.push({ task: `${code} ${hsCode} export`, saved, error, ...(limitReached && { limitReached: true }) });
      }
    }
  }

  // ── 3. Bilateral import breakdown ────────────────────────────────────────
  if (!limitReachedRef.v && !skipBilateral) {
    outer3: for (const { code: marketCode, reporterCode: marketReporter } of IMPORT_MARKETS) {
      for (const { code: partnerISO, partnerCode } of BILATERAL_PARTNERS) {
        if (partnerISO === marketCode) continue;
        for (const hsCode of hsCodesToRun) {
          if (limitReachedRef.v) break outer3;

          const dbPartnerCode = `PARTNER_${partnerISO}`;
          const latest = await getLatestPeriod(marketCode, hsCode, "import", dbPartnerCode);
          const startFrom = opts.fromPeriod ?? (latest ? addMonths(latest.replace("-", ""), 1) : "201901");
          if (startFrom > upTo) continue;

          const months: string[] = [];
          let cur = startFrom;
          while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

          const { saved, error, limitReached } = await processBatches({
            months,
            url: (batch) => `${BASE}?reporterCode=${marketReporter}&partnerCode=${partnerCode}&period=${batch.join(",")}&cmdCode=${hsCode}`,
            filterRow: (r) => r.flowCode === "M",
            saveMetric: (period, value) => upsertMetric({ hsCode, reporterCode: marketCode, partnerCode: dbPartnerCode, flow: "import", period, value }),
            maxCalls, callCountRef, limitReachedRef,
          });

          maybeUpdateProgress();
          results.push({ task: `${marketCode}←${partnerISO} ${hsCode}`, saved, error, ...(limitReached && { limitReached: true }) });
        }
      }
    }
  }

  const totalSaved = results.reduce((s, r) => s + r.saved, 0);
  const totalErrors = results.filter((r) => r.error).length;

  try {
    await db.tradeIngestRun.update({
      where: { id: run.id },
      data: { status: "done", finishedAt: new Date(), totalSaved, totalErrors, callsUsed: callCountRef.v, results: results as object[] },
    });
  } catch {
    await db.tradeIngestRun.update({
      where: { id: run.id },
      data: { status: "done", finishedAt: new Date(), totalSaved, totalErrors, results: results as object[] },
    });
  }

  return results;
}
