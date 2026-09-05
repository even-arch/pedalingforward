import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "For Distributors — Pedaling Forward" };

export default function DistributorsPage() {
  return (
    <>
      <div className="field-ink phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab">For distributors</p>
          <h1 className="display">Better products. Better margin. Less guesswork.</h1>
          <div className="grid2">
            <p className="lead">
              You know what your retailers want. They&apos;re asking for more variety, better quality, and margins that make sense.
            </p>
            <p>
              The answer is usually somewhere in Taiwan — the question is how to get there without adding another layer in the middle.
            </p>
          </div>
        </div>
      </div>

      <section className="wrap tight">
        <h2 className="display" style={{ marginBottom: "30px" }}>What changes</h2>
        <div className="prose">
          <p>
            Pedaling Forward connects you directly to verified Taiwan suppliers. Group buys on Patisco let you consolidate orders from your retailers into a single purchase — hitting the minimum quantity without carrying the inventory risk alone.
          </p>
          <p>
            Payment is local. Delivery is door-to-door. No freight forwarding, no customs brokerage on your end.
          </p>
        </div>
      </section>

      <section className="wrap tight" style={{ paddingTop: 0 }}>
        <h2 className="display" style={{ marginBottom: "40px" }}>What you get</h2>
        <div className="benefits">
          <div className="benefit">
            <h4>Direct Taiwan supplier access</h4>
            <p>Relationships built over 40 years of component trade — vetted, reliable, and ready to work with overseas distributors.</p>
          </div>
          <div className="benefit">
            <h4>Consolidated ordering</h4>
            <p>Aggregate your retailers&apos; demand into one group buy. One shipment, one payment, one contact.</p>
          </div>
          <div className="benefit">
            <h4>Better margin</h4>
            <p>Fewer hands between the factory and your warehouse. The math works differently when you buy closer to the source.</p>
          </div>
          <div className="benefit">
            <h4>Pay locally, receive door-to-door</h4>
            <p>Patisco handles the transaction in your local currency. Your stock ships direct from Taiwan to your door.</p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="field-red ctablock">
          <h2 className="display">Apply as a distributor</h2>
          <a className="btn on-red" href="#">Start the application →</a>
          <p className="fine">Applications are reviewed by our team at Point Asia.</p>
        </div>
      </div>
      <div style={{ height: "80px" }} />
    </>
  );
}
