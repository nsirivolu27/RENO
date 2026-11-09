import type { Provider } from "../types";
import { demo } from "./demo";
import { gemini } from "./gemini";
import { openai } from "./openai";
import { replicate } from "./replicate";

export const providers: Provider[] = [demo, gemini, openai, replicate];

export function getProvider(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export { demo, gemini, openai, replicate };
