import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 60;

type PTBlock = {
  _type: string;
  _key: string;
  style?: string;
  listItem?: string;
  children?: { _type: string; _key: string; text?: string }[];
};

type RawPost = {
  _id: string;
  title?: { en?: string; zh?: string };
  body?: {
    en?: PTBlock[];
    zh?: PTBlock[];
    ja?: PTBlock[];
    de?: PTBlock[];
  };
};

const LOCALES = ["en", "zh", "ja", "de"] as const;

// All legitimate body blocks are bullets. Any style:"normal" non-bullet block is either:
//   - the old summary duplicate (prepended by an older buildBody)
//   - a "Source: X" link block (appended by save-media-post's old buildBody)
// Both should be removed; mediaItems (情報來源) replaces source links.
function isStaleBlock(block: PTBlock): boolean {
  return block._type === "block" && block.style === "normal" && !block.listItem;
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await writeClient.fetch<RawPost[]>(
    `*[_type == "post" && status == "published"]{ _id, title, body }`,
    {},
    { cache: "no-store" }
  );

  let repaired = 0;
  const details: string[] = [];

  for (const post of all) {
    const patch: Record<string, PTBlock[]> = {};

    for (const locale of LOCALES) {
      const blocks = post.body?.[locale];
      if (!blocks || blocks.length === 0) continue;
      const cleaned = blocks.filter((b) => !isStaleBlock(b));
      if (cleaned.length !== blocks.length) {
        patch[`body.${locale}`] = cleaned;
      }
    }

    if (Object.keys(patch).length > 0) {
      try {
        await writeClient.patch(post._id).set(patch).commit();
        repaired++;
        const title = post.title?.zh ?? post.title?.en ?? post._id;
        details.push(title);
      } catch {
        // skip, continue
      }
    }
  }

  return Response.json({ ok: true, repaired, total: all.length, details });
}
