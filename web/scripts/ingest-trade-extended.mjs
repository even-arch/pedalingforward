/**
 * Extended trade ingest:
 * 1. Update HS 8712 (whole bicycles) for import markets
 * 2. Fetch export totals for top exporters (CN, IT, JP, VN)
 * 3. Fetch bilateral import breakdown for DE (who DE buys from, by partner)
 *
 * Usage: DATABASE_URL="..." node scripts/ingest-trade-extended.mjs
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

// Import market countries (existing)
const IMPORT_MARKETS = [
  { code: "DE", reporterCode: 276 },
  { code: "US", reporterCode: 842 },
  { code: "JP", reporterCode: 392 },
  { code: "NL", reporterCode: 528 },
  { code: "GB", reporterCode: 826 },
];

// Export origin countries (reporters for export flow)
const EXPORT_ORIGINS = [
  { code: "CN", reporterCode: 156, label: "中國" },
  { code: "IT", reporterCode: 380, label: "義大利" },
  { code: "JP", reporterCode: 392, label: "日本" },
  { code: "VN", reporterCode: 704, label: "越南" },
  { code: "PL", reporterCode: 616, label: "波蘭" },
  { code: "TW_REPORTER", reporterCode: 490, label: "台灣(代理)" }, // may not have data
];

// HS codes to fetch
const HS_CODES = ["8714", "8712"];

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

async function fetchAndWait(url, delay = 400) {
  const res = await fetch(url, { cache: "no-store" });
  await new Promise(r => setTimeout(r, delay));
  if (!res.ok) return { ok: false, status: res.status, data: [] };
  const json = await res.json();
  return { ok: true, data: json.data ?? [] };
}

async function getLatestPeriod(reporterCode, hsCode, flow, partnerCode = "WORLD") {
  const rec = await db.tradeMetric.findFirst({
    where: { reporterCode, hsCode, flow, partnerCode },
    orderBy: { period: "desc" },
    select: { period: true },
  });
  return rec?.period ?? null;
}

async function upsertMetric({ source, hsCode, reporterCode, partnerCode, flow, period, value, unit }) {
  await db.tradeMetric.upsert({
    where: { source_hsCode_reporterCode_partnerCode_flow_period: { source, hsCode, reporterCode, partnerCode, flow, period } },
    update: { value },
    create: { source, hsCode, reporterCode, partnerCode, flow, period, value, unit },
  });
}

// ── Part 1: Update HS 8712 for import markets ──────────────────────────────
async function updateHS8712() {
  const upTo = currentYYYYMM();
  console.log("\n=== Part 1: HS 8712 import markets ===");

  for (const { code, reporterCode } of IMPORT_MARKETS) {
    const latest = await getLatestPeriod(code, "8712", "import");
    const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";

    if (startFrom > upTo) {
      console.log(`[${code} 8712] Already up to date (${latest})`);
      continue;
    }

    const months = [];
    let cur = startFrom;
    while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

    let saved = 0;
    for (const period of months) {
      const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=8712`;
      const { ok, status, data } = await fetchAndWait(url);
      if (!ok) { console.log(`  [${code} 8712 ${period}] HTTP ${status}`); continue; }

      const total = data
        .filter(r => r.flowCode === "M" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
        .reduce((s, r) => s + r.primaryValue, 0);

      if (total > 0) {
        const periodKey = `${period.slice(0, 4)}-${period.slice(4)}`;
        await upsertMetric({ source: "comtrade", hsCode: "8712", reporterCode: code, partnerCode: "WORLD", flow: "import", period: periodKey, value: total, unit: "USD" });
        saved++;
      }
    }
    console.log(`[${code} 8712] ${saved} months saved`);
  }
}

// ── Part 2: Export totals for top exporters ────────────────────────────────
async function updateExportOrigins() {
  const upTo = currentYYYYMM();
  console.log("\n=== Part 2: Export origins ===");

  for (const { code, reporterCode, label } of EXPORT_ORIGINS) {
    for (const hsCode of HS_CODES) {
      const latest = await getLatestPeriod(code, hsCode, "export");
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";

      if (startFrom > upTo) {
        console.log(`[${label} ${hsCode} export] Up to date`);
        continue;
      }

      const months = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      for (const period of months) {
        const url = `${BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchAndWait(url);
        if (!ok) { console.log(`  [${label} ${hsCode} ${period}] HTTP ${status}`); continue; }

        const total = data
          .filter(r => r.flowCode === "X" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

        if (total > 0) {
          const periodKey = `${period.slice(0, 4)}-${period.slice(4)}`;
          await upsertMetric({ source: "comtrade", hsCode, reporterCode: code, partnerCode: "WORLD", flow: "export", period: periodKey, value: total, unit: "USD" });
          saved++;
        }
      }
      console.log(`[${label} ${hsCode} export] ${saved} months saved`);
    }
  }
}

// ── Part 3: Bilateral breakdown for DE (partner country detail) ────────────
// Stored as: reporterCode=DE, partnerCode=<ISO or numeric>, flow=import
async function updateBilateral() {
  const upTo = currentYYYYMM();
  console.log("\n=== Part 3: DE bilateral import breakdown ===");

  // Top partner country codes for bicycle parts (known significant ones)
  const TOP_PARTNERS = [
    { code: "TW", partnerCode: 490 },  // Taiwan (Other Asia NES)
    { code: "CN", partnerCode: 156 },  // China
    { code: "IT", partnerCode: 380 },  // Italy
    { code: "VN", partnerCode: 704 },  // Vietnam
    { code: "PL", partnerCode: 616 },  // Poland
    { code: "JP", partnerCode: 392 },  // Japan
    { code: "US", partnerCode: 840 },  // US
  ];

  for (const hsCode of HS_CODES) {
    for (const { code: partCode, partnerCode } of TOP_PARTNERS) {
      const dbPartnerCode = `PARTNER_${partCode}`;
      const latest = await getLatestPeriod("DE", hsCode, "import", dbPartnerCode);
      const startFrom = latest ? addMonths(latest.replace("-", ""), 1) : "201901";

      if (startFrom > upTo) {
        console.log(`[DE←${partCode} ${hsCode}] Up to date`);
        continue;
      }

      const months = [];
      let cur = startFrom;
      while (cur <= upTo) { months.push(cur); cur = addMonths(cur, 1); }

      let saved = 0;
      for (const period of months) {
        // Fetch all DE imports for this period, filter by partnerCode
        const url = `${BASE}?reporterCode=276&partnerCode=${partnerCode}&period=${period}&cmdCode=${hsCode}`;
        const { ok, status, data } = await fetchAndWait(url, 500);
        if (!ok) { console.log(`  [DE←${partCode} ${hsCode} ${period}] HTTP ${status}`); continue; }

        const total = data
          .filter(r => r.flowCode === "M" && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

        if (total > 0) {
          const periodKey = `${period.slice(0, 4)}-${period.slice(4)}`;
          await upsertMetric({ source: "comtrade", hsCode, reporterCode: "DE", partnerCode: dbPartnerCode, flow: "import", period: periodKey, value: total, unit: "USD" });
          saved++;
        }
      }
      console.log(`[DE←${partCode} ${hsCode}] ${saved} months saved`);
    }
  }
}

async function main() {
  console.log(`Target: up to ${currentYYYYMM()}\n`);
  await updateHS8712();
  await updateExportOrigins();
  await updateBilateral();
  await db.$disconnect();
  console.log("\nDone.");
}

main().catch(err => { console.error(err); process.exit(1); });
