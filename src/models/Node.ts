import type { Answer } from "./Answer";

export interface Node {
  id: string;

  type: "question" | "info";

  title: string;

  domain?: string;

  description?: string;

  riskLevel?: "Read Only" | "Controlled Impact" | "Disruptive";

  actions?: string[];

  answers?: Answer[];
}