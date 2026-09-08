import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      results: true,
    },
  });

  return Response.json({ runs });
}
