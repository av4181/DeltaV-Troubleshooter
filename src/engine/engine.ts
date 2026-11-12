import { ENTRY_NODE_ID } from "../knowledge/validate.ts";
import type { KnowledgeBase, Node } from "../models/schema.ts";

/**
 * Pure navigation logic. The state is only the trail of visited node ids;
 * the current node is always the last entry.
 */
export interface EngineState {
  readonly trail: readonly string[];
}

export type EngineAction =
  | { type: "navigate"; to: string }
  | { type: "back" }
  | { type: "jump"; index: number }
  | { type: "reset" };

export function initialState(): EngineState {
  return { trail: [ENTRY_NODE_ID] };
}

export function currentId(state: EngineState): string {
  return state.trail[state.trail.length - 1] ?? ENTRY_NODE_ID;
}

export function currentNode(state: EngineState, knowledge: KnowledgeBase): Node | undefined {
  return knowledge[currentId(state)];
}

export function reducer(
  state: EngineState,
  action: EngineAction,
  knowledge: KnowledgeBase,
): EngineState {
  switch (action.type) {
    case "navigate":
      // Unknown targets are ignored so the user can never land on a missing node.
      if (!(action.to in knowledge)) return state;
      return { trail: [...state.trail, action.to] };
    case "back":
      return state.trail.length > 1 ? { trail: state.trail.slice(0, -1) } : state;
    case "jump":
      if (action.index < 0 || action.index >= state.trail.length) return state;
      return { trail: state.trail.slice(0, action.index + 1) };
    case "reset":
      return initialState();
  }
}

export interface Crumb {
  id: string;
  title: string;
}

/** Trail with human-readable titles (falls back to the id). */
export function crumbs(state: EngineState, knowledge: KnowledgeBase): Crumb[] {
  return state.trail.map((id) => ({ id, title: knowledge[id]?.title ?? id }));
}
