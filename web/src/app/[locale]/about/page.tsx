import { fetchStaticPage } from "@/lib/staticPage";
import { StaticPageRenderer } from "@/components/StaticPageRenderer";
import { loc } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("about");
  const title = loc(page?.metaTitle, locale) ?? (locale === "zh" ? "關於我們" : locale === "ja" ? "私たちについて" : locale === "de" ? "Über uns" : "About");
  return { title: `${title} — Pedaling Forward` };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("about");
  return <StaticPageRenderer page={page} locale={locale} />;
}
