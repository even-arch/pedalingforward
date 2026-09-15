import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { ingestUsCensusUpdates } from "@/lib/uscensus-ingest";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    fromPeriod?: string;
    hsCodes?: string[];
    maxCalls?: number;
  };

  waitUntil(
    ingestUsCensusUpdates({
      triggeredBy: "manual",
      fromPeriod: body.fromPeriod ?? "201901",
      hsCodes: body.hsCodes,
      maxCalls: body.maxCalls ?? 300,
    }).catch((err) => {
      console.error("[ingest-uscensus] failed:", err);
    })
  );

  return Response.json({
    ok: true,
    background: true,
    message: "US Census 更新已在背景啟動（US 進出口 + 雙邊來源國）",
  });
}
