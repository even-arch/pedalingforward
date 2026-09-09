import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { ingestGdeltEvents } from "@/lib/event-ingest";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { backfill?: boolean };
  const startDate = body.backfill ? new Date("2019-01-01") : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  waitUntil(
    ingestGdeltEvents(startDate, new Date()).catch((err) => {
      console.error("[ingest-events] failed:", err);
    })
  );

  return Response.json({
    ok: true,
    background: true,
    mode: body.backfill ? "backfill 2019→now" : "last 90 days",
    message: "GDELT 事件更新已在背景啟動",
  });
}
