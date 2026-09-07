import { writeClient } from "@/sanity/lib/write-client";
import { staticPageQuery } from "@/sanity/queries/staticPage";

export type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };

export type SectionItem = { _key: string; title?: LocalizedStr; body?: LocalizedStr };
export type ParagraphItem = { _key: string; text?: LocalizedStr };

export type PageSection =
  | { _key: string; _type: "benefitsSection"; heading?: LocalizedStr; items?: SectionItem[] }
  | { _key: string; _type: "stepsSection";   heading?: LocalizedStr; items?: SectionItem[] }
  | { _key: string; _type: "proseSection";   heading?: LocalizedStr; paragraphs?: ParagraphItem[] }
  | { _key: string; _type: "ctaSection";     heading?: LocalizedStr; buttonLabel?: LocalizedStr; finePrint?: LocalizedStr; href?: string }
  | { _key: string; _type: "noteSection";    text?: LocalizedStr };

export type StaticPageData = {
  slug: string;
  heroStyle?: "dark" | "red";
  heroEyebrow?: LocalizedStr;
  heroHeadline?: LocalizedStr;
  heroLead?: LocalizedStr;
  heroBody?: LocalizedStr;
  specItems?: { _key: string; label?: LocalizedStr; value?: LocalizedStr }[];
  sections?: PageSection[];
  metaTitle?: LocalizedStr;
} | null;

export async function fetchStaticPage(slug: string): Promise<StaticPageData> {
  return writeClient.fetch<StaticPageData>(staticPageQuery, { slug }, { cache: "no-store" });
}
