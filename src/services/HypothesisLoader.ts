import operateData from "../knowledge/hypotheses/operate-data.json";

import { formatIssue } from "../knowledge/validate.ts";
import { validateHypotheses } from "../hypotheses/validate.ts";
import type { HypothesisFile } from "../hypotheses/schema.ts";

/** Loads and validates the hypothesis sets. Throws a readable list on error. */
export function loadHypothesisSets(): HypothesisFile[] {
  return [operateData].map((raw) => {
    const result = validateHypotheses(raw);
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
