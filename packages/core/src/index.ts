export type {
  GenerateMode,
  GenerateRequest,
  GenerateResult,
  Provider,
  DataUrlParts,
} from "./types";
export { dataUrlParts } from "./types";

export type { StylePreset } from "./styles";
export { STYLES, ROOMS, getStyle, buildPrompt, ARCHITECTURE_LOCK } from "./styles";

export type {
  ProjectRender,
  DemoProject,
  ProjectShareLink,
  ProposalDetails,
  CreateDemoProjectInput,
  CreateProjectRenderInput,
} from "./projects";
export { createDemoProject, createProjectRender } from "./projects";

export type { ProviderFailure, ProviderFailureKind } from "./providerErrors";
export {
  classifyProviderFailure,
  friendlyProviderMessage,
} from "./providerErrors";

export { providers, getProvider } from "./providers/index";
