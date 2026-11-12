import { knowledgeBaseSchema } from "../models/schema.ts";
import type { KnowledgeBase, Node } from "../models/schema.ts";

export const ENTRY_NODE_ID = "root";

export interface ValidationIssue {
  severity: "error" | "warning";
  /** Node the issue belongs to, when applicable. */
  nodeId?: string;
  message: string;
}

export interface ValidationResult {
  /** Present only when the structure itself is valid. */
  knowledge?: KnowledgeBase;
  issues: ValidationIssue[];
  ok: boolean;
}

/** Ids of the nodes a given node can navigate to. */
export function nextIds(node: Node): string[] {
  switch (node.type) {
    case "question":
    case "step":
      return node.answers.map((answer) => answer.next);
    case "info":
    case "checklist":
      return [node.next];
    case "terminal":
      return [];
  }
}

/**
 * Validates raw (untrusted) JSON in two stages:
 *  1. structure — does every node match the schema?
 *  2. graph     — do the references between nodes make sense?
 *
 * Errors make the knowledge base unusable. Warnings point at content that
 * works but is probably a mistake (unreachable nodes, trapped loops).
 */
export function validateKnowledge(raw: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  const parsed = knowledgeBaseSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [nodeId, ...rest] = issue.path;
      issues.push({
        severity: "error",
        nodeId: typeof nodeId === "string" ? nodeId : undefined,
        message: `${rest.length ? rest.join(".") + ": " : ""}${issue.message}`,
      });
    }
    return { issues, ok: false };
  }

  const knowledge = parsed.data;

  if (!(ENTRY_NODE_ID in knowledge)) {
    issues.push({
      severity: "error",
      message: `Entry node "${ENTRY_NODE_ID}" does not exist.`,
    });
  }

  for (const [key, node] of Object.entries(knowledge)) {
    if (node.id !== key) {
      issues.push({
        severity: "error",
        nodeId: key,
        message: `Key "${key}" does not match node id "${node.id}".`,
      });
    }

    for (const target of nextIds(node)) {
      if (!(target in knowledge)) {
        issues.push({
          severity: "error",
          nodeId: key,
          message: `Points to unknown node "${target}".`,
        });
      }
    }
  }

  // Graph warnings only make sense when the references are sound.
  if (!issues.some((issue) => issue.severity === "error")) {
    const reachable = reachableFrom(ENTRY_NODE_ID, knowledge);
    for (const id of Object.keys(knowledge)) {
      if (!reachable.has(id)) {
        issues.push({
          severity: "warning",
          nodeId: id,
          message: `Unreachable from "${ENTRY_NODE_ID}".`,
        });
      }
    }

    const canFinish = nodesThatReachTerminal(knowledge);
    for (const id of reachable) {
      if (!canFinish.has(id)) {
        issues.push({
          severity: "warning",
          nodeId: id,
          message: "Cannot reach any terminal node (the user is trapped in a loop).",
        });
      }
    }
  }

  const ok = !issues.some((issue) => issue.severity === "error");
  return { knowledge: ok ? knowledge : undefined, issues, ok };
}

function reachableFrom(start: string, knowledge: KnowledgeBase): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || seen.has(id)) continue;
    const node = knowledge[id];
    if (!node) continue;
    seen.add(id);
    stack.push(...nextIds(node));
  }
  return seen;
}

/** Walks the graph backwards from every terminal node. */
function nodesThatReachTerminal(knowledge: KnowledgeBase): Set<string> {
  const incoming = new Map<string, string[]>();
  for (const [id, node] of Object.entries(knowledge)) {
    for (const target of nextIds(node)) {
      const sources = incoming.get(target);
      if (sources) sources.push(id);
      else incoming.set(target, [id]);
    }
  }

  const seen = new Set<string>();
  const stack = Object.entries(knowledge)
    .filter(([, node]) => node.type === "terminal")
    .map(([id]) => id);

  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    stack.push(...(incoming.get(id) ?? []));
  }
  return seen;
}

export function formatIssue(issue: ValidationIssue): string {
  const where = issue.nodeId ? `[${issue.nodeId}] ` : "";
  return `${issue.severity.toUpperCase()} ${where}${issue.message}`;
}
