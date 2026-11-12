// Types are inferred from the Zod schema in ./schema.ts (single source of truth).
export type {
  Node,
  Layer,
  Mechanism,
  Domain,
  RiskLevel,
  Variant,
} from "./schema.ts";

export {
  LAYERS,
  MECHANISMS,
  DOMAINS,
  RISK_LEVELS,
  VARIANTS,
} from "./schema.ts";
