import { cachedSanity } from '@/sanity/lib/live'
import { homepageQuery } from '@/sanity/queries/home'
import { HeroSection } from '@/components/home/HeroSection'
import { LeadArticle } from '@/components/home/LeadArticle'
import { ArticleGrid } from '@/components/home/ArticleGrid'
import { BrandsStrip } from '@/components/home/BrandsStrip'
import { JoinStrip } from '@/components/home/JoinStrip'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await cachedSanity({ query: homepageQuery }) as { data: any }

  const settings = data?.settings
  const recentPosts = data?.recentPosts ?? []
  const brands: { _id: string; name: string }[] = data?.brands ?? []

  const pinnedPost = settings?.featuredPost
  const leadPost = pinnedPost ?? recentPosts[0] ?? null

  const gridPosts = recentPosts
    .filter((p: { _id: string }) => p._id !== leadPost?._id)
    .slice(0, 3)

  const brandList: { _id: string; name: string }[] =
    brands.length ? brands : (settings?.featuredBrands ?? [])

  return (
    <>
      <HeroSection
        locale={locale}
        eyebrow={settings?.heroEyebrow}
        headline={settings?.heroHeadline}
        subtext={settings?.heroSubtext}
        stats={settings?.stats}
      />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <SectionDivider label="Latest" />

        {leadPost && <LeadArticle post={leadPost} locale={locale} />}

        {gridPosts.length > 0 && (
          <>
            <SectionDivider label="Recent" />
            <ArticleGrid posts={gridPosts} locale={locale} />
          </>
        )}
      </div>

      <BrandsStrip brands={brandList} />

      <JoinStrip
        locale={locale}
        headline={settings?.joinHeadline}
        subtext={settings?.joinSubtext}
      />
    </>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-5 mb-8">
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-stone-500 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-stone-200" />
    </div>
  )
}
