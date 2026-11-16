import { useReducer } from "react";

import { evaluate, initialState, reducer, suggestNext } from "../hypotheses/engine.ts";
import type { Level, Ranked, Reason } from "../hypotheses/engine.ts";
import type { HypothesisFile, Observation } from "../hypotheses/schema.ts";
import LogList from "./LogList";

interface Props {
  file: HypothesisFile;
}

const LEVEL_LABEL: Record<Level, string> = {
  likely: "Likely",
  possible: "Possible",
  unlikely: "Unlikely",
  excluded: "Excluded",
};

const LEVEL_CLASS: Record<Level, string> = {
  likely: "good",
  possible: "mid",
  unlikely: "",
  excluded: "bad",
};

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

  const renderObservation = (observation: Observation) => (
    <ObservationRow
      key={observation.id}
      observation={observation}
      chosen={state.answers[observation.id]}
      suggested={suggestedIds.has(observation.id)}
      onChoose={(option) => dispatch({ type: "answer", observation: observation.id, option })}
    />
  );

  const titleOf = (id: string) => file.hypotheses.find((h) => h.id === id)?.title ?? id;

  return (
    <div>
      <h2>{file.meta.title}</h2>
      <p className="muted">
        Answer what you can observe, in any order, and skip what you cannot check. Causes are
        ranked as you go, and each shows why.
      </p>

      {!file.meta.priorsReviewed && (
        <div className="notice">
          Starting plausibilities are unreviewed estimates (the sources give no frequencies). Treat
          the ranking as a thinking aid, not a verdict.
        </div>
      )}

      <button
        className="ghost"
        onClick={() => dispatch({ type: "reset" })}
        disabled={answered === 0 && state.manualExcluded.length === 0}
      >
        Start over
      </button>

      {suggestions.length > 0 && (
        <section className="suggest">
          <strong>Most useful next checks</strong>
          <ol>
            {suggestions.map((s) => (
              <li key={s.observation.id}>
                {s.observation.question}{" "}
                <span className="muted">(separates: {s.separates.slice(0, 2).map(titleOf).join("; ")}{s.separates.length > 2 ? "; …" : ""})</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <h3>Causes ({active.length} still open)</h3>
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

      <h3>Checks you can enter</h3>
      {file.observations
        .filter((o) => suggestedIds.has(o.id) || state.answers[o.id] !== undefined)
        .map(renderObservation)}
      <details className="more">
        <summary>
          All other checks (
          {file.observations.filter((o) => !suggestedIds.has(o.id) && state.answers[o.id] === undefined).length}
          )
        </summary>
        <div>
          {file.observations
            .filter((o) => !suggestedIds.has(o.id) && state.answers[o.id] === undefined)
            .map(renderObservation)}
        </div>
      </details>
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
    <details className={`hyp${dimmed ? " dim" : ""}`}>
      <summary>
        <span className={`chip ${LEVEL_CLASS[level]}`}>{LEVEL_LABEL[level]}</span>
        <span className="t">{hypothesis.title}</span>
        {hypothesis.verified === false && <span className="chip warn">Unverified</span>}
        {conflict && <span className="chip warn">Conflicting observations</span>}
      </summary>

      <div className="body">
        <p>{hypothesis.description}</p>

        {excludedBy?.kind === "manual" && <p>Ruled out by you.</p>}

        {reasons.length > 0 ? (
          <>
            <h4>Why this ranking</h4>
            <ul>
              {reasons.map((reason) => (
                <li key={`${reason.observationId}-${reason.effect}`}>{describeReason(reason)}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">No observation yet. Starting plausibility: {hypothesis.prior}.</p>
        )}

        {hypothesis.actions && hypothesis.actions.length > 0 && !dimmed && (
          <>
            <h4>If this is it</h4>
            <ul>
              {hypothesis.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </>
        )}

        <LogList ids={hypothesis.logs} defaultOpen={false} />

        <p className="sources">Sources: {hypothesis.sources.join(", ")}</p>

        {onExclude && <button className="ghost" onClick={onExclude}>Rule out</button>}
        {onRestore && <button className="ghost" onClick={onRestore}>Bring back</button>}
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
    <div className={`obs${suggested ? " suggested" : ""}`}>
      <div className="q">{observation.question}</div>
      <div className="chips" style={{ margin: "4px 0" }}>
        <span className="chip">Effort: {observation.cost}</span>
        <span className="chip">Risk: {observation.risk}</span>
      </div>
      {observation.howTo && <div className="muted">{observation.howTo}</div>}
      <LogList ids={observation.logs} defaultOpen={false} />
      <div className="opts">
        {observation.options.map((option) => (
          <button
            key={option.id}
            className="opt"
            onClick={() => onChoose(option.id)}
            aria-pressed={chosen === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
