import operateData from "../knowledge/operate.json";

import { formatIssue, validateKnowledge } from "../knowledge/validate.ts";
import type { KnowledgeBase } from "../types/KnowledgeBase.ts";

/**
 * Loads and validates the knowledge base.
 * Throws with a readable list of problems instead of failing later on a click.
 */
export function loadKnowledge(): KnowledgeBase {
  const result = validateKnowledge(operateData);

  for (const issue of result.issues) {
    if (issue.severity === "warning") console.warn(formatIssue(issue));
  }

  if (!result.ok || !result.knowledge) {
    const details = result.issues
      .filter((issue) => issue.severity === "error")
      .map(formatIssue)
      .join("\n");
    throw new Error(`Invalid knowledge base:\n${details}`);
  }

  return result.knowledge;
}
