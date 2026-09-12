import { fetchStaticPage } from "@/lib/staticPage";
import { loc } from "@/lib/locale";
import { getTranslations } from "next-intl/server";
import IntelligenceDashboard from "@/components/IntelligenceDashboard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await fetchStaticPage("intelligence");
  const title = loc(page?.metaTitle, locale)
    ?? (locale === "zh" ? "貿易情報" : locale === "ja" ? "市場データ" : locale === "de" ? "Marktdaten" : "Market Intelligence");
  return { title: `${title} — Pedaling Forward` };
}

export default async function IntelligencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    fetchStaticPage("intelligence"),
    getTranslations({ locale, namespace: "intelligence" }),
  ]);

  const l = (f?: { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null } | null) =>
    loc(f, locale) ?? "";

  const eyebrow  = l(page?.heroEyebrow)  || "Market Intelligence";
  const headline = l(page?.heroHeadline) || t("statsPeriod"); // fallback just in case
  const lead     = l(page?.heroLead);

  return (
    <>
      {/* ── Hero (Sanity-managed, server-rendered) ── */}
      <div className="field-ink">
        <div className="wrap">
          <div className="phead" style={{ paddingBottom: 72 }}>
            <p className="lab" style={{ color: "#D5352A", marginBottom: 24 }}>{eyebrow}</p>
            <h1
              className="display"
              style={{ fontSize: "clamp(36px, 5vw, 72px)", color: "#fff", marginBottom: 24, maxWidth: "18ch" }}
            >
              {headline}
            </h1>
            {lead && (
              <p className="lead" style={{ color: "rgba(255,255,255,0.75)", maxWidth: "54ch" }}>
                {lead}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Interactive dashboard (client component) ── */}
      <IntelligenceDashboard locale={locale} />
    </>
  );
}
