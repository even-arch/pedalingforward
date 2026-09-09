import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  revalidatePath("/", "layout");

  return Response.json({ ok: true, revalidated: true, now: Date.now() });
}
