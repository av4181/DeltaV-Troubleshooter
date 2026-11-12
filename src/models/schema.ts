import { z } from "zod";

/**
 * Single source of truth for the knowledge model.
 * The TypeScript types in Node.ts / Answer.ts are inferred from these schemas,
 * so the JSON validation and the compiler can never disagree.
 */

/** Where in the stack the fault is located (TCP/IP-inspired, bottom to top). */
export const LAYERS = [
  "physical",
  "network",
  "transport-session",
  "application",
] as const;

/** Which inter-process / transport mechanism is really involved. */
export const MECHANISMS = [
  "roc-udp",
  "dcom-rpc",
  "shared-heap",
  "activex-ole",
  "dotnet",
  "sql",
  "opc-ua",
  "windows-os",
] as const;

/** Troubleshooting domains. Add a value here when a new knowledge file is introduced. */
export const DOMAINS = [
  "Operate",
  "Live",
  "OPC",
  "Controller",
  "I/O",
  "Network",
  "Batch",
  "EventChronicle",
  "Historian",
  "WindowsOS",
  "Runtime",
] as const;

export const RISK_LEVELS = [
  "Read Only",
  "Controlled Impact",
  "Disruptive",
] as const;

export const VARIANTS = ["success", "warning", "danger", "neutral"] as const;

export const layerSchema = z.enum(LAYERS);
export const mechanismSchema = z.enum(MECHANISMS);
export const domainSchema = z.enum(DOMAINS);
export const riskLevelSchema = z.enum(RISK_LEVELS);
export const variantSchema = z.enum(VARIANTS);

const nodeIdSchema = z.string().min(1);

export const answerSchema = z.object({
  label: z.string().min(1),
  next: nodeIdSchema,
  /** Short secondary line under the label (e.g. a KBA number or a port). */
  sub: z.string().optional(),
  variant: variantSchema.optional(),
});

/** Fields shared by every node kind. */
const baseFields = {
  id: nodeIdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  domain: domainSchema.optional(),
  layer: layerSchema.optional(),
  mechanism: mechanismSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  /** Concrete checks or actions to perform at this node. */
  actions: z.array(z.string().min(1)).optional(),
  /** Source references, e.g. KBA numbers or case numbers. */
  sources: z.array(z.string().min(1)).optional(),
  /** Set to false when a claim could not be confirmed against a source. */
  verified: z.boolean().optional(),
};

/** A decision point: the user picks one answer. */
export const questionNodeSchema = z.object({
  ...baseFields,
  type: z.literal("question"),
  answers: z.array(answerSchema).min(1),
});

/** A diagnostic step with something to do or observe before choosing an outcome. */
export const stepNodeSchema = z.object({
  ...baseFields,
  type: z.literal("step"),
  answers: z.array(answerSchema).min(1),
});

/** Explanatory content that continues to exactly one next node. */
export const infoNodeSchema = z.object({
  ...baseFields,
  type: z.literal("info"),
  next: nodeIdSchema,
  nextLabel: z.string().optional(),
});

/** Items to tick off in order, then continue. */
export const checklistNodeSchema = z.object({
  ...baseFields,
  type: z.literal("checklist"),
  items: z.array(z.string().min(1)).min(1),
  next: nodeIdSchema,
  nextLabel: z.string().optional(),
});

/** An end state: a root cause, a recommendation, or a known open issue. */
export const terminalNodeSchema = z.object({
  ...baseFields,
  type: z.literal("terminal"),
  variant: variantSchema.optional(),
});

export const nodeSchema = z.discriminatedUnion("type", [
  questionNodeSchema,
  stepNodeSchema,
  infoNodeSchema,
  checklistNodeSchema,
  terminalNodeSchema,
]);

export const knowledgeBaseSchema = z.record(z.string(), nodeSchema);

export type Layer = z.infer<typeof layerSchema>;
export type Mechanism = z.infer<typeof mechanismSchema>;
export type Domain = z.infer<typeof domainSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Node = z.infer<typeof nodeSchema>;
export type KnowledgeBase = z.infer<typeof knowledgeBaseSchema>;
