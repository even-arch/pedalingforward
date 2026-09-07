// One-time catch-up script: fetch 2025+ data from UN Comtrade public API
// Usage: DATABASE_URL="..." node scripts/ingest-trade.mjs

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const COMTRADE_BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

const COUNTRIES = [
  { code: "DE", reporterCode: 276 },
  { code: "US", reporterCode: 842 },
  { code: "JP", reporterCode: 392 },
  { code: "NL", reporterCode: 528 },
  { code: "GB", reporterCode: 826 },
];

function addMonths(yyyymm, n) {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6));
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYYYYMM() {
  const now = new Date();
  // Comtrade lags ~2 months
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function ingest() {
  const upTo = currentYYYYMM();
  console.log(`Target: up to ${upTo}\n`);

  for (const { code, reporterCode } of COUNTRIES) {
    const latest = await db.tradeMetric.findFirst({
      where: { reporterCode: code, source: "comtrade", hsCode: "8714" },
      orderBy: { period: "desc" },
      select: { period: true },
    });

    const lastPeriod = latest?.period ?? "2019-01";
    const startFrom = addMonths(lastPeriod.replace("-", ""), 1);

    console.log(`[${code}] Last in DB: ${lastPeriod}  →  fetching from ${startFrom}`);

    if (startFrom > upTo) {
      console.log(`[${code}] Already up to date.\n`);
      continue;
    }

    const months = [];
    let cur = startFrom;
    while (cur <= upTo) {
      months.push(cur);
      cur = addMonths(cur, 1);
    }

    let saved = 0;
    for (const period of months) {
      const url = `${COMTRADE_BASE}?reporterCode=${reporterCode}&partnerCode=0&period=${period}&cmdCode=8714`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.log(`  ${period}: HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        const records = data.data ?? [];
        const importTotal = records
          .filter(r => r.flowCode === "M" && r.partnerCode === 0 && r.partner2Code === 0 && r.primaryValue > 0)
          .reduce((s, r) => s + r.primaryValue, 0);

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
          console.log(`  ${period}: €${(importTotal / 1e6).toFixed(2)}M saved`);
          saved++;
        } else {
          console.log(`  ${period}: no data`);
        }
      } catch (err) {
        console.log(`  ${period}: error – ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 400));
    }
    console.log(`[${code}] Done: ${saved} months saved.\n`);
  }

  await db.$disconnect();
}

ingest().catch(err => { console.error(err); process.exit(1); });
