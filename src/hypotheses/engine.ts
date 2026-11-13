import type {
  Cost,
  EffectKind,
  Hypothesis,
  HypothesisFile,
  Observation,
  Plausibility,
  Strength,
} from "./schema.ts";

/**
 * Pure evaluation logic. State is only what the user entered; the ranking is
 * always derived, so every score can be explained from the observations.
 */
export interface HypothesisState {
  /** observation id -> chosen option id */
  readonly answers: Readonly<Record<string, string>>;
  readonly manualExcluded: readonly string[];
}

export type HypothesisAction =
  | { type: "answer"; observation: string; option: string }
  | { type: "clear"; observation: string }
  | { type: "exclude"; hypothesis: string }
  | { type: "restore"; hypothesis: string }
  | { type: "reset" };

export function initialState(): HypothesisState {
  return { answers: {}, manualExcluded: [] };
}

export function reducer(state: HypothesisState, action: HypothesisAction): HypothesisState {
  switch (action.type) {
    case "answer":
      // Choosing the selected option again clears it.
      if (state.answers[action.observation] === action.option) {
        return reducer(state, { type: "clear", observation: action.observation });
      }
      return { ...state, answers: { ...state.answers, [action.observation]: action.option } };
    case "clear": {
      const { [action.observation]: _removed, ...rest } = state.answers;
      return { ...state, answers: rest };
    }
    case "exclude":
      return state.manualExcluded.includes(action.hypothesis)
        ? state
        : { ...state, manualExcluded: [...state.manualExcluded, action.hypothesis] };
    case "restore":
      return { ...state, manualExcluded: state.manualExcluded.filter((id) => id !== action.hypothesis) };
    case "reset":
      return initialState();
  }
}

const PRIOR_WEIGHT: Record<Plausibility, number> = { likely: 1, possible: 0, unlikely: -1 };
const STRENGTH_WEIGHT: Record<Strength, number> = { weak: 1, strong: 2 };
const COST_WEIGHT: Record<Cost, number> = { low: 1, medium: 2, high: 3 };
const RISK_WEIGHT = { "Read Only": 0, "Controlled Impact": 1, Disruptive: 3 } as const;
/** Signal strength of a hard elimination when comparing hypotheses. */
const EXCLUDE_SIGNAL = 4;

export type Level = "likely" | "possible" | "unlikely" | "excluded";

export interface Reason {
  observationId: string;
  question: string;
  optionLabel: string;
  effect: EffectKind;
  strength?: Strength;
  because?: string;
}

export interface Ranked {
  hypothesis: Hypothesis;
  score: number;
  level: Level;
  /** Set when the hypothesis is out of the running. */
  excludedBy?: { kind: "observation"; reason: Reason } | { kind: "manual" };
  reasons: Reason[];
  /** Excluded by one observation but supported by another: check the inputs. */
  conflict: boolean;
}

function levelFor(score: number): Exclude<Level, "excluded"> {
  if (score >= 1) return "likely";
  if (score >= 0) return "possible";
  return "unlikely";
}

function reasonsFor(hypothesisId: string, state: HypothesisState, file: HypothesisFile): Reason[] {
  const reasons: Reason[] = [];
  for (const observation of file.observations) {
    const chosen = state.answers[observation.id];
    if (chosen === undefined) continue;
    const option = observation.options.find((o) => o.id === chosen);
    if (!option) continue;
    for (const effect of option.effects) {
      if (effect.hypothesis !== hypothesisId) continue;
      reasons.push({
        observationId: observation.id,
        question: observation.question,
        optionLabel: option.label,
        effect: effect.effect,
        strength: effect.strength,
        because: effect.because,
      });
    }
  }
  return reasons;
}

/** Active hypotheses first (best score first), excluded ones last. */
export function evaluate(state: HypothesisState, file: HypothesisFile): Ranked[] {
  const ranked = file.hypotheses.map((hypothesis, index) => {
    const reasons = reasonsFor(hypothesis.id, state, file);

    let score = PRIOR_WEIGHT[hypothesis.prior];
    for (const reason of reasons) {
      const weight = STRENGTH_WEIGHT[reason.strength ?? "weak"];
      if (reason.effect === "supports") score += weight;
      else if (reason.effect === "weakens") score -= weight;
    }

    const hard = reasons.find((r) => r.effect === "excludes");
    const manual = state.manualExcluded.includes(hypothesis.id);
    const excludedBy: Ranked["excludedBy"] = hard
      ? { kind: "observation", reason: hard }
      : manual
        ? { kind: "manual" }
        : undefined;

    return {
      index,
      item: {
        hypothesis,
        score,
        level: excludedBy ? "excluded" : levelFor(score),
        excludedBy,
        reasons,
        conflict: !!hard && reasons.some((r) => r.effect === "supports"),
      } satisfies Ranked,
    };
  });

  return ranked
    .sort((a, b) => {
      const aOut = a.item.level === "excluded" ? 1 : 0;
      const bOut = b.item.level === "excluded" ? 1 : 0;
      return aOut - bOut || b.item.score - a.item.score || a.index - b.index;
    })
    .map((entry) => entry.item);
}

export interface Suggestion {
  observation: Observation;
  /** How well the answers separate the leading hypotheses, per unit of effort. */
  value: number;
  /** The leading hypotheses this test tells apart. */
  separates: string[];
}

function signal(effect: EffectKind, strength: Strength | undefined): number {
  if (effect === "excludes") return -EXCLUDE_SIGNAL;
  const weight = STRENGTH_WEIGHT[strength ?? "weak"];
  return effect === "supports" ? weight : -weight;
}

/**
 * Proposes the unanswered observations that best separate the leading
 * hypotheses. Cost and risk reduce the value, so a cheap read-only check
 * beats a slightly more informative but disruptive one.
 */
export function suggestNext(
  state: HypothesisState,
  file: HypothesisFile,
  options: { focus?: number; limit?: number } = {},
): Suggestion[] {
  const { focus = 4, limit = 3 } = options;
  const leaders = evaluate(state, file)
    .filter((r) => r.level !== "excluded")
    .slice(0, focus)
    .map((r) => r.hypothesis.id);

  if (leaders.length < 2) return [];

  const suggestions: Suggestion[] = [];
  for (const observation of file.observations) {
    if (state.answers[observation.id] !== undefined) continue;

    let spreadTotal = 0;
    const touched = new Set<string>();
    for (const option of observation.options) {
      const values = leaders.map((id) => {
        const effect = option.effects.find((e) => e.hypothesis === id);
        if (effect) touched.add(id);
        return effect ? signal(effect.effect, effect.strength) : 0;
      });
      spreadTotal += Math.max(...values) - Math.min(...values);
    }

    const discrimination = spreadTotal / observation.options.length;
    if (discrimination === 0) continue;

    const effort = COST_WEIGHT[observation.cost] + RISK_WEIGHT[observation.risk];
    suggestions.push({ observation, value: discrimination / effort, separates: [...touched] });
  }

  return suggestions.sort((a, b) => b.value - a.value).slice(0, limit);
}
