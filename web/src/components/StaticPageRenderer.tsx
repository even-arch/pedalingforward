import { BrandMark } from "@/components/BrandMark";
import { loc } from "@/lib/locale";
import { type StaticPageData, type PageSection } from "@/lib/staticPage";

type Props = { page: StaticPageData; locale: string };

export function StaticPageRenderer({ page, locale }: Props) {
  const l = (f?: { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null } | null) =>
    loc(f, locale) ?? "";

  const heroClass = page?.heroStyle === "red" ? "field-red" : "field-ink";
  const eyebrowStyle = page?.heroStyle === "red" ? { color: "rgba(255,255,255,.82)" } : undefined;

  return (
    <>
      <div className={`${heroClass} phead`}>
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab" style={eyebrowStyle}>{l(page?.heroEyebrow)}</p>
          <h1 className="display">{l(page?.heroHeadline)}</h1>
          {(page?.heroLead || page?.heroBody) && (
            <div className="grid2">
              {page?.heroLead && <p className="lead">{l(page.heroLead)}</p>}
              {page?.heroBody && <p>{l(page.heroBody)}</p>}
            </div>
          )}
        </div>
      </div>

      {page?.specItems && page.specItems.length > 0 && (
        <dl className="spec">
          {page.specItems.map((item) => (
            <div key={item._key}><dt>{l(item.label)}</dt><dd>{l(item.value)}</dd></div>
          ))}
        </dl>
      )}

      {page?.sections?.map((section) => (
        <PageSection key={section._key} section={section} locale={locale} />
      ))}

      <div style={{ height: "80px" }} />
    </>
  );
}

function PageSection({ section, locale }: { section: PageSection; locale: string }) {
  const l = (f?: { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null } | null) =>
    loc(f, locale) ?? "";

  if (section._type === "benefitsSection") {
    return (
      <section className="wrap tight">
        {l(section.heading) && <h2 className="display" style={{ marginBottom: "40px" }}>{l(section.heading)}</h2>}
        <div className="benefits">
          {section.items?.map((item) => (
            <div key={item._key} className="benefit">
              <h4>{l(item.title)}</h4>
              <p style={{ maxWidth: "none" }}>{l(item.body)}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section._type === "stepsSection") {
    const isRowy = !section.heading || !l(section.heading);
    return (
      <section className={`wrap${isRowy ? "" : " tight"}`} style={isRowy ? undefined : { paddingTop: 0 }}>
        {l(section.heading) && <h2 className="display" style={{ marginBottom: "36px" }}>{l(section.heading)}</h2>}
        <div className={`steps${isRowy ? " rowy" : ""}`}>
          {section.items?.map((item, i) => (
            <div key={item._key} className="step">
              <div className="num">{String(i + 1).padStart(2, "0")}</div>
              {isRowy ? (
                <div><h4>{l(item.title)}</h4><p>{l(item.body)}</p></div>
              ) : (
                <><h4>{l(item.title)}</h4><p>{l(item.body)}</p></>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section._type === "proseSection") {
    return (
      <section className="wrap tight">
        {l(section.heading) && <h2 className="display" style={{ marginBottom: "30px" }}>{l(section.heading)}</h2>}
        <div className="prose">
          {section.paragraphs?.map((p) => <p key={p._key}>{l(p.text)}</p>)}
        </div>
      </section>
    );
  }

  if (section._type === "ctaSection") {
    return (
      <div className="wrap">
        <div className="field-red ctablock">
          <h2 className="display">{l(section.heading)}</h2>
          <a className="btn on-red" href={section.href ?? "#"}>{l(section.buttonLabel)}</a>
          <p className="fine">{l(section.finePrint)}</p>
        </div>
      </div>
    );
  }

  if (section._type === "noteSection") {
    return (
      <p className="lab dim" style={{ marginTop: "34px", letterSpacing: ".08em", lineHeight: "1.9", maxWidth: "74ch", textTransform: "none" }}>
        {l(section.text)}
      </p>
    );
  }

  return null;
}
