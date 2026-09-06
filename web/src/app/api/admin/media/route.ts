import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "collected";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  const items = await writeClient.fetch(
    `*[_type == "mediaItem" && status == $status] | order(publishedAt desc)[0...$limit]{
      _id, title, url, sourceName, sourceLanguage, description,
      summary, keyPoints, fullTextFetched,
      publishedAt, fetchedAt, status, relevanceScore, relevanceReason,
      "hasPost": defined(generatedPost)
    }`,
    { status, limit },
    { cache: "no-store" }
  );

  return Response.json({ items });
}

export async function PATCH(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };

  if (!id || !status) {
    return Response.json({ error: "id and status required" }, { status: 400 });
  }

  const valid = ["raw", "collected", "dismissed", "filtered_out"];
  if (!valid.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  await writeClient.patch(id).set({ status }).commit();
  return Response.json({ ok: true });
}
