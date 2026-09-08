import { checkAdminAuth } from "@/lib/admin";

export const maxDuration = 30;

// One-shot Comtrade API probe — returns raw response so we can see the actual field names and values.
// GET /api/admin/trade-probe?reporter=276&partner=0&period=202301&hs=8714&flow=M
export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const reporter = url.searchParams.get("reporter") ?? "276"; // Germany default
  const partner = url.searchParams.get("partner") ?? "0";     // World total
  const period = url.searchParams.get("period") ?? "202301";
  const hs = url.searchParams.get("hs") ?? "8714";

  const apiUrl = `https://comtradeapi.un.org/public/v1/preview/C/M/HS?reporterCode=${reporter}&partnerCode=${partner}&period=${period}&cmdCode=${hs}`;

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = null; }

    const data = (parsed as { data?: unknown[] } | null)?.data ?? [];

    return Response.json({
      apiUrl,
      httpStatus: res.status,
      rowCount: (data as unknown[]).length,
      // Show first 3 rows in full so we can see all field names
      sample: (data as unknown[]).slice(0, 3),
      // Also show what keys exist on the first row
      fieldNames: data.length > 0 ? Object.keys(data[0] as object) : [],
    });
  } catch (err) {
    return Response.json({ error: String(err), apiUrl }, { status: 500 });
  }
}
