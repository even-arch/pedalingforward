import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") ?? "trade";

  try {
    if (section === "trade") {
      // Monthly trade volume, all countries, HS 8714 (total bicycle parts)
      const metrics = await db.tradeMetric.findMany({
        where: { hsCode: "8714", flow: "import" },
        select: { reporterCode: true, period: true, value: true },
        orderBy: { period: "asc" },
      });
      return Response.json({ metrics });
    }

    if (section === "events") {
      const limit = parseInt(searchParams.get("limit") ?? "50");
      const country = searchParams.get("country");
      const events = await db.globalEvent.findMany({
        where: country ? { countries: { has: country } } : undefined,
        select: { id: true, title: true, summary: true, eventDate: true, countries: true, tags: true, source: true, url: true, tone: true },
        orderBy: { eventDate: "desc" },
        take: limit,
      });
      return Response.json({ events });
    }

    if (section === "rules") {
      const rules = await db.causalRule.findMany({
        select: { id: true, hsCode: true, triggerEvent: true, triggerTags: true, propagationPath: true, tradeOutcome: true, lagMonths: true, confidence: true, verified: true, evidencePeriod: true },
        orderBy: { confidence: "desc" },
      });
      return Response.json({ rules });
    }

    if (section === "overview") {
      // All three in one call for initial page load
      const [metrics, events, rules] = await Promise.all([
        db.tradeMetric.findMany({
          where: { hsCode: "8714", flow: "import" },
          select: { reporterCode: true, period: true, value: true },
          orderBy: { period: "asc" },
        }),
        db.globalEvent.findMany({
          select: { id: true, title: true, eventDate: true, countries: true, tags: true, source: true, tone: true },
          orderBy: { eventDate: "desc" },
          take: 100,
        }),
        db.causalRule.findMany({
          select: { id: true, hsCode: true, triggerEvent: true, triggerTags: true, tradeOutcome: true, lagMonths: true, confidence: true, verified: true },
          orderBy: { confidence: "desc" },
        }),
      ]);
      return Response.json({ metrics, events, rules });
    }

    return Response.json({ error: "Unknown section" }, { status: 400 });
  } catch (err) {
    console.error("[intelligence API]", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
