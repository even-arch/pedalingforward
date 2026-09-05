import Link from "next/link";
import { loc } from "@/lib/locale";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };
type Props = { locale: string; headline?: LocalizedStr | null; subtext?: LocalizedStr | null };

const JOIN_ROWS = [
  {
    key: "shops",
    label: "For bike shops",
    copy: "I want to carry components I can actually trust and be able to offer them.",
  },
  {
    key: "suppliers",
    label: "For suppliers",
    copy: "We have been offering quality components for decades, and we want to make them available to bike shops around the world.",
  },
  {
    key: "distributors",
    label: "For distributors",
    copy: "Our retailers want better options. So do we.",
  },
];

export function JoinStrip({ locale, headline, subtext }: Props) {
  return (
    <section className="field-red">
      <div className="wrap">
        <p className="lab" style={{ color: "rgba(255,255,255,.8)", marginBottom: "26px" }}>
          Join the network
        </p>
        <h2 className="display">
          {loc(headline, locale) ?? "The trade source for shops, suppliers, and distributors."}
        </h2>
        <p className="lead" style={{ marginTop: "24px", color: "rgba(255,255,255,.92)" }}>
          {loc(subtext, locale) ??
            "Join at no cost. Patisco handles the purchasing — this site handles the intelligence."}
        </p>

        <div className="rows">
          {JOIN_ROWS.map((row) => (
            <Link key={row.key} href={`/${locale}/${row.key}`} className="row">
              <span className="lab">{row.label}</span>
              <span className="cp">{row.copy}</span>
              <span className="ar" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
