/**
 * Historical catch-up: bilateral import data for US, JP, NL, GB (+ 871430)
 * Run AFTER ingest-trade-extended.mjs finishes (which handles DE + HS8712)
 *
 * Usage: cd web && export $(grep -v '^#' .env.local | xargs) && node scripts/ingest-bilateral-all-markets.mjs
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

// All 5 import markets (DE bilateral is already done by previous script)
const IMPORT_MARKETS = [
  { code: "DE", reporterCode: 276 },
  { code: "US", reporterCode: 842 },
  { code: "JP", reporterCode: 392 },
  { code: "NL", reporterCode: 528 },
  { code: "GB", reporterCode: 826 },
];

// Top partner countries for bilateral breakdown
const BILATERAL_PARTNERS = [
  { code: "TW", partnerCode: 490 },
  { code: "CN", partnerCode: 156 },
  { code: "IT", partnerCode: 380 },
  { code: "VN", partnerCode: 704 },
  { code: "PL", partnerCode: 616 },
  { code: "JP", partnerCode: 392 },
];

// 871430 = e-bike parts; 871160 = complete e-bikes with electric motor
const HS_CODES = ["8714", "8712", "871430", "871160"];

function addMonths(yyyymm, n) {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6));
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYYYYMM() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getLatestPeriod(reporterCode, hsCode, flow, partnerCode) {
  const rec = await db.tradeMetric.findFirst({
    where: { reporterCode, hsCode, flow, partnerCode },
    orderBy: { period: "desc" },
    select: { period: true },
  });
  return rec?.period ?? null;
}

async function upsertMetric({ hsCode, reporterCode, partnerCode, flow, period, value }) {
  await db.tradeMetric.upsert({
    where: { source_hsCode_reporterCode_partnerCode_flow_period: { source: "comtrade", hsCode, reporterCode, partnerCode, flow, period } },
    update: { value },
    create: { source: "comtrade", hsCode, reporterCode, partnerCode, flow, period, value, unit: "USD" },
  });
}

async function fetchAndWait(url, delay = 500) {
  const res = await fetch(url, { cache: "no-store" });
  await new Promise(r => setTimeout(r, delay));
  if (!res.ok) return { ok: false, status: res.status, data: [] };
  const json = await res.json();
  return { ok: true, data: json.data ?? [] };
}

async function main() {
  const upTo = currentYYYYMM();
  console.log(`Target: up to ${upTo}\n`);

  for (const { code: marketCode, reporterCode: marketReporter } of IMPORT_MARKETS) {
    for (const hsCode of HS_CODES) {
      for (const { code: partCode, partnerCode } of BILATERAL_PARTNERS) {
        // Skip JP bilateral from JP (a market can't be its own partner in this context)
        if (marketCode === "JP" && partCode === "JP") continue;

        const dbPartnerCode = `PARTNER_${partCode}`;
        const latest = await getLatestPeriod(marketCode, hsCode, "import", dbPartnerCode);
        const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";

        if (startFrom > upTo) {
          process.stdout.write(`[${marketCode}←${partCode} ${hsCode}] up to date\n`);
          continue;
        }

        const months = [];
        let cur = startFrom;
        while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

        let saved = 0;
        for (const period of months) {
          const url = `${BASE}?reporterCode=${marketReporter}&partnerCode=${partnerCode}&period=${period}&cmdCode=${hsCode}`;
          const { ok, status, data } = await fetchAndWait(url, 500);
          if (!ok) { process.stdout.write(`  [${marketCode}←${partCode} ${hsCode} ${period}] HTTP ${status}\n`); continue; }

          const total = data
            .filter(r => r.flowCode === "M" && r.primaryValue > 0)
            .reduce((s, r) => s + r.primaryValue, 0);

          if (total > 0) {
            const periodKey = `${period.slice(0, 4)}-${period.slice(4)}`;
            await upsertMetric({ hsCode, reporterCode: marketCode, partnerCode: dbPartnerCode, flow: "import", period: periodKey, value: total });
            saved++;
          }
        }
        process.stdout.write(`[${marketCode}←${partCode} ${hsCode}] ${saved} months saved\n`);
      }
    }
  }

  // ── Also fetch 871430 WORLD totals for import markets ───────────────────
  console.log("\n=== 871430 WORLD import totals ===");
  for (const { code, reporterCode } of IMPORT_MARKETS) {
    const latest = await getLatestPeriod(code, "871430", "import", "WORLD");
    const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";
    if (startFrom > upTo) { console.log(`[${code} 871430 import] up to date`); continue; }

    const months = [];
    let cur = startFrom;
    while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

    let saved = 0;
    for (const period of months) {
      const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=871430`;
      const { ok, status, data } = await fetchAndWait(url);
      if (!ok) { process.stdout.write(`  [${code} 871430 ${period}] HTTP ${status}\n`); continue; }

      const total = data
        .filter(r => r.flowCode === "M" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
        .reduce((s, r) => s + r.primaryValue, 0);

      if (total > 0) {
        const periodKey = `${period.slice(0, 4)}-${period.slice(4)}`;
        await upsertMetric({ hsCode: "871430", reporterCode: code, partnerCode: "WORLD", flow: "import", period: periodKey, value: total });
        saved++;
      }
    }
    console.log(`[${code} 871430 import] ${saved} months saved`);
  }

  await db.$disconnect();
  console.log("\nDone.");
}

main().catch(err => { console.error(err); process.exit(1); });
