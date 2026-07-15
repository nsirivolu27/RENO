import type { Provider } from "../types";
import { gemini } from "./gemini";
import { openai } from "./openai";
import { replicate } from "./replicate";

export const providers: Provider[] = [gemini, openai, replicate];

export function getProvider(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export { gemini, openai, replicate };
