import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";
import { ingestSanityEvents, retagEventCountries } from "@/lib/event-ingest";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    backfill?: boolean;
    retag?: boolean;
    resetGdelt?: boolean; // clear all gdelt events, then re-import from RSS
  };

  if (body.retag) {
    const result = await retagEventCountries();
    return Response.json({ ok: true, updated: result.updated, message: `已修正 ${result.updated} 筆事件的國家標籤` });
  }

  if (body.resetGdelt) {
    // Synchronously delete GDELT records (fast — usually < 1s)
    const { count } = await db.globalEvent.deleteMany({ where: { source: "gdelt" } });
    // Then kick off a full RSS backfill in background
    waitUntil(
      ingestSanityEvents({ fromDate: new Date("2019-01-01") }).catch((err) => {
        console.error("[ingest-events reset] RSS backfill failed:", err);
      })
    );
    return Response.json({
      ok: true,
      deleted: count,
      message: `已刪除 ${count} 筆 GDELT 事件，正在從 RSS 重新匯入（2019→今）…`,
    });
  }

  const fromDate = body.backfill ? new Date("2019-01-01") : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  waitUntil(
    ingestSanityEvents({ fromDate }).catch((err) => {
      console.error("[ingest-events] failed:", err);
    })
  );

  return Response.json({
    ok: true,
    background: true,
    mode: body.backfill ? "backfill 2019→now" : "last 90 days",
    message: body.backfill
      ? "從 Sanity mediaItem 補齊 2019→現在的事件資料（背景執行）"
      : "從 Sanity mediaItem 更新最近 90 天的事件資料（背景執行）",
  });
}
