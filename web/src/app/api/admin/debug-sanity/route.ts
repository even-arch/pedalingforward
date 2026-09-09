import { sanityFetch } from "@/sanity/lib/live";
import { staticPageQuery } from "@/sanity/queries/staticPage";
import { writeClient } from "@/sanity/lib/write-client";

export async function GET() {

  // Test 1: sanityFetch (the live client used by pages)
  let liveResult: unknown = null;
  let liveError: string | null = null;
  try {
    const res = await sanityFetch({ query: staticPageQuery, params: { slug: "shops" } });
    liveResult = res;
  } catch (err) {
    liveError = String(err);
  }

  // Test 2: writeClient direct query (bypasses everything, always works)
  let directResult: unknown = null;
  let directError: string | null = null;
  try {
    directResult = await writeClient.fetch(staticPageQuery, { slug: "shops" }, { cache: "no-store" });
  } catch (err) {
    directError = String(err);
  }

  return Response.json({
    live: { result: liveResult, error: liveError },
    direct: { result: directResult, error: directError },
    env: {
      hasReadToken: !!process.env.SANITY_API_READ_TOKEN,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    },
  });
}
