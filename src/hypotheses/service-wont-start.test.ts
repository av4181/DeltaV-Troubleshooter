import { describe, expect, it } from "vitest";

import operate from "../knowledge/operate.json";
import setData from "../knowledge/hypotheses/service-wont-start.json";
import logData from "../knowledge/logs/logs.json";
import { validateKnowledge } from "../knowledge/validate.ts";
import { validateLogs } from "../logs/validate.ts";
import { evaluate, initialState, reducer, suggestNext } from "./engine.ts";
import type { HypothesisAction, HypothesisState } from "./engine.ts";
import { validateHypotheses } from "./validate.ts";

const logs = validateLogs(logData).data;
if (!logs) throw new Error("log catalog must be valid");
const logIds = new Set(logs.logs.map((l) => l.id));
const validated = validateHypotheses(setData, { logIds });
if (!validated.data) throw new Error("service-wont-start.json must be valid");
const file = validated.data;
const tree = validateKnowledge(operate, { logIds, hypothesisSetIds: new Set([file.meta.id]) });

const answer = (observation: string, option: string): HypothesisAction => ({ type: "answer", observation, option });
const run = (...actions: HypothesisAction[]): HypothesisState => actions.reduce(reducer, initialState());
const top = (state: HypothesisState) => evaluate(state, file).find((r) => r.level !== "excluded")?.hypothesis.id;
const get = (state: HypothesisState, id: string) => {
  const r = evaluate(state, file).find((x) => x.hypothesis.id === id);
  if (!r) throw new Error(id);
  return r;
};

describe("customer case: new operator station, workstation configuration re-run, DeltaV Live down", () => {
  const state = run(
    answer("services_state", "missing"),
    answer("customer_changes", "reconfig"),
    answer("role_check", "differs"),
  );

  it("puts the wrong role first", () => {
    expect(top(state)).toBe("wrong_role");
  });

  it("drops the account, timing and crash causes, each with a reason", () => {
    for (const id of ["account_unusable", "logon_right", "domain_unreachable", "start_timeout", "crash_on_start", "service_disabled"]) {
      const r = get(state, id);
      expect(r.level, id).toBe("excluded");
      expect(r.excludedBy?.kind === "observation" && r.excludedBy.reason.because, id).toBeTruthy();
    }
  });

  it("still works when the customer says nothing about what they did", () => {
    const quiet = run(answer("services_state", "missing"), answer("customer_changes", "unknown"));
    expect(top(quiet)).toBe("wrong_role");
  });

  it("lets the engineer rule the role out when it turns out to be correct", () => {
    const correct = run(answer("services_state", "missing"), answer("role_check", "matches"));
    expect(get(correct, "wrong_role").level).toBe("excluded");
    expect(top(correct)).toBe("not_downloaded");
  });
});

describe("services that are present but will not start", () => {
  it("ranks a locked account first on event 7038 with a lockout text", () => {
    const s = run(answer("services_state", "stopped_fails"), answer("scm_event", "e7038"), answer("error_7038_text", "locked"));
    expect(top(s)).toBe("account_unusable");
  });

  it("ranks a missing logon right first on event 7041 or 0xC000015B", () => {
    expect(top(run(answer("scm_event", "e7041")))).toBe("logon_right");
    expect(top(run(answer("security_4625", "notgranted")))).toBe("logon_right");
  });

  it("ranks a failed dependency first on event 7001", () => {
    expect(top(run(answer("scm_event", "e7001"), answer("dependencies", "broken")))).toBe("dependency_failed");
  });

  it("points at the domain when 7038 says it could not be contacted", () => {
    const s = run(answer("scm_event", "e7038"), answer("error_7038_text", "domain"), answer("manual_start", "works"));
    expect(top(s)).toBe("domain_unreachable");
  });

  it("does not exclude timing causes only because the service is present", () => {
    const s = run(answer("services_state", "stopped_fails"));
    expect(get(s, "start_timeout").level).not.toBe("excluded");
  });
});

describe("what the tool proposes first", () => {
  it("starts with read-only, low-effort checks", () => {
    const [first] = suggestNext(initialState(), file, { limit: 1 });
    expect(first?.observation.risk).toBe("Read Only");
    expect(first?.observation.cost).toBe("low");
  });

  it("does not lead with the credential test that can lock the account", () => {
    const ids = suggestNext(initialState(), file, { limit: 3 }).map((s) => s.observation.id);
    expect(ids).not.toContain("runas_test");
  });
});

describe("plain-language start", () => {
  const nodes = operate as Record<string, { type: string; title: string; answers?: { next: string }[]; hypothesisSet?: string }>;

  it("is valid with the set and log links resolved", () => {
    expect(tree.ok).toBe(true);
  });

  it("opens with what the customer reports, not with a layer or a component", () => {
    expect(nodes["root"]?.title).toBe("What is the customer reporting?");
  });

  it("leads from 'DeltaV Live does not work' to the services check and to why they do not start", () => {
    const next = (id: string, label?: string) => nodes[id]?.answers?.map((a) => a.next) ?? [label];
    expect(next("root")).toContain("app.which");
    expect(next("app.which")).toContain("app.live.services");
    expect(next("app.live.services")).toContain("app.services.why");
    expect(next("app.live.services")).toContain("app.services.missing");
  });

  it("hands the analysis over to hypothesis mode on the nodes that need it", () => {
    for (const id of ["app.services.why", "app.services.missing", "change.workstation_config", "change.accounts"]) {
      expect(nodes[id]?.hypothesisSet, id).toBe("service-wont-start");
    }
  });

  it("rejects a link to a hypothesis set that does not exist", () => {
    const bad = structuredClone(operate);
    (bad["app.services.why"] as { hypothesisSet?: string }).hypothesisSet = "no-such-set";
    const result = validateKnowledge(bad, { logIds, hypothesisSetIds: new Set([file.meta.id]) });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => /unknown hypothesis set/.test(i.message))).toBe(true);
  });
});

describe("honesty about the evidence", () => {
  it("marks the case-based role hypothesis as unverified", () => {
    expect(file.hypotheses.find((h) => h.id === "wrong_role")?.verified).toBe(false);
  });

  it("keeps the priors flagged as unreviewed", () => {
    expect(file.meta.priorsReviewed).toBe(false);
  });
});
