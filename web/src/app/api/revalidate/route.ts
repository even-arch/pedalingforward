import { revalidatePath } from "next/cache";

export async function POST() {
  revalidatePath("/", "layout");
  return Response.json({ ok: true, revalidated: true, now: Date.now() });
}
