import { fetchStaticPage } from "@/lib/staticPage";
import { StaticPageRenderer } from "@/components/StaticPageRenderer";
import { loc } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("distributors");
  const title = loc(page?.metaTitle, locale) ?? (locale === "zh" ? "通路商專區" : locale === "ja" ? "ディストリビューター向け" : locale === "de" ? "Für Händler" : "For Distributors");
  return { title: `${title} — Pedaling Forward` };
}

export default async function DistributorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("distributors");
  return <StaticPageRenderer page={page} locale={locale} />;
}
