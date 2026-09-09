import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    tradeTotal, tradeByFlow, tradeLatest, tradeEarliest,
    eventTotal, eventLatest,
    ruleTotal, ruleVerified,
  ] = await Promise.all([
    db.tradeMetric.count(),
    db.tradeMetric.groupBy({ by: ["flow"], _count: { id: true } }),
    db.tradeMetric.findFirst({ orderBy: { period: "desc" }, select: { period: true } }),
    db.tradeMetric.findFirst({ orderBy: { period: "asc" }, select: { period: true } }),
    db.globalEvent.count(),
    db.globalEvent.findFirst({ orderBy: { eventDate: "desc" }, select: { eventDate: true } }),
    db.causalRule.count(),
    db.causalRule.count({ where: { verified: true } }),
  ]);

  return Response.json({
    trade: {
      total: tradeTotal,
      byFlow: tradeByFlow,
      latestPeriod: tradeLatest?.period,
      earliestPeriod: tradeEarliest?.period,
    },
    events: { total: eventTotal, latestDate: eventLatest?.eventDate },
    rules:  { total: ruleTotal, verified: ruleVerified },
  });
}
