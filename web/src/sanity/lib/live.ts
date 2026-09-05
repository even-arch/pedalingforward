import { defineLive } from "next-sanity/live";
import { client } from "../client";

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: "2026-09-02" }),
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
});

export async function cachedSanity(
  options: Parameters<typeof sanityFetch>[0]
) {
  "use cache";
  return sanityFetch(options);
}
