import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "For Bike Shops — Pedaling Forward" };

export default function ShopsPage() {
  return (
    <>
      <div className="field-ink phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab">For bike shops</p>
          <h1 className="display">Carry components you can actually stand behind.</h1>
          <div className="grid2">
            <p className="lead">
              You&apos;ve spent years building trust with your customers. The last thing you want is to sell them something that fails — and already know where it came from.
            </p>
            <p>
              Taiwan&apos;s component manufacturers have been supplying the world&apos;s best bikes for decades. The problem has never been quality. It&apos;s been access.
            </p>
          </div>
        </div>
      </div>

      <dl className="spec">
        <div><dt>Membership</dt><dd>Free</dd></div>
        <div><dt>To apply</dt><dd>Company + email</dd></div>
        <div><dt>Articles</dt><dd>Open to all</dd></div>
        <div><dt>Payment</dt><dd>Local currency</dd></div>
        <div><dt>Delivery</dt><dd>Door to door</dd></div>
      </dl>

      <section className="wrap tight">
        <h2 className="display" style={{ marginBottom: "40px" }}>What you get</h2>
        <div className="benefits">
          <div className="benefit">
            <h4>Verified Taiwan components, properly explained</h4>
            <p>Test reports and product introductions before you commit to any stock. Know exactly what you&apos;re buying and who makes it.</p>
          </div>
          <div className="benefit">
            <h4>Early access to group buys</h4>
            <p>Members see new group buys before they open. Express interest early — we&apos;ll notify you when the order is live on Patisco.</p>
          </div>
          <div className="benefit">
            <h4>Direct Taiwan pricing</h4>
            <p>No sub-distributors, no inflated catalog prices. Group buys aggregate your order with other shops so you hit the minimum quantity without buying more than you need.</p>
          </div>
          <div className="benefit">
            <h4>Door-to-door delivery, pay locally</h4>
            <p>Your stock ships from Taiwan direct to your door. Payment is handled in your local currency through Patisco.</p>
          </div>
        </div>
      </section>

      <section className="wrap tight" style={{ paddingTop: 0 }}>
        <h2 className="display" style={{ marginBottom: "36px" }}>How it works for shops</h2>
        <div className="steps">
          <div className="step">
            <div className="num">01</div>
            <h4>Read</h4>
            <p>Test reports, product introductions, factory stories. Free and public, no account needed.</p>
          </div>
          <div className="step">
            <div className="num">02</div>
            <h4>Apply</h4>
            <p>Membership is free. Our team at Point Asia reviews every application.</p>
          </div>
          <div className="step">
            <div className="num">03</div>
            <h4>Express interest</h4>
            <p>Flag the products you&apos;d like to carry.</p>
          </div>
          <div className="step">
            <div className="num">04</div>
            <h4>Group buy opens</h4>
            <p>When demand is confirmed, the order goes live on Patisco.</p>
          </div>
          <div className="step">
            <div className="num">05</div>
            <h4>Order &amp; receive</h4>
            <p>Order, pay locally, and receive your stock.</p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="field-red ctablock">
          <h2 className="display">Apply as a shop member</h2>
          <a className="btn on-red" href="#">Start the application →</a>
          <p className="fine">Membership is free. Applications are reviewed by our team at Point Asia.</p>
        </div>
      </div>
      <div style={{ height: "80px" }} />
    </>
  );
}
