import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { ingestEurostatUpdates } from "@/lib/eurostat-ingest";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    fromPeriod?: string;
    hsCodes?: string[];
    skipBilateral?: boolean;
  };

  waitUntil(
    ingestEurostatUpdates({
      triggeredBy: "manual",
      fromPeriod: body.fromPeriod,
      hsCodes: body.hsCodes,
      skipBilateral: body.skipBilateral ?? false,
    }).catch((err) => {
      console.error("[ingest-eurostat] failed:", err);
    })
  );

  return Response.json({
    ok: true,
    background: true,
    message: "Eurostat 更新已在背景啟動（FR/IT/BE/AT/ES/PL × WORLD + 雙邊）",
  });
}
