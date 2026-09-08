import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";
import { ingestComtradeUpdates } from "@/lib/trade-ingest";

export const maxDuration = 60;

function verifyCronOrAdmin(req: Request): boolean | Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return checkAdminAuth(req);
}

export async function POST(req: Request) {
  if (!(await verifyCronOrAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isCron = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

  // Clean up zombie runs (stuck "running" for over 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  await db.tradeIngestRun.updateMany({
    where: { status: "running", startedAt: { lt: tenMinutesAgo } },
    data: { status: "error", finishedAt: new Date(), errorMessage: "Timed out (zombie cleanup)" },
  }).catch(() => { /* ignore */ });

  if (isCron) {
    try {
      const results = await ingestComtradeUpdates("cron");
      const totalSaved = results.reduce((s, r) => s + r.saved, 0);
      return Response.json({ ok: true, results, totalSaved });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
  }

  // Manual trigger: return immediately, run in background
  waitUntil(
    ingestComtradeUpdates("manual").catch((err) => {
      console.error("[ingest-trade] background task failed:", err);
    })
  );
  return Response.json({ ok: true, background: true, message: "更新已在背景啟動，關掉這個頁面也沒關係" });
}
