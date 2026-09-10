import { writeClient } from "@/sanity/lib/write-client";

const DOC_ID = "pixabay-blocklist";

export async function getBlockedPixabayIds(): Promise<Set<string>> {
  const doc = await writeClient.fetch<{ blockedIds?: string[] } | null>(
    `*[_id == $id][0]{ blockedIds }`,
    { id: DOC_ID },
    { cache: "no-store" }
  );
  return new Set(doc?.blockedIds ?? []);
}

export async function addToBlocklist(pixabayId: string): Promise<void> {
  await writeClient.createIfNotExists({
    _id: DOC_ID,
    _type: "pixabayBlocklist",
    blockedIds: [],
  });
  await writeClient
    .patch(DOC_ID)
    .setIfMissing({ blockedIds: [] })
    .append("blockedIds", [pixabayId])
    .commit();
}
