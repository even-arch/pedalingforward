import { fetchStaticPage } from "@/lib/staticPage";
import { StaticPageRenderer } from "@/components/StaticPageRenderer";
import { loc } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("shops");
  const title = loc(page?.metaTitle, locale) ?? (locale === "zh" ? "車店專區" : locale === "ja" ? "ショップ向け" : locale === "de" ? "Für Shops" : "For Bike Shops");
  return { title: `${title} — Pedaling Forward` };
}

export default async function ShopsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("shops");
  return <StaticPageRenderer page={page} locale={locale} />;
}
