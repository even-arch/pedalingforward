import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [total, byFlow, latestPeriod, earliest] = await Promise.all([
    db.tradeMetric.count(),
    db.tradeMetric.groupBy({ by: ["flow"], _count: { id: true } }),
    db.tradeMetric.findFirst({ orderBy: { period: "desc" }, select: { period: true } }),
    db.tradeMetric.findFirst({ orderBy: { period: "asc" }, select: { period: true } }),
  ]);

  return Response.json({ total, byFlow, latestPeriod: latestPeriod?.period, earliestPeriod: earliest?.period });
}
