import type { Node } from "../models/Node";

export class DecisionEngine {
  private currentNodeId: string = "root";

  private trail: string[] = ["root"];

  private knowledge: Record<string, Node>;

  constructor(knowledge: Record<string, Node>) {
    this.knowledge = knowledge;
  }

  getCurrentNode(): Node | undefined {
    return this.knowledge[this.currentNodeId];
  }

  getCurrentNodeId(): string {
    return this.currentNodeId;
  }

  getTrail(): string[] {
    return this.trail;
  }

  moveTo(nodeId: string): void {
    this.currentNodeId = nodeId;
    this.trail.push(nodeId);
  }

  reset(): void {
    this.currentNodeId = "root";
    this.trail = ["root"];
  }
}