import operateData from "../knowledge/hypotheses/operate-data.json";
import serviceData from "../knowledge/hypotheses/service-wont-start.json";

import { formatIssue } from "../knowledge/validate.ts";
import { validateHypotheses } from "../hypotheses/validate.ts";
import { knownLogIds } from "./LogCatalog.ts";
import type { HypothesisFile } from "../hypotheses/schema.ts";

/** Ids of all hypothesis sets, for validating links from the tree. */
export function hypothesisSetIds(): ReadonlySet<string> {
  return new Set(loadHypothesisSets().map((set) => set.meta.id));
}

/** Loads and validates the hypothesis sets. Throws a readable list on error. */
export function loadHypothesisSets(): HypothesisFile[] {
  return [serviceData, operateData].map((raw) => {
    const result = validateHypotheses(raw, { logIds: knownLogIds() });
    for (const issue of result.issues) {
      if (issue.severity === "warning") console.warn(formatIssue(issue));
    }
    if (!result.data) {
      const details = result.issues.filter((i) => i.severity === "error").map(formatIssue).join("\n");
      throw new Error(`Invalid hypothesis set:\n${details}`);
    }
    return result.data;
  });
}
