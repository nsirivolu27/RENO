import { geminiProvider } from "./gemini";
import { openaiProvider } from "./openai";
import { replicateProvider } from "./replicate";
import type { Provider } from "../types";

export const providers = [geminiProvider, openaiProvider, replicateProvider] as const;

export function getProvider(id: string): Provider {
  const provider = providers.find((entry) => entry.id === id);
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}
