import { checkAdminAuth } from "@/lib/admin";
import { ingestComtradeUpdates } from "@/lib/trade-ingest";

function verifyCronOrAdmin(req: Request): boolean | Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return checkAdminAuth(req);
}

export async function POST(req: Request) {
  if (!(await verifyCronOrAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await ingestComtradeUpdates();
    const totalSaved = results.reduce((s, r) => s + r.saved, 0);
    return Response.json({ ok: true, results, totalSaved });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
