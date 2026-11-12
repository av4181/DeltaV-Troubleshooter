import operateData from "../knowledge/operate.json";

import type { KnowledgeBase } from "../types/KnowledgeBase";

export function loadKnowledge(): KnowledgeBase {
  return operateData as KnowledgeBase;
}