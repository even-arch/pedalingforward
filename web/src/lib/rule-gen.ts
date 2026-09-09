import { db } from "./db";
import { getAnthropicKey } from "./admin";

type RuleCandidate = {
  industry: string; hsCode: string; triggerEvent: string; triggerTags: string[];
  propagationPath: string; tradeOutcome: string; lagMonths: number;
  confidence: number; evidencePeriod: string; notes?: string;
};

const RULE_SCHEMA = {
  type: "object",
  properties: {
    rules: {
      type: "array",
      items: {
        type: "object",
        required: ["industry", "hsCode", "triggerEvent", "triggerTags", "propagationPath", "tradeOutcome", "lagMonths", "confidence", "evidencePeriod"],
        properties: {
          industry:        { type: "string" },
          hsCode:          { type: "string", enum: ["8714", "8712", "871430", "871160"] },
          triggerEvent:    { type: "string" },
          triggerTags:     { type: "array", items: { type: "string" } },
          propagationPath: { type: "string" },
          tradeOutcome:    { type: "string" },
          lagMonths:       { type: "integer", minimum: 0, maximum: 24 },
          confidence:      { type: "number", minimum: 0, maximum: 1 },
          evidencePeriod:  { type: "string" },
          notes:           { type: "string" },
        },
      },
    },
  },
};

export async function generateCausalRules(): Promise<{ generated: number; error?: string }> {
  const apiKey = await getAnthropicKey();
  if (!apiKey) return { generated: 0, error: "Anthropic API key not configured in Sanity settings" };

  // Read context: recent trade trends + recent events
  const [recentMetrics, recentEvents] = await Promise.all([
    db.tradeMetric.findMany({
      where: { period: { gte: "2020-01" } },
      orderBy: { period: "asc" },
      select: { reporterCode: true, hsCode: true, period: true, value: true, flow: true, partnerCode: true },
      take: 300,
    }),
    db.globalEvent.findMany({
      orderBy: { eventDate: "desc" },
      take: 60,
      select: { title: true, eventDate: true, countries: true, tags: true, source: true, tone: true },
    }),
  ]);

  if (recentMetrics.length === 0 && recentEvents.length === 0) {
    return { generated: 0, error: "No data available yet — run Comtrade and GDELT ingest first" };
  }

  // Summarise trade data for prompt
  const metricSummary = recentMetrics
    .filter((m) => m.partnerCode === "WORLD")
    .slice(0, 80)
    .map((m) => `${m.reporterCode} ${m.flow} HS${m.hsCode} ${m.period}: $${(m.value / 1e6).toFixed(1)}M`)
    .join("\n");

  const eventSummary = recentEvents
    .map((e) => `[${new Date(e.eventDate).toISOString().slice(0, 7)}] ${e.title} (${e.tags.join(", ")})`)
    .join("\n");

  const prompt = `You are a bicycle industry trade analyst. Analyze the following data and generate 6–10 causal rules that explain how global events affect bicycle trade flows.

TRADE DATA (recent periods, USD millions):
${metricSummary || "(no trade data yet)"}

RECENT INDUSTRY EVENTS:
${eventSummary || "(no events yet)"}

Generate rules based on these patterns. Each rule describes:
- A specific observable event type (tariff announcement, supply chain disruption, demand shock, etc.)
- How it propagates through the supply chain
- The observable trade outcome (import/export volume change, price effect)
- The typical lag in months before the effect appears in trade statistics

Keep each text field under 120 characters. Output JSON matching this structure exactly (no markdown, no code fences, raw JSON only):
{"rules": [{"industry": "bicycle", "hsCode": "8714", "triggerEvent": "...", "triggerTags": [...], "propagationPath": "...", "tradeOutcome": "...", "lagMonths": 3, "confidence": 0.75, "evidencePeriod": "2020-2023"}]}

Focus on patterns visible in the data. Confidence should reflect data support (0.5 = speculative, 0.75 = supported, 0.9 = strongly evidenced). Output raw JSON only — no markdown, no code fences.`;

  let responseText = "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { generated: 0, error: `Claude API error ${res.status}: ${err.slice(0, 200)}` };
    }

    const data = await res.json() as { content?: { type: string; text: string }[] };
    responseText = data.content?.find((c) => c.type === "text")?.text ?? "";
  } catch (err) {
    return { generated: 0, error: `Network error: ${String(err)}` };
  }

  // Parse JSON from response
  let candidates: RuleCandidate[] = [];
  try {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in response");
    const parsed = JSON.parse(match[0]) as { rules?: RuleCandidate[] };
    candidates = parsed.rules ?? [];
    // Validate against schema roughly
    candidates = candidates.filter((r) =>
      r.industry && r.hsCode && r.triggerEvent && r.tradeOutcome &&
      typeof r.lagMonths === "number" && typeof r.confidence === "number"
    );
    void RULE_SCHEMA; // schema kept for reference
  } catch (err) {
    return { generated: 0, error: `JSON parse error: ${String(err)} — response: ${responseText.slice(0, 300)}` };
  }

  if (candidates.length === 0) return { generated: 0, error: "Claude returned no valid rules" };

  // Remove old unverified AI rules and insert new ones
  await db.causalRule.deleteMany({ where: { verified: false } });

  let generated = 0;
  for (const r of candidates) {
    await db.causalRule.create({
      data: {
        industry: r.industry ?? "bicycle",
        hsCode: r.hsCode,
        triggerEvent: r.triggerEvent,
        triggerTags: r.triggerTags ?? [],
        propagationPath: r.propagationPath ?? "",
        tradeOutcome: r.tradeOutcome,
        lagMonths: Math.max(0, Math.min(24, Math.round(r.lagMonths))),
        confidence: Math.max(0, Math.min(1, r.confidence)),
        verified: false,
        evidencePeriod: r.evidencePeriod ?? "",
        notes: r.notes,
      },
    });
    generated++;
  }

  await db.systemMeta.upsert({
    where: { key: "rules_last_generated" },
    update: { value: new Date().toISOString() },
    create: { key: "rules_last_generated", value: new Date().toISOString() },
  }).catch(() => { /* non-fatal */ });

  return { generated };
}
