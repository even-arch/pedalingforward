import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";

export const maxDuration = 30;

const BASE = "https://comtradeapi.un.org/public/v1/preview/C/M/HS";

type TestStep = {
  period: string;
  url: string;
  httpStatus?: number;
  apiOk: boolean;
  rowCount: number;
  matchingRows: number;
  totalValue: number;
  dbOk: boolean;
  error?: string;
};

type ComtradeRow = {
  flowCode: string;
  partnerCode: number;
  partner2Code: number;
  primaryValue: number;
};

/**
 * GET /api/admin/test-trade
 *
 * Synchronous end-to-end test: calls Comtrade API → parses response → writes to DB.
 * Tests 3 consecutive months (May/Jun/Jul 2026) for DE-8714 import.
 * Returns immediately with full per-step details — no background tasks.
 * Safe to run multiple times (DB writes are upserts).
 */
export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testPeriods = ["202505", "202506", "202507"];
  const steps: TestStep[] = [];

  for (const period of testPeriods) {
    const url = `${BASE}?reporterCode=276&partnerCode=0&period=${period}&cmdCode=8714`;
    const step: TestStep = { period, url, apiOk: false, rowCount: 0, matchingRows: 0, totalValue: 0, dbOk: false };

    try {
      const res = await fetch(url, { cache: "no-store" });
      await new Promise((r) => setTimeout(r, 200));
      step.httpStatus = res.status;

      if (!res.ok) {
        step.error = `HTTP ${res.status}${res.status === 429 ? " — daily quota exhausted" : ""}`;
        steps.push(step);
        if (res.status === 429) break;
        continue;
      }

      const json = await res.json() as { data?: ComtradeRow[] };
      const data = json.data ?? [];
      step.apiOk = true;
      step.rowCount = data.length;

      const matching = data.filter(
        (r) => r.flowCode === "M" && r.partnerCode === 0 && (!r.partner2Code || r.partner2Code === 0)
      );
      step.matchingRows = matching.length;
      step.totalValue = matching.reduce((sum, r) => sum + (r.primaryValue ?? 0), 0);

      const dbPeriod = `${period.slice(0, 4)}-${period.slice(4)}`;
      await db.tradeMetric.upsert({
        where: {
          source_hsCode_reporterCode_partnerCode_flow_period: {
            source: "comtrade",
            hsCode: "8714",
            reporterCode: "DE",
            partnerCode: "WORLD",
            flow: "import",
            period: dbPeriod,
          },
        },
        update: { value: step.totalValue },
        create: {
          source: "comtrade",
          hsCode: "8714",
          reporterCode: "DE",
          partnerCode: "WORLD",
          flow: "import",
          period: dbPeriod,
          value: step.totalValue,
          unit: "USD",
        },
      });
      step.dbOk = true;
    } catch (err) {
      step.error = String(err);
    }

    steps.push(step);
  }

  const allOk = steps.length > 0 && steps.every((s) => s.apiOk && s.dbOk);
  const quotaHit = steps.some((s) => s.httpStatus === 429);
  const apiReachable = steps.some((s) => s.httpStatus !== undefined);

  return Response.json({
    ok: allOk,
    quotaHit,
    apiReachable,
    summary: allOk
      ? `✅ 全部 ${steps.length} 筆完整通過（API + DB）`
      : quotaHit
        ? "❌ 配額已耗盡（429）— 今天的 500 calls 已用完，明天 00:00 UTC 重置"
        : `⚠️ 部分失敗，請看 steps 詳細`,
    steps,
  });
}
