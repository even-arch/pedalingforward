import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") ?? "trade";

  try {
    if (section === "trade") {
      const hs = searchParams.get("hs") ?? "8714";
      const metrics = await db.tradeMetric.findMany({
        where: { hsCode: hs, flow: "import", partnerCode: "WORLD" },
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
      const [importMetrics, exportMetrics, bilateralMetrics, events, rules] = await Promise.all([
        // Import totals (all HS codes) for import market chart
        db.tradeMetric.findMany({
          where: { flow: "import", partnerCode: "WORLD" },
          select: { reporterCode: true, hsCode: true, period: true, value: true },
          orderBy: { period: "asc" },
        }),
        // Export totals (all HS codes) for major exporter countries
        db.tradeMetric.findMany({
          where: { flow: "export", partnerCode: "WORLD" },
          select: { reporterCode: true, hsCode: true, period: true, value: true },
          orderBy: { period: "asc" },
        }),
        // DE bilateral: who sells to Germany, by partner country
        db.tradeMetric.findMany({
          where: {
            reporterCode: "DE",
            flow: "import",
            NOT: { partnerCode: "WORLD" },
          },
          select: { partnerCode: true, hsCode: true, period: true, value: true },
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
      return Response.json({ importMetrics, exportMetrics, bilateralMetrics, events, rules });
    }

    return Response.json({ error: "Unknown section" }, { status: 400 });
  } catch (err) {
    console.error("[intelligence API]", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
