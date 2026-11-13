import { z } from "zod";

import {
  domainSchema,
  layerSchema,
  mechanismSchema,
  riskLevelSchema,
} from "../models/schema.ts";

/**
 * Hypothesis-driven model: instead of a fixed path, the user records
 * observations and the engine ranks and eliminates hypotheses.
 *
 * Plausibility is ordinal on purpose. The knowledge sources (KBAs) give no
 * frequencies, so percentages would suggest a precision that does not exist.
 */
export const PLAUSIBILITIES = ["likely", "possible", "unlikely"] as const;
export const EFFECTS = ["supports", "weakens", "excludes"] as const;
export const STRENGTHS = ["weak", "strong"] as const;
export const COSTS = ["low", "medium", "high"] as const;

const idSchema = z.string().min(1);

export const effectSchema = z
  .object({
    hypothesis: idSchema,
    effect: z.enum(EFFECTS),
    /** Required for supports/weakens, ignored for excludes. */
    strength: z.enum(STRENGTHS).optional(),
    /** Required for excludes: the logical reason this is a hard elimination. */
    because: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.effect === "excludes" && !value.because) {
      ctx.addIssue({
        code: "custom",
        message: "An 'excludes' effect must state why (field 'because').",
      });
    }
    if (value.effect !== "excludes" && !value.strength) {
      ctx.addIssue({
        code: "custom",
        message: "A 'supports' or 'weakens' effect needs a 'strength'.",
      });
    }
  });

export const optionSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  /** Empty means: this answer does not discriminate between hypotheses. */
  effects: z.array(effectSchema),
});

export const observationSchema = z.object({
  id: idSchema,
  question: z.string().min(1),
  /** How to find the answer (tool, path, command). */
  howTo: z.string().optional(),
  cost: z.enum(COSTS),
  risk: riskLevelSchema,
  options: z.array(optionSchema).min(2),
  sources: z.array(z.string().min(1)).optional(),
  verified: z.boolean().optional(),
});

export const hypothesisSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  domain: domainSchema.optional(),
  layer: layerSchema.optional(),
  mechanism: mechanismSchema.optional(),
  prior: z.enum(PLAUSIBILITIES),
  /** What to do when this hypothesis holds. */
  actions: z.array(z.string().min(1)).optional(),
  sources: z.array(z.string().min(1)).min(1),
  verified: z.boolean().optional(),
});

export const hypothesisFileSchema = z.object({
  meta: z.object({
    id: idSchema,
    title: z.string().min(1),
    /** False until a domain expert has reviewed the priors. Shown in the UI. */
    priorsReviewed: z.boolean(),
  }),
  hypotheses: z.array(hypothesisSchema).min(2),
  observations: z.array(observationSchema).min(1),
});

export type Plausibility = (typeof PLAUSIBILITIES)[number];
export type EffectKind = (typeof EFFECTS)[number];
export type Strength = (typeof STRENGTHS)[number];
export type Cost = (typeof COSTS)[number];
export type Effect = z.infer<typeof effectSchema>;
export type Option = z.infer<typeof optionSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type Hypothesis = z.infer<typeof hypothesisSchema>;
export type HypothesisFile = z.infer<typeof hypothesisFileSchema>;
