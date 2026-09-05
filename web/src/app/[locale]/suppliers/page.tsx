import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "For Suppliers — Pedaling Forward" };

export default function SuppliersPage() {
  return (
    <>
      <div className="field-ink phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab">For suppliers</p>
          <h1 className="display">Your components deserve a wider audience.</h1>
          <div className="grid2">
            <p className="lead">
              You&apos;ve been making quality parts for decades. Some of the world&apos;s best-known bikes have your components inside them — they just don&apos;t say so.
            </p>
            <p>
              Independent shops worldwide would carry your products if they could find them, verify them, and order them in quantities that make sense.
            </p>
          </div>
        </div>
      </div>

      <dl className="spec">
        <div><dt>You set</dt><dd>Price · MOQ · Lead time</dd></div>
        <div><dt>We write in</dt><dd>EN · 中 · 日 · DE</dd></div>
        <div><dt>Buyers</dt><dd>Verified trade only</dd></div>
        <div><dt>Orders</dt><dd>Aggregated</dd></div>
      </dl>

      <section className="wrap tight">
        <h2 className="display" style={{ marginBottom: "30px" }}>The gap we close</h2>
        <div className="prose">
          <p>
            Reaching overseas independent shops is expensive and complicated. Minimum order quantities, language barriers, and distribution layers eat into margin before the first unit ships.
          </p>
          <p>
            Pedaling Forward introduces your components to an audience of verified shop owners, buyers, and distributors who are actively looking for better sourcing options. When interest is high enough, Patisco aggregates the orders — so you hit your MOQ without negotiating with dozens of shops one at a time.
          </p>
        </div>
      </section>

      <section className="wrap tight" style={{ paddingTop: 0 }}>
        <h2 className="display" style={{ marginBottom: "40px" }}>What you get</h2>
        <div className="benefits">
          <div className="benefit">
            <h4>Editorial exposure in four languages</h4>
            <p>We write about your products in English, Chinese, Japanese, and German — test reports, spec breakdowns, and factory context that helps buyers understand what they&apos;re looking at.</p>
          </div>
          <div className="benefit">
            <h4>Demand aggregation</h4>
            <p>Orders come in as a group buy, not one small purchase at a time. You set the price, MOQ, and lead time. We handle the buyer side.</p>
          </div>
          <div className="benefit">
            <h4>Qualified buyers only</h4>
            <p>Every member is verified by our team at Point Asia. You&apos;re talking to trade professionals — shop owners, buyers, distributors.</p>
          </div>
          <div className="benefit">
            <h4>You stay in control</h4>
            <p>You set the terms. We facilitate the connection and handle order logistics through Patisco.</p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="field-red ctablock">
          <h2 className="display">List your products</h2>
          <a className="btn on-red" href="#">Talk to us →</a>
          <p className="fine">We&apos;re selective about what we feature. If your products are worth knowing, we&apos;d like to hear from you.</p>
        </div>
      </div>
      <div style={{ height: "80px" }} />
    </>
  );
}
