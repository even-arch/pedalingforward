import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "About — Pedaling Forward" };

export default function AboutPage() {
  return (
    <>
      <div className="field-ink phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab">About</p>
          <h1 className="display">Forty years in the component trade. Now with a website.</h1>
          <div className="grid2">
            <p className="lead">
              Point Asia Co., Ltd. (律寶實業) has been bridging Taiwanese component manufacturers and the global bicycle market since 1983.
            </p>
            <p>
              We speak the factories&apos; language — literally and figuratively — and we&apos;ve spent four decades learning which ones are worth knowing. Pedaling Forward is where we put that knowledge to work.
            </p>
          </div>
        </div>
      </div>

      <section className="wrap tight">
        <div className="benefits">
          <div className="benefit">
            <h4>What this site is</h4>
            <p style={{ maxWidth: "none" }}>
              This is our editorial side. Before anyone places an order, they need to know what they&apos;re looking at. Pedaling Forward publishes test reports, factory visits, product introductions, and market notes — in English, Chinese, Japanese, and German. All content is free and public. Membership is what gets you into the group buys.
            </p>
          </div>
          <div className="benefit">
            <h4>What Patisco is</h4>
            <p style={{ maxWidth: "none" }}>
              Patisco is our commerce platform. When enough buyers express interest in a product, we open a group buy. Members place their orders through Patisco, pay in their local currency, and receive their stock shipped door-to-door from Taiwan. Patisco handles the purchasing. Pedaling Forward handles the intelligence.
            </p>
          </div>
          <div className="benefit">
            <h4>Who we are</h4>
            <p style={{ maxWidth: "none" }}>
              Point Asia Co., Ltd. was founded in 1983 in Taiwan. We work directly with component manufacturers across the island — brakes, drivetrains, wheels, accessories — and have been connecting them with shops and distributors worldwide for over forty years. Our team reads, writes, and does business in English, Traditional Chinese, Japanese, and German.
            </p>
          </div>
          <div className="benefit">
            <h4>How to reach us</h4>
            <p style={{ maxWidth: "none" }}>
              Point Asia Co., Ltd. (律寶實業), Taiwan.{" "}
              <span style={{ color: "#D5352A" }}>[Contact form — coming soon]</span>
            </p>
          </div>
        </div>
      </section>
      <div style={{ height: "80px" }} />
    </>
  );
}
