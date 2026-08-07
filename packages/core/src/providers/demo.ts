import type { GenerateRequest, GenerateResult, Provider } from "../types";
import { STYLES } from "../styles";

export const MODEL = "demo-placeholder-v1";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Clamp a single line so long text can't overflow the board width. */
function clamp(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function styleColors(styleId: string): [string, string, string, string] {
  switch (styleId) {
    case "industrial":
      return ["#1f232b", "#8c5a3c", "#c98a4b", "#d8c2a4"];
    case "japandi":
      return ["#26231f", "#8a6f52", "#d8c2a4", "#f0e6d2"];
    case "coastal":
      return ["#153447", "#98c1d9", "#f5f2ea", "#d7b98c"];
    case "luxury":
      return ["#132820", "#c9a227", "#e8e3da", "#24463b"];
    case "cyberpunk":
      return ["#0a0a12", "#ff2ec4", "#22d3ee", "#c8f7ff"];
    case "farmhouse":
      return ["#2c2924", "#a68a64", "#f0ead9", "#3b3b3b"];
    default:
      return ["#171b23", "#ff7849", "#d8c2a4", "#e9ebf1"];
  }
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export const demo: Provider = {
  id: "demo",
  name: "Demo provider",
  model: MODEL,
  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const style = STYLES.find((item) => item.id === req.style);
    const styleName = style?.name ?? req.style;
    const [bg, accent, warm, text] = styleColors(req.style);
    const modeLabel =
      req.mode === "renovate"
        ? "renovation concept"
        : "restyle concept";
    const roomLabel = escapeXml(clamp(req.room, 28));
    const notes = req.notes
      ? `Direction: ${escapeXml(clamp(req.notes, 68))}`
      : "Demo-only placeholder render";
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960" viewBox="0 0 1280 960">
  <defs>
    <linearGradient id="wall" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="0.58" stop-color="#20242e"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" x2="1">
      <stop offset="0" stop-color="#211a15"/>
      <stop offset="1" stop-color="${warm}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
  </defs>

  <rect width="1280" height="960" fill="#0f1115"/>
  <rect x="0" y="0" width="1280" height="650" fill="url(#wall)"/>
  <polygon points="0,650 1280,650 1280,960 0,960" fill="url(#floor)"/>
  <path d="M80 650 L230 350 H1050 L1200 650" fill="none" stroke="#ffffff" stroke-opacity="0.13" stroke-width="5"/>

  <rect x="860" y="118" width="265" height="245" rx="8" fill="#f7efe1" opacity="0.9"/>
  <line x1="992" y1="118" x2="992" y2="363" stroke="#80694d" stroke-width="4" opacity="0.55"/>
  <line x1="860" y1="240" x2="1125" y2="240" stroke="#80694d" stroke-width="4" opacity="0.55"/>
  <rect x="860" y="118" width="265" height="245" fill="${accent}" opacity="0.08"/>

  <rect x="120" y="128" width="330" height="230" rx="18" fill="#0b0d11" opacity="0.72" filter="url(#shadow)"/>
  <image href="${escapeXml(req.image)}" x="140" y="148" width="290" height="172" preserveAspectRatio="xMidYMid slice"/>
  <text x="140" y="342" fill="#99a1b3" font-family="Arial, sans-serif" font-size="24" font-weight="700">Original photo reference</text>

  <rect x="188" y="548" width="540" height="170" rx="26" fill="${warm}" opacity="0.92" filter="url(#shadow)"/>
  <rect x="226" y="495" width="456" height="96" rx="22" fill="${text}" opacity="0.9"/>
  <rect x="260" y="520" width="120" height="48" rx="14" fill="${accent}" opacity="0.62"/>
  <rect x="410" y="520" width="120" height="48" rx="14" fill="${bg}" opacity="0.28"/>
  <rect x="560" y="520" width="88" height="48" rx="14" fill="${warm}" opacity="0.78"/>
  <rect x="226" y="690" width="42" height="88" rx="8" fill="#111318" opacity="0.5"/>
  <rect x="648" y="690" width="42" height="88" rx="8" fill="#111318" opacity="0.5"/>

  <ellipse cx="485" cy="792" rx="390" ry="58" fill="#0b0d11" opacity="0.28"/>
  <rect x="805" y="575" width="90" height="145" rx="12" fill="${accent}" opacity="0.7"/>
  <path d="M850 585 C785 495 790 420 846 360 C905 428 913 500 850 585Z" fill="#5e8a62"/>
  <path d="M850 590 C930 520 948 445 900 383 C862 450 842 520 850 590Z" fill="#3f6f4b"/>
  <line x1="750" y1="650" x2="750" y2="395" stroke="${warm}" stroke-width="10" opacity="0.82"/>
  <circle cx="750" cy="358" r="46" fill="#ffe1a8" opacity="0.86"/>

  <rect x="126" y="78" width="830" height="46" rx="23" fill="#000000" opacity="0.52"/>
  <text x="154" y="110" fill="${accent}" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="3">DEMO ONLY</text>
  <text x="350" y="110" fill="#f4f0ea" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(clamp(styleName, 26))} ${escapeXml(modeLabel)}</text>

  <text x="116" y="858" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="800">Reno demo render</text>
  <text x="116" y="900" fill="#d4d8e2" font-family="Arial, sans-serif" font-size="26">${roomLabel} - ${notes}</text>
  <text x="116" y="932" fill="#99a1b3" font-family="Arial, sans-serif" font-size="20">No AI provider was called. Use Gemini, OpenAI, or Replicate for photoreal output.</text>
</svg>`;

    return {
      image: svgToDataUrl(svg),
      provider: this.id,
      model: MODEL,
    };
  },
};
