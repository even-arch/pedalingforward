import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";
import { ingestComtradeUpdates } from "@/lib/trade-ingest";

export const maxDuration = 300;

/**
 * POST /api/admin/backfill-trade
 *
 * Dedicated historical backfill endpoint. Skips bilateral breakdown (section 3)
 * to focus all API quota on import/export world totals first.
 * Use this to quickly populate sections 1+2 for all HS codes and markets.
 *
 * Optional body: { hsCodes?: string[], fromPeriod?: string }
 * Examples:
 *   {}                              — all HS codes, from earliest missing period
 *   { "hsCodes": ["871430","871160"] }  — only e-bike codes
 *   { "fromPeriod": "201901" }          — force restart from Jan 2019
 */
export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    hsCodes?: string[];
    fromPeriod?: string;
    includeBilateral?: boolean;
  };

  // Zombie cleanup
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  await db.tradeIngestRun.updateMany({
    where: { status: "running", startedAt: { lt: tenMinutesAgo } },
    data: { status: "error", finishedAt: new Date(), errorMessage: "Timed out (zombie cleanup)" },
  }).catch(() => {});

  // Cron runs 6x/day at 50 calls each = 300 calls/day.
  // Backfill is capped at 180 so total stays under 500/day quota.
  // Will abort immediately on HTTP 429 if daily quota is already exhausted.
  const maxCalls = 180;

  waitUntil(
    ingestComtradeUpdates({
      triggeredBy: "manual",
      maxCalls,
      skipBilateral: !body.includeBilateral,
      hsCodes: body.hsCodes,
      fromPeriod: body.fromPeriod,
    }).catch((err) => {
      console.error("[backfill-trade] background task failed:", err);
    })
  );

  return Response.json({
    ok: true,
    background: true,
    maxCalls,
    skipBilateral: !body.includeBilateral,
    hsCodes: body.hsCodes ?? "all",
    fromPeriod: body.fromPeriod ?? "auto (resume from last saved)",
    message: "歷史資料補齊已在背景啟動，可在「資料管理」→「執行記錄」查看進度",
  });
}
