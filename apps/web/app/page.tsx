import Link from "next/link";

/** Simple line-art room used in the before/after proof panel. */
function RoomBefore() {
  return (
    <svg viewBox="0 0 320 220" role="img" aria-label="Plain living room before redesign" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="220" fill="#171b23" />
      {/* floor */}
      <rect y="160" width="320" height="60" fill="#1f242f" />
      {/* window */}
      <rect x="200" y="34" width="86" height="70" rx="2" fill="#232a38" stroke="#39404f" />
      <line x1="243" y1="34" x2="243" y2="104" stroke="#39404f" />
      <line x1="200" y1="69" x2="286" y2="69" stroke="#39404f" />
      {/* plain sofa */}
      <rect x="36" y="112" width="120" height="42" rx="6" fill="#2a303d" />
      <rect x="36" y="94" width="120" height="26" rx="6" fill="#323947" />
      <rect x="40" y="150" width="8" height="12" fill="#232a38" />
      <rect x="144" y="150" width="8" height="12" fill="#232a38" />
      {/* bare wall + small frame */}
      <rect x="70" y="46" width="30" height="24" fill="#232a38" stroke="#39404f" />
      {/* box clutter */}
      <rect x="222" y="132" width="34" height="28" fill="#262c38" />
      <rect x="230" y="112" width="26" height="20" fill="#222835" />
    </svg>
  );
}

function RoomAfter() {
  return (
    <svg viewBox="0 0 320 220" role="img" aria-label="Same living room after a Japandi restyle" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="220" fill="#1a1d20" />
      {/* floor (same geometry, warmer) */}
      <rect y="160" width="320" height="60" fill="#2b241c" />
      {/* same window */}
      <rect x="200" y="34" width="86" height="70" rx="2" fill="#3a3227" stroke="#6b5d49" />
      <line x1="243" y1="34" x2="243" y2="104" stroke="#6b5d49" />
      <line x1="200" y1="69" x2="286" y2="69" stroke="#6b5d49" />
      {/* warm glow from window */}
      <rect x="200" y="34" width="86" height="70" fill="#ff7849" opacity="0.08" />
      {/* styled sofa, same footprint */}
      <rect x="36" y="112" width="120" height="42" rx="6" fill="#8a6f52" />
      <rect x="36" y="94" width="120" height="26" rx="6" fill="#a5876a" />
      <rect x="48" y="100" width="26" height="16" rx="4" fill="#d9c3a5" />
      <rect x="82" y="100" width="26" height="16" rx="4" fill="#c2946b" />
      <rect x="40" y="150" width="8" height="12" fill="#5c4a36" />
      <rect x="144" y="150" width="8" height="12" fill="#5c4a36" />
      {/* rug */}
      <ellipse cx="110" cy="176" rx="86" ry="16" fill="#3d332a" />
      {/* art */}
      <rect x="62" y="42" width="46" height="32" fill="#2e281f" stroke="#8a6f52" />
      <circle cx="85" cy="58" r="10" fill="#ff7849" opacity="0.7" />
      {/* plant replacing the boxes */}
      <rect x="232" y="140" width="16" height="20" fill="#4a3a2a" />
      <path d="M240 140 C 228 122, 236 112, 240 104 C 244 112, 252 122, 240 140 Z" fill="#4f7a52" />
      <path d="M240 140 C 224 130, 220 118, 226 110 C 234 118, 238 128, 240 140 Z" fill="#3f6644" />
      <path d="M240 140 C 256 130, 260 118, 254 110 C 246 118, 242 128, 240 140 Z" fill="#3f6644" />
      {/* floor lamp */}
      <line x1="186" y1="160" x2="186" y2="112" stroke="#8a6f52" strokeWidth="3" />
      <circle cx="186" cy="106" r="9" fill="#ffd9a8" opacity="0.9" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="logo-hero">
          Re<span>no</span>
        </div>
        <p className="tagline">
          Reno helps homeowners imagine better spaces and helps renovation
          professionals turn design ideas into client-ready visual demos.
        </p>
        <div className="hero-ctas">
          <Link href="/studio" className="btn btn-primary">
            Open Studio
          </Link>
          <Link href="/projects" className="btn">
            Client demo projects
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="proof-heading">
        <h2 id="proof-heading">One photo in, a client-ready concept out</h2>
        <p className="section-sub">
          Upload a real photo of a room or workspace. Reno keeps the
          architecture — camera angle, windows, dimensions — and redesigns
          everything else.
        </p>

        <div className="proof-grid">
          <div className="proof-panel">
            <div className="ba-preview">
              <figure>
                <RoomBefore />
                <figcaption>Before</figcaption>
              </figure>
              <figure className="after">
                <RoomAfter />
                <figcaption>After</figcaption>
              </figure>
            </div>
            <div className="panel-caption">
              <span>Living room — Japandi restyle</span>
              <span>Same walls, windows, and camera angle</span>
            </div>
          </div>

          <div className="proof-panel">
            <div className="panel-body">
              <h3>The professional workflow</h3>
              <ol className="workflow-steps">
                <li>
                  <span className="step-n">1</span>
                  <span>
                    <b>Create a demo project</b> — client name, space type,
                    materials and constraints.
                  </span>
                </li>
                <li>
                  <span className="step-n">2</span>
                  <span>
                    <b>Generate concepts in Studio</b> — project direction is
                    applied to every render automatically.
                  </span>
                </li>
                <li>
                  <span className="step-n">3</span>
                  <span>
                    <b>Save and favorite</b> the strongest options with full
                    before/after comparisons.
                  </span>
                </li>
                <li>
                  <span className="step-n">4</span>
                  <span>
                    <b>Present or print</b> a clean demo view — export the
                    project as JSON or a proposal-ready PDF.
                  </span>
                </li>
              </ol>
            </div>
            <div className="panel-caption">
              <span>Everything stays on your device — local-first</span>
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="stat-big">3 free renders</div>
            <div className="stat-label">to try hosted mode — no account</div>
          </div>
          <div className="stat">
            <div className="stat-big">10 design styles</div>
            <div className="stat-label">from Japandi to industrial, all editable</div>
          </div>
          <div className="stat">
            <div className="stat-big">Client demo projects</div>
            <div className="stat-label">save, favorite, present, export</div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <p className="section-sub">
          Restyle swaps furniture and decor while keeping every built surface.
          Renovate goes further — flooring, walls, cabinetry, and finishes.
        </p>
        <div className="how-grid">
          <div className="how-step">
            <span className="step-n">01</span>
            <h3>Upload a photo</h3>
            <p>Any residential or corporate space, straight from your phone or camera roll.</p>
          </div>
          <div className="how-step">
            <span className="step-n">02</span>
            <h3>Pick room &amp; style</h3>
            <p>Choose the space type, a style preset, and restyle or full renovate.</p>
          </div>
          <div className="how-step">
            <span className="step-n">03</span>
            <h3>Add direction</h3>
            <p>Optional notes: materials, budget constraints, client taste, must-keeps.</p>
          </div>
          <div className="how-step">
            <span className="step-n">04</span>
            <h3>Generate &amp; compare</h3>
            <p>Photorealistic result with a before/after slider. Download or save to a project.</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading">Open core, honest pricing</h2>
        <p className="section-sub">
          Hosted mode uses our provider keys and credits. Or self-host with
          your own API key — free, unlimited, no account.
        </p>
        <div className="pricing-grid">
          <div className="price-card">
            <h3>Free</h3>
            <div className="price">$0</div>
            <ul>
              <li>3 free renders on hosted keys</li>
              <li>All 10 styles, both modes</li>
              <li>Local demo projects included</li>
            </ul>
            <Link href="/studio" className="btn">
              Try it now
            </Link>
          </div>
          <div className="price-card highlight">
            <h3>Credit packs</h3>
            <div className="price">
              $9 <small>/ 30 renders</small>
            </div>
            <ul>
              <li>Hosted provider keys, no setup</li>
              <li>Credits never expire</li>
              <li>Spent only on successful renders</li>
            </ul>
            <Link href="/studio" className="btn btn-primary">
              Start rendering
            </Link>
          </div>
          <div className="price-card">
            <h3>Self-host</h3>
            <div className="price">
              Free <small>forever</small>
            </div>
            <ul>
              <li>MIT licensed, run it anywhere</li>
              <li>Bring your own Gemini / OpenAI / Replicate key</li>
              <li>Unlimited renders, zero Reno services</li>
            </ul>
            <a
              href="https://github.com/nsirivolu27/RENO"
              className="btn"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
