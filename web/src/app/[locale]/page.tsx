import { cachedSanity } from "@/sanity/lib/live";
import { homepageQuery } from "@/sanity/queries/home";
import { HeroSection } from "@/components/home/HeroSection";
import { LeadArticle } from "@/components/home/LeadArticle";
import { ArticleGrid } from "@/components/home/ArticleGrid";
import { JoinStrip } from "@/components/home/JoinStrip";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await cachedSanity({ query: homepageQuery })) as { data: any };

  const settings    = data?.settings;
  const recentPosts = data?.recentPosts ?? [];
  const leadPost    = settings?.featuredPost ?? recentPosts[0] ?? null;
  const gridPosts   = recentPosts
    .filter((p: { _id: string }) => p._id !== leadPost?._id)
    .slice(0, 5);

  const hasContent = leadPost || gridPosts.length > 0;

  return (
    <>
      <HeroSection
        locale={locale}
        eyebrow={settings?.heroEyebrow}
        headline={settings?.heroHeadline}
        subtext={settings?.heroSubtext}
        stats={settings?.stats}
      />

      {hasContent && (
        <section style={{ paddingBlock: "88px" }}>
          <div className="wrap">
            <div className="feedhead">
              <h2>Latest</h2>
            </div>
            <div className="feed">
              {leadPost && <LeadArticle post={leadPost} locale={locale} />}
              <ArticleGrid posts={gridPosts} locale={locale} />
            </div>
          </div>
        </section>
      )}

      <JoinStrip
        locale={locale}
        headline={settings?.joinHeadline}
        subtext={settings?.joinSubtext}
      />
    </>
  );
}
