import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";
import { ingestComtradeUpdates } from "@/lib/trade-ingest";

export const maxDuration = 300;

function verifyCronOrAdmin(req: Request): boolean | Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return checkAdminAuth(req);
}

async function cleanZombies() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  await db.tradeIngestRun.updateMany({
    where: { status: "running", startedAt: { lt: tenMinutesAgo } },
    data: { status: "error", finishedAt: new Date(), errorMessage: "Timed out (zombie cleanup)" },
  }).catch(() => {});
}

// Vercel cron sends GET.
// Use waitUntil so the handler returns immediately — prevents the 300s function
// timeout from killing the ingest mid-run when API calls are slow.
export async function GET(req: Request) {
  if (!(await verifyCronOrAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await cleanZombies();
  waitUntil(
    ingestComtradeUpdates({ triggeredBy: "cron", maxCalls: 50 }).catch((err) => {
      console.error("[ingest-trade cron] failed:", err);
    })
  );
  return Response.json({ ok: true, started: true });
}

// Manual trigger (admin UI button or direct POST).
// Also uses waitUntil — same reason: long-running work should outlive the HTTP response.
export async function POST(req: Request) {
  if (!(await verifyCronOrAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await cleanZombies();
  waitUntil(
    ingestComtradeUpdates({ triggeredBy: "manual", maxCalls: 400 }).catch((err) => {
      console.error("[ingest-trade] background task failed:", err);
    })
  );
  return Response.json({ ok: true, background: true, message: "更新已在背景啟動，關掉這個頁面也沒關係" });
}
