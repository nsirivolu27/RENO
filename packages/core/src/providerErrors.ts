/**
 * Turns raw provider/API failures into short, actionable messages.
 *
 * Providers throw whatever their API returned ("Gemini request failed (429):
 * RESOURCE_EXHAUSTED ..."), which is accurate but not useful to someone trying
 * to render a client's living room. This maps the common cases to plain
 * language plus the next step. Unknown errors pass through unchanged so we
 * never hide real detail.
 */

export type ProviderFailureKind =
  | "quota"
  | "auth"
  | "access"
  | "rate_limit"
  | "network"
  | "safety"
  | "unknown";

export interface ProviderFailure {
  kind: ProviderFailureKind;
  message: string;
}

function providerLabel(providerId: string): string {
  switch (providerId) {
    case "gemini":
      return "Google Gemini";
    case "openai":
      return "OpenAI";
    case "replicate":
      return "Replicate";
    default:
      return providerId;
  }
}

/** Provider-specific next step for a quota/billing problem. */
function quotaHint(providerId: string): string {
  switch (providerId) {
    case "gemini":
      return "Google often grants image models 0 quota on free keys. Enable billing on the Google AI Studio / Cloud project, or switch provider.";
    case "openai":
      return "gpt-image-1 requires a funded OpenAI account with organization verification. Add credit or verify your org, then retry.";
    case "replicate":
      return "Replicate requires a payment method before it will run predictions. Add billing, then retry.";
    default:
      return "Check the provider dashboard for quota or billing limits.";
  }
}

export function classifyProviderFailure(
  providerId: string,
  raw: string
): ProviderFailure {
  const text = raw.toLowerCase();
  const label = providerLabel(providerId);

  if (
    text.includes("resource_exhausted") ||
    text.includes("quota") ||
    text.includes("insufficient_quota") ||
    text.includes("billing") ||
    text.includes("exceeded your current")
  ) {
    return {
      kind: "quota",
      message: `${label} rejected the render for quota or billing reasons. ${quotaHint(providerId)} You can also switch to the Demo provider to keep working without a key.`,
    };
  }

  if (
    text.includes("401") ||
    text.includes("unauthorized") ||
    text.includes("api key not valid") ||
    text.includes("invalid api key") ||
    text.includes("invalid_api_key") ||
    text.includes("authentication")
  ) {
    return {
      kind: "auth",
      message: `${label} did not accept that API key. Check it was copied in full and belongs to an account with image generation enabled.`,
    };
  }

  if (
    text.includes("403") ||
    text.includes("permission") ||
    text.includes("not verified") ||
    text.includes("must be verified") ||
    text.includes("access denied")
  ) {
    return {
      kind: "access",
      message: `${label} refused access to this model. The account may need verification or the model may not be enabled for it. ${quotaHint(providerId)}`,
    };
  }

  if (text.includes("429") || text.includes("rate limit") || text.includes("too many requests")) {
    return {
      kind: "rate_limit",
      message: `${label} is rate limiting requests. Wait a few seconds and try again.`,
    };
  }

  if (
    text.includes("safety") ||
    text.includes("blocked") ||
    text.includes("content policy") ||
    text.includes("prohibited")
  ) {
    return {
      kind: "safety",
      message: `${label} blocked this image or prompt by its content filters. Try a different photo or simpler notes.`,
    };
  }

  if (
    text.includes("fetch failed") ||
    text.includes("etimedout") ||
    text.includes("enotfound") ||
    text.includes("econnrefused") ||
    text.includes("network") ||
    text.includes("timeout")
  ) {
    return {
      kind: "network",
      message: `Could not reach ${label}. Check your internet connection or proxy and try again.`,
    };
  }

  return { kind: "unknown", message: raw };
}

/** Convenience wrapper returning just the message. */
export function friendlyProviderMessage(providerId: string, raw: string): string {
  return classifyProviderFailure(providerId, raw).message;
}
