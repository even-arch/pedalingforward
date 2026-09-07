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

const BILATERAL_PARTNERS: { code: string; partnerCode: number }[] = [
  { code: "TW", partnerCode: 490 },
  { code: "CN", partnerCode: 156 },
  { code: "IT", partnerCode: 380 },
  { code: "VN", partnerCode: 704 },
  { code: "PL", partnerCode: 616 },
  { code: "JP", partnerCode: 392 },
];

// 871430 = electrically-assisted cycle parts (e-bike sub-code of 8714)
const HS_CODES = ["8714", "8712", "871430"];

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
  await new Promise((r) => setTimeout(r, 450));
  if (!res.ok) return { ok: false, status: res.status, data: [] };
  const json = await res.json() as { data?: unknown[] };
  return { ok: true, data: json.data ?? [] };
}

type ComtradeRow = { flowCode: string; partnerCode: number; partner2Code: number; primaryValue: number };

export type IngestResult = {
  task: string; saved: number; latestPeriod?: string; error?: string;
};

export async function ingestComtradeUpdates(): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  const upTo = currentYYYYMM();

  // ── 1. Import markets (HS8714 + HS8712) ──────────────────────────────────
  for (const { code, reporterCode } of IMPORT_MARKETS) {
    for (const hsCode of HS_CODES) {
      const latest = await getLatestPeriod(code, hsCode, "import");
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
      if (startFrom > upTo) continue;

      const months: string[] = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      let error: string | undefined;
      for (const period of months) {
        const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchComtrade(url);
        if (!ok) { error = `HTTP ${status} @ ${period}`; continue; }

        const total = (data as ComtradeRow[])
          .filter((r) => r.flowCode === "M" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

        if (total > 0) {
          await upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "import", period: `${period.slice(0, 4)}-${period.slice(4)}`, value: total });
          saved++;
        }
      }
      const newLatest = await getLatestPeriod(code, hsCode, "import");
      results.push({ task: `${code} ${hsCode} import`, saved, latestPeriod: newLatest ?? undefined, error });
    }
  }

  // ── 2. Export totals (major exporters) ───────────────────────────────────
  for (const { code, reporterCode } of EXPORT_ORIGINS) {
    for (const hsCode of HS_CODES) {
      const latest = await getLatestPeriod(code, hsCode, "export");
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
      if (startFrom > upTo) continue;

      const months: string[] = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      let error: string | undefined;
      for (const period of months) {
        const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchComtrade(url);
        if (!ok) { error = `HTTP ${status} @ ${period}`; continue; }

        const total = (data as ComtradeRow[])
          .filter((r) => r.flowCode === "X" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

        if (total > 0) {
          await upsertMetric({ hsCode, reporterCode: code, partnerCode: "WORLD", flow: "export", period: `${period.slice(0, 4)}-${period.slice(4)}`, value: total });
          saved++;
        }
      }
      results.push({ task: `${code} ${hsCode} export`, saved, error });
    }
  }

  // ── 3. Bilateral breakdown for all import markets ─────────────────────────
  for (const { code: marketCode, reporterCode: marketReporter } of IMPORT_MARKETS) {
    for (const { code: partCode, partnerCode } of BILATERAL_PARTNERS) {
      if (marketCode === partCode) continue; // skip self-reference (e.g. JP←JP)
      for (const hsCode of HS_CODES) {
        const dbPartnerCode = `PARTNER_${partCode}`;
        const latest = await getLatestPeriod(marketCode, hsCode, "import", dbPartnerCode);
        const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
        if (startFrom > upTo) continue;

        const months: string[] = [];
        let cur = startFrom;
        while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

        let saved = 0;
        let error: string | undefined;
        for (const period of months) {
          const url = `${BASE}?reporterCode=${marketReporter}&partnerCode=${partnerCode}&period=${period}&cmdCode=${hsCode}`;
          const { ok, status, data } = await fetchComtrade(url);
          if (!ok) { error = `HTTP ${status} @ ${period}`; continue; }

          const total = (data as ComtradeRow[])
            .filter((r) => r.flowCode === "M" && r.primaryValue > 0)
            .reduce((s, r) => s + r.primaryValue, 0);

          if (total > 0) {
            await upsertMetric({ hsCode, reporterCode: marketCode, partnerCode: dbPartnerCode, flow: "import", period: `${period.slice(0, 4)}-${period.slice(4)}`, value: total });
            saved++;
          }
        }
        results.push({ task: `${marketCode}←${partCode} ${hsCode}`, saved, error });
      }
    }
  }

  return results;
}
