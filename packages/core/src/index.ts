export type {
  GenerateMode,
  GenerateRequest,
  GenerateResult,
  DesignBrief,
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

export type {
  ItemCategory,
  VendorKind,
  Vendor,
  CatalogItem,
  BudgetTier,
  EstimateLine,
  CostEstimate,
  EstimateInput,
} from "./catalog";
export {
  ITEM_CATEGORIES,
  BUDGET_TIERS,
  estimateForConcept,
  formatMoneyRange,
  itemsByVendor,
} from "./catalog";
export { SAMPLE_VENDORS, SAMPLE_CATALOG } from "./catalogSeed";

export type {
  CompanyTrade,
  CompanyProfile,
  OfferingStatus,
  Offering,
  LeadStatus,
  Lead,
  CreateCompanyInput,
  CreateOfferingInput,
  CreateLeadInput,
} from "./companies";
export {
  slugify,
  createCompanyProfile,
  createOffering,
  createLead,
  leadHasContact,
} from "./companies";

export type { ProviderFailure, ProviderFailureKind } from "./providerErrors";
export {
  classifyProviderFailure,
  friendlyProviderMessage,
} from "./providerErrors";

export { providers, getProvider } from "./providers/index";
