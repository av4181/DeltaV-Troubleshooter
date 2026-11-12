import { describe, expect, it } from "vitest";

import { validateKnowledge } from "../knowledge/validate.ts";
import operate from "../knowledge/operate.json";
import { crumbs, currentId, currentNode, initialState, reducer } from "./engine.ts";
import type { EngineAction, EngineState } from "./engine.ts";

const result = validateKnowledge(operate);
if (!result.knowledge) throw new Error("operate.json must be valid for these tests");
const kb = result.knowledge;

const run = (state: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((s, a) => reducer(s, a, kb), state);

describe("engine", () => {
  it("starts at root", () => {
    expect(currentId(initialState())).toBe("root");
  });

  it("navigates and records the trail", () => {
    const s = run(initialState(), { type: "navigate", to: "controller_fault" });
    expect(currentId(s)).toBe("controller_fault");
    expect(s.trail).toEqual(["root", "controller_fault"]);
  });

  it("ignores unknown targets", () => {
    const s = initialState();
    expect(run(s, { type: "navigate", to: "nope" })).toBe(s);
  });

  it("goes back one step but never past root", () => {
    const s = run(initialState(), { type: "navigate", to: "io_bad" }, { type: "back" });
    expect(currentId(s)).toBe("root");
    expect(run(s, { type: "back" })).toBe(s);
  });

  it("jumps to an earlier crumb and truncates the trail", () => {
    const s = run(
      initialState(),
      { type: "navigate", to: "controller_fault" },
      { type: "navigate", to: "single_controller" },
      { type: "jump", index: 1 },
    );
    expect(s.trail).toEqual(["root", "controller_fault"]);
  });

  it("ignores out-of-range jumps", () => {
    const s = initialState();
    expect(run(s, { type: "jump", index: 5 })).toBe(s);
    expect(run(s, { type: "jump", index: -1 })).toBe(s);
  });

  it("resets to root", () => {
    const s = run(initialState(), { type: "navigate", to: "io_bad" }, { type: "reset" });
    expect(s.trail).toEqual(["root"]);
  });

  it("does not mutate previous state", () => {
    const before = initialState();
    run(before, { type: "navigate", to: "io_bad" });
    expect(before.trail).toEqual(["root"]);
  });

  it("resolves the current node and crumb titles", () => {
    const s = run(initialState(), { type: "navigate", to: "controller_fault" });
    expect(currentNode(s, kb)?.title).toBe("Is the controller redundant?");
    expect(crumbs(s, kb).map((c) => c.title)).toEqual([
      "What is the primary symptom?",
      "Is the controller redundant?",
    ]);
  });
});

describe("knowledge base", () => {
  it("lets every question reach a terminal node", () => {
    expect(result.issues.filter((i) => i.severity === "warning")).toEqual([]);
  });
});
