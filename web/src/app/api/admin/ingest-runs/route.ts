import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-clean zombie runs (stuck "running" for over 10 minutes) on every poll
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  await db.tradeIngestRun.updateMany({
    where: { status: "running", startedAt: { lt: tenMinutesAgo } },
    data: { status: "error", finishedAt: new Date(), errorMessage: "Timed out (auto-cleanup)" },
  }).catch(() => { /* ignore */ });

  const runs = await db.tradeIngestRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      triggeredBy: true,
      startedAt: true,
      finishedAt: true,
      status: true,
      totalSaved: true,
      totalErrors: true,
      callsUsed: true,
      results: true,
    },
  });

  return Response.json({ runs });
}
