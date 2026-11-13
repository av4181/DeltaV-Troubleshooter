import { hypothesisFileSchema } from "./schema.ts";
import type { HypothesisFile } from "./schema.ts";
import type { ValidationIssue } from "../knowledge/validate.ts";

export interface HypothesisValidation {
  data?: HypothesisFile;
  issues: ValidationIssue[];
  ok: boolean;
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dup.add(id);
    seen.add(id);
  }
  return [...dup];
}

/** Structure first, then cross references between observations and hypotheses. */
export function validateHypotheses(raw: unknown): HypothesisValidation {
  const issues: ValidationIssue[] = [];

  const parsed = hypothesisFileSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({ severity: "error", message: `${issue.path.join(".")}: ${issue.message}` });
    }
    return { issues, ok: false };
  }

  const data = parsed.data;
  const hypothesisIds = new Set(data.hypotheses.map((h) => h.id));

  for (const id of duplicates(data.hypotheses.map((h) => h.id))) {
    issues.push({ severity: "error", nodeId: id, message: "Duplicate hypothesis id." });
  }
  for (const id of duplicates(data.observations.map((o) => o.id))) {
    issues.push({ severity: "error", nodeId: id, message: "Duplicate observation id." });
  }

  const influenced = new Set<string>();

  for (const observation of data.observations) {
    for (const id of duplicates(observation.options.map((o) => o.id))) {
      issues.push({
        severity: "error",
        nodeId: observation.id,
        message: `Duplicate option id "${id}".`,
      });
    }

    for (const option of observation.options) {
      for (const id of duplicates(option.effects.map((e) => e.hypothesis))) {
        issues.push({
          severity: "error",
          nodeId: observation.id,
          message: `Option "${option.id}" has more than one effect on "${id}".`,
        });
      }
      for (const effect of option.effects) {
        if (!hypothesisIds.has(effect.hypothesis)) {
          issues.push({
            severity: "error",
            nodeId: observation.id,
            message: `Option "${option.id}" refers to unknown hypothesis "${effect.hypothesis}".`,
          });
        } else {
          influenced.add(effect.hypothesis);
        }
      }
    }

    const discriminates = observation.options.some((option) => option.effects.length > 0);
    if (!discriminates) {
      issues.push({
        severity: "warning",
        nodeId: observation.id,
        message: "No option has an effect, so this observation can never change the ranking.",
      });
    }
  }

  for (const hypothesis of data.hypotheses) {
    if (!influenced.has(hypothesis.id)) {
      issues.push({
        severity: "warning",
        nodeId: hypothesis.id,
        message: "No observation influences this hypothesis; it can never be ranked or excluded.",
      });
    }
  }

  const ok = !issues.some((issue) => issue.severity === "error");
  return { data: ok ? data : undefined, issues, ok };
}
