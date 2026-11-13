import { describe, expect, it } from "vitest";

import operateData from "../knowledge/hypotheses/operate-data.json";
import { evaluate, initialState, reducer, suggestNext } from "./engine.ts";
import type { HypothesisAction, HypothesisState } from "./engine.ts";
import { validateHypotheses } from "./validate.ts";

const validated = validateHypotheses(operateData);
if (!validated.data) throw new Error("operate-data.json must be valid for these tests");
const file = validated.data;

const run = (...actions: HypothesisAction[]): HypothesisState =>
  actions.reduce(reducer, initialState());
const answer = (observation: string, option: string): HypothesisAction => ({
  type: "answer",
  observation,
  option,
});
const find = (state: HypothesisState, id: string) => {
  const entry = evaluate(state, file).find((r) => r.hypothesis.id === id);
  if (!entry) throw new Error(`no hypothesis ${id}`);
  return entry;
};

describe("hypothesis engine", () => {
  it("ranks by prior when nothing is known, without excluding anything", () => {
    const ranked = evaluate(initialState(), file);
    expect(ranked[0]?.hypothesis.id).toBe("invalid_datasource");
    expect(ranked.every((r) => r.level !== "excluded")).toBe(true);
  });

  it("shows the starting plausibility as the level before any observation", () => {
    const start = (id: string) => find(initialState(), id).level;
    expect(start("invalid_datasource")).toBe("likely");
    expect(start("dvsys_down")).toBe("possible");
    expect(start("scu_paths")).toBe("unlikely");
  });

  it("excludes on a logical necessity and says why", () => {
    const state = run(answer("dvsys_running", "yes"));
    const dvsys = find(state, "dvsys_down");
    expect(dvsys.level).toBe("excluded");
    expect(dvsys.excludedBy?.kind).toBe("observation");
    expect(dvsys.excludedBy?.kind === "observation" && dvsys.excludedBy.reason.because).toMatch(/not running/);
  });

  it("moves excluded hypotheses to the end", () => {
    const ranked = evaluate(run(answer("tag_group", "no")), file);
    expect(ranked[ranked.length - 1]?.hypothesis.id).toBe("tag_group_expr");
  });

  it("raises supported and lowers weakened hypotheses", () => {
    const base = find(initialState(), "controller_comm").score;
    expect(find(run(answer("scope", "module")), "controller_comm").score).toBeGreaterThan(base);
    expect(find(run(answer("diag_controller", "yes")), "controller_comm").score).toBeLessThan(base);
  });

  it("lets the user rule out and restore a hypothesis manually", () => {
    const out = run({ type: "exclude", hypothesis: "comm_lost" });
    expect(find(out, "comm_lost").excludedBy).toEqual({ kind: "manual" });
    expect(find(reducer(out, { type: "restore", hypothesis: "comm_lost" }), "comm_lost").level).not.toBe("excluded");
  });

  it("toggles an answer off when it is chosen again", () => {
    const state = run(answer("scope", "all"), answer("scope", "all"));
    expect(state.answers).toEqual({});
  });

  it("changes an answer without keeping the old effect", () => {
    const state = run(answer("scope", "module"), answer("scope", "all"));
    expect(find(state, "dvsys_down").level).not.toBe("excluded");
  });

  it("flags conflicting observations instead of hiding them", () => {
    const state = run(answer("scope", "module"), answer("dcom_log", "yes"));
    const dvsys = find(state, "dvsys_down");
    expect(dvsys.level).toBe("excluded");
    expect(dvsys.conflict).toBe(true);
  });

  it("is a pure function of the state", () => {
    const state = run(answer("scope", "picture"));
    expect(evaluate(state, file)).toEqual(evaluate(state, file));
    expect(state.answers).toEqual({ scope: "picture" });
  });
});

describe("next test suggestion", () => {
  it("never proposes an answered observation", () => {
    const state = run(answer("scope", "all"));
    const ids = suggestNext(state, file, { limit: 20 }).map((s) => s.observation.id);
    expect(ids).not.toContain("scope");
  });

  it("proposes something that separates the leaders", () => {
    const suggestions = suggestNext(initialState(), file);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) expect(s.separates.length).toBeGreaterThan(0);
  });

  it("prefers cheap tests over expensive ones with similar information", () => {
    const [first] = suggestNext(initialState(), file, { limit: 1 });
    expect(first?.observation.cost).not.toBe("high");
  });

  it("returns nothing when fewer than two hypotheses remain", () => {
    const state = file.hypotheses.slice(1).reduce<HypothesisState>(
      (s, h) => reducer(s, { type: "exclude", hypothesis: h.id }),
      initialState(),
    );
    expect(suggestNext(state, file)).toEqual([]);
  });
});

describe("hypothesis validation", () => {
  it("rejects an excludes effect without a reason", () => {
    const bad = structuredClone(operateData);
    const effect = bad.observations[2]?.options[0]?.effects[0];
    if (effect) delete (effect as { because?: string }).because;
    expect(validateHypotheses(bad).ok).toBe(false);
  });

  it("rejects an effect on an unknown hypothesis", () => {
    const bad = structuredClone(operateData);
    const effect = bad.observations[0]?.options[0]?.effects[0];
    if (effect) effect.hypothesis = "does_not_exist";
    const result = validateHypotheses(bad);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => /unknown hypothesis/.test(i.message))).toBe(true);
  });

  it("warns about a hypothesis no observation can influence", () => {
    const orphan = structuredClone(operateData);
    orphan.hypotheses.push({
      ...orphan.hypotheses[0]!,
      id: "orphan",
    });
    const result = validateHypotheses(orphan);
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.nodeId === "orphan" && i.severity === "warning")).toBe(true);
  });
});
