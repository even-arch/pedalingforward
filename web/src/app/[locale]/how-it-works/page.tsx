import { fetchStaticPage } from "@/lib/staticPage";
import { StaticPageRenderer } from "@/components/StaticPageRenderer";
import { loc } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("how-it-works");
  const title = loc(page?.metaTitle, locale) ?? (locale === "zh" ? "如何運作" : locale === "ja" ? "仕組み" : locale === "de" ? "So funktioniert's" : "How It Works");
  return { title: `${title} — Pedaling Forward` };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("how-it-works");
  return <StaticPageRenderer page={page} locale={locale} />;
}
