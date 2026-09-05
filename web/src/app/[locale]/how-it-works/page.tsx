import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "How It Works — Pedaling Forward" };

export default function HowItWorksPage() {
  return (
    <>
      <div className="field-red phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab" style={{ color: "rgba(255,255,255,.82)" }}>How it works</p>
          <h1 className="display">From Taiwan factory to your shop floor.</h1>
        </div>
      </div>

      <section className="wrap">
        <div className="steps rowy">
          <div className="step">
            <div className="num">01</div>
            <div>
              <h4>Read</h4>
              <p>Pedaling Forward publishes test reports, product introductions, factory visits, and market notes. All content is free and public — no account required.</p>
            </div>
          </div>
          <div className="step">
            <div className="num">02</div>
            <div>
              <h4>Join</h4>
              <p>Apply for a free membership. Our team at Point Asia Co., Ltd. reviews every application personally. We&apos;re looking for shop owners, buyers, mechanics, and distributors who work professionally with bicycle components.</p>
            </div>
          </div>
          <div className="step">
            <div className="num">03</div>
            <div>
              <h4>Express interest</h4>
              <p>See a product worth carrying? Hit &quot;Express Interest.&quot; When enough members flag the same product, we know there&apos;s real demand — and we go to work on the supplier side.</p>
            </div>
          </div>
          <div className="step">
            <div className="num">04</div>
            <div>
              <h4>Group buy opens</h4>
              <p>When demand is confirmed, a group buy opens on Patisco. You&apos;ll see the price, the minimum quantity, and the lead time. No obligation — you decide if it works for your business.</p>
            </div>
          </div>
          <div className="step">
            <div className="num">05</div>
            <div>
              <h4>Order and receive</h4>
              <p>Place your order on Patisco. Pay in your local currency. Your stock ships door-to-door from Taiwan.</p>
            </div>
          </div>
        </div>

        <p className="lab dim" style={{ marginTop: "34px", letterSpacing: ".08em", lineHeight: "1.9", maxWidth: "74ch", textTransform: "none" }}>
          Articles are free and public. Group buy participation requires a free membership. All applications are reviewed by our team.
        </p>
      </section>
    </>
  );
}
