import { fetchStaticPage } from "@/lib/staticPage";
import { StaticPageRenderer } from "@/components/StaticPageRenderer";
import { loc } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("suppliers");
  const title = loc(page?.metaTitle, locale) ?? (locale === "zh" ? "供應商專區" : locale === "ja" ? "サプライヤー向け" : locale === "de" ? "Für Lieferanten" : "For Suppliers");
  return { title: `${title} — Pedaling Forward` };
}

export default async function SuppliersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("suppliers");
  return <StaticPageRenderer page={page} locale={locale} />;
}
