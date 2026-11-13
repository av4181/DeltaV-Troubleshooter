import { useReducer } from "react";

import { evaluate, initialState, reducer, suggestNext } from "../hypotheses/engine.ts";
import type { Level, Ranked, Reason } from "../hypotheses/engine.ts";
import type { HypothesisFile, Observation } from "../hypotheses/schema.ts";

interface Props {
  file: HypothesisFile;
}

const LEVEL_LABEL: Record<Level, string> = {
  likely: "Likely",
  possible: "Possible",
  unlikely: "Unlikely",
  excluded: "Excluded",
};

const LEVEL_COLOR: Record<Level, string> = {
  likely: "#15803d",
  possible: "#a16207",
  unlikely: "#6b7280",
  excluded: "#b91c1c",
};

const chip = {
  display: "inline-block",
  padding: "0.05rem 0.5rem",
  marginRight: "0.4rem",
  borderRadius: "999px",
  border: "1px solid #aaa",
  fontSize: "0.8rem",
} as const;

function describeReason(reason: Reason): string {
  const verb =
    reason.effect === "excludes"
      ? "excludes"
      : `${reason.strength === "strong" ? "strongly " : ""}${reason.effect}`;
  return `${reason.question} - ${reason.optionLabel}: ${verb}${reason.because ? ` (${reason.because})` : ""}`;
}

export default function HypothesisView({ file }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const ranked = evaluate(state, file);
  const active = ranked.filter((r) => r.level !== "excluded");
  const excluded = ranked.filter((r) => r.level === "excluded");
  const suggestions = suggestNext(state, file);
  const suggestedIds = new Set(suggestions.map((s) => s.observation.id));
  const answered = Object.keys(state.answers).length;

  const titleOf = (id: string) => file.hypotheses.find((h) => h.id === id)?.title ?? id;

  return (
    <div>
      <h2>{file.meta.title}</h2>

      {!file.meta.priorsReviewed && (
        <p style={{ border: "1px solid #b45309", color: "#b45309", padding: "0.5rem" }}>
          The starting plausibility of each hypothesis is an estimate and has not been reviewed.
          The sources give no frequencies. Treat the ranking as a thinking aid, not a verdict.
        </p>
      )}

      <p style={{ color: "#666" }}>
        Answer what you can observe, in any order. Skip what you cannot check. Hypotheses are
        ranked and excluded as you go, and each one shows why.
      </p>

      <button onClick={() => dispatch({ type: "reset" })} disabled={answered === 0 && state.manualExcluded.length === 0}>
        Start over
      </button>

      {suggestions.length > 0 && (
        <section style={{ margin: "1rem 0", padding: "0.75rem", border: "1px solid #2563eb" }}>
          <strong>Most useful next checks</strong>
          <ol>
            {suggestions.map((s) => (
              <li key={s.observation.id}>
                {s.observation.question}{" "}
                <span style={{ color: "#666" }}>
                  (separates: {s.separates.map(titleOf).join("; ")})
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <h3>Hypotheses ({active.length} still open)</h3>
      {active.map((entry) => (
        <HypothesisRow
          key={entry.hypothesis.id}
          entry={entry}
          onExclude={() => dispatch({ type: "exclude", hypothesis: entry.hypothesis.id })}
        />
      ))}

      {excluded.length > 0 && (
        <>
          <h3>Excluded ({excluded.length})</h3>
          {excluded.map((entry) => (
            <HypothesisRow
              key={entry.hypothesis.id}
              entry={entry}
              onRestore={
                entry.excludedBy?.kind === "manual"
                  ? () => dispatch({ type: "restore", hypothesis: entry.hypothesis.id })
                  : undefined
              }
            />
          ))}
        </>
      )}

      <h3>Observations</h3>
      {file.observations.map((observation) => (
        <ObservationRow
          key={observation.id}
          observation={observation}
          chosen={state.answers[observation.id]}
          suggested={suggestedIds.has(observation.id)}
          onChoose={(option) => dispatch({ type: "answer", observation: observation.id, option })}
        />
      ))}
    </div>
  );
}

function HypothesisRow({
  entry,
  onExclude,
  onRestore,
}: {
  entry: Ranked;
  onExclude?: () => void;
  onRestore?: (() => void) | undefined;
}) {
  const { hypothesis, level, reasons, excludedBy, conflict } = entry;
  const dimmed = level === "excluded";

  return (
    <details style={{ marginBottom: "0.5rem", opacity: dimmed ? 0.6 : 1 }}>
      <summary>
        <span style={{ ...chip, borderColor: LEVEL_COLOR[level], color: LEVEL_COLOR[level] }}>
          {LEVEL_LABEL[level]}
        </span>
        {hypothesis.title}
        {hypothesis.verified === false && <span style={{ ...chip, marginLeft: "0.5rem" }}>Unverified</span>}
        {conflict && (
          <span style={{ ...chip, marginLeft: "0.5rem", borderColor: "#b45309", color: "#b45309" }}>
            Conflicting observations
          </span>
        )}
      </summary>

      <div style={{ padding: "0.5rem 1rem" }}>
        <p>{hypothesis.description}</p>

        {excludedBy?.kind === "manual" && <p>Ruled out by you.</p>}

        {reasons.length > 0 ? (
          <>
            <strong>Why this ranking</strong>
            <ul>
              {reasons.map((reason) => (
                <li key={`${reason.observationId}-${reason.effect}`}>{describeReason(reason)}</li>
              ))}
            </ul>
          </>
        ) : (
          <p style={{ color: "#666" }}>No observation yet. Starting plausibility: {hypothesis.prior}.</p>
        )}

        {hypothesis.actions && hypothesis.actions.length > 0 && !dimmed && (
          <>
            <strong>If this is it</strong>
            <ul>
              {hypothesis.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </>
        )}

        <p style={{ fontSize: "0.85rem", color: "#666" }}>Sources: {hypothesis.sources.join(", ")}</p>

        {onExclude && <button onClick={onExclude}>Rule out</button>}
        {onRestore && <button onClick={onRestore}>Bring back</button>}
      </div>
    </details>
  );
}

function ObservationRow({
  observation,
  chosen,
  suggested,
  onChoose,
}: {
  observation: Observation;
  chosen: string | undefined;
  suggested: boolean;
  onChoose: (option: string) => void;
}) {
  return (
    <div
      style={{
        marginBottom: "0.75rem",
        padding: "0.5rem",
        border: `1px solid ${suggested ? "#2563eb" : "#ddd"}`,
      }}
    >
      <div>
        <strong>{observation.question}</strong>
        <span style={{ ...chip, marginLeft: "0.5rem" }}>Effort: {observation.cost}</span>
        <span style={chip}>Risk: {observation.risk}</span>
      </div>
      {observation.howTo && <div style={{ color: "#666", fontSize: "0.9rem" }}>{observation.howTo}</div>}
      <div style={{ marginTop: "0.4rem" }}>
        {observation.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChoose(option.id)}
            aria-pressed={chosen === option.id}
            style={{
              marginRight: "0.4rem",
              marginBottom: "0.3rem",
              fontWeight: chosen === option.id ? "bold" : "normal",
              outline: chosen === option.id ? "2px solid #2563eb" : "none",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
