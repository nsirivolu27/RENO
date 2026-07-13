import Link from "next/link";

const steps = ["Upload a room photo", "Choose room, style, and mode", "Generate, compare, download"];
const plans = [
  { name: "Free", price: "3 renders", text: "Hosted trial credits for quick experiments." },
  { name: "Credit packs", price: "$9 per 30", text: "Pay as you go when you need more hosted renders." },
  { name: "Self-host", price: "Free forever", text: "MIT licensed, BYO keys, and no paid OpenReno services required." }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <strong>OpenReno</strong>
          <Link href="/studio">Studio</Link>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">Open-source AI renovation</p>
            <h1>Photorealistic room redesigns from one photo.</h1>
            <p className="lede">
              Upload a home or corporate space, pick a style, and generate a realistic restyle or full renovation for personal planning or client-ready renovation demos.
            </p>
            <Link className="button primary" href="/studio">Start rendering</Link>
          </div>
          <div className="heroPreview" aria-label="Before and after room preview">
            <div className="roomPane before">
              <span>Before</span>
            </div>
            <div className="roomPane after">
              <span>After</span>
            </div>
          </div>
        </div>
      </section>
      <section className="band">
        <h2>How It Works</h2>
        <div className="cards">
          {steps.map((step, index) => (
            <article className="card" key={step}>
              <span className="step">{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>
      <section className="band">
        <h2>Pricing</h2>
        <div className="cards">
          {plans.map((plan) => (
            <article className="card" key={plan.name}>
              <h3>{plan.name}</h3>
              <p className="price">{plan.price}</p>
              <p>{plan.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
