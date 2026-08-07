/**
 * Resolves the public base URL used for links we hand to clients.
 *
 * Share links get emailed, so `http://localhost:3000/r/...` is useless once you
 * deploy. `NEXT_PUBLIC_APP_URL` is the source of truth when set (it is baked in
 * at build time and works on both server and client). Otherwise we fall back to
 * the browser's current origin, which is correct for local dev.
 */

const CONFIGURED = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");

/** True when a public URL is configured — emailed links will be correct. */
export function hasConfiguredAppUrl(): boolean {
  return CONFIGURED.length > 0;
}

/** Base origin without a trailing slash, or "" if unknown (SSR, unconfigured). */
export function appBaseUrl(): string {
  if (CONFIGURED) return CONFIGURED;
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

/** Turns a relative path like `/r/abc` into an absolute, shareable URL. */
export function absoluteUrl(path: string): string {
  const base = appBaseUrl();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${suffix}` : suffix;
}

/** True when the resolved base points at localhost / a private address. */
export function isLocalBaseUrl(): boolean {
  const base = appBaseUrl();
  if (!base) return true;
  return /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/i.test(base);
}
