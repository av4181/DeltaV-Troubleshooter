import { useReducer, useState } from "react";

import Breadcrumb from "./components/Breadcrumb";
import ChecklistCard from "./components/ChecklistCard";
import HypothesisView from "./components/HypothesisView";
import InfoCard from "./components/InfoCard";
import QuestionCard from "./components/QuestionCard";
import TerminalCard from "./components/TerminalCard";

import { crumbs, currentId, currentNode, initialState, reducer } from "./engine/engine";
import type { EngineAction, EngineState } from "./engine/engine";
import { loadHypothesisSets } from "./services/HypothesisLoader";
import { loadKnowledge } from "./services/KnowledgeLoader";

const knowledge = loadKnowledge();
const hypothesisSets = loadHypothesisSets();

function step(state: EngineState, action: EngineAction): EngineState {
  return reducer(state, action, knowledge);
}

function App() {
  const [state, dispatch] = useReducer(step, undefined, initialState);
  const [mode, setMode] = useState<"guided" | "hypothesis">("guided");
  const [setId, setSetId] = useState<string | undefined>(hypothesisSets[0]?.meta.id);
  const node = currentNode(state, knowledge);

  const goTo = (to: string): void => dispatch({ type: "navigate", to });
  const openSet = (id: string): void => {
    setSetId(id);
    setMode("hypothesis");
  };
  const activeSet = hypothesisSets.find((set) => set.meta.id === setId) ?? hypothesisSets[0];

  if (!node) {
    return (
      <div className="card">
        <h2>Knowledge base error</h2>
        <p>No node was found for: {currentId(state)}</p>
      </div>
    );
  }

  const linkedSet = node.hypothesisSet
    ? hypothesisSets.find((set) => set.meta.id === node.hypothesisSet)
    : undefined;

  return (
    <>
      <header className="header">
        <h1>DeltaV Root Cause Assistant</h1>
        <div className="tabs" role="group" aria-label="Mode">
          <button onClick={() => setMode("guided")} aria-pressed={mode === "guided"}>
            Guided mode
          </button>
          <button onClick={() => setMode("hypothesis")} aria-pressed={mode === "hypothesis"}>
            Hypothesis mode
          </button>
        </div>
      </header>

      {mode === "hypothesis" && activeSet && (
        <>
          {hypothesisSets.length > 1 && (
            <label className="muted" style={{ display: "block", marginBottom: 12 }}>
              Problem:{" "}
              <select value={activeSet.meta.id} onChange={(event) => setSetId(event.target.value)}>
                {hypothesisSets.map((set) => (
                  <option key={set.meta.id} value={set.meta.id}>
                    {set.meta.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <HypothesisView key={activeSet.meta.id} file={activeSet} />
        </>
      )}

      {mode === "guided" && (
        <>
          <div className="toolbar">
            <button
              className="ghost"
              onClick={() => dispatch({ type: "back" })}
              disabled={state.trail.length <= 1}
            >
              Back
            </button>
            <button className="ghost" onClick={() => dispatch({ type: "reset" })}>
              Restart
            </button>
          </div>
          <Breadcrumb
            crumbs={crumbs(state, knowledge)}
            onNavigate={(index) => dispatch({ type: "jump", index })}
          />

          {(node.type === "question" || node.type === "step") && (
            <QuestionCard node={node} onAnswer={goTo} />
          )}
          {node.type === "info" && <InfoCard node={node} onContinue={goTo} />}
          {node.type === "checklist" && (
            <ChecklistCard key={node.id} node={node} onContinue={goTo} />
          )}
          {node.type === "terminal" && <TerminalCard node={node} />}

          {linkedSet && (
            <div className="callout">
              <p>
                <strong>Narrow it down.</strong> Enter what you find and the tool ranks the likely
                causes and proposes the next check.
              </p>
              <button className="primary" onClick={() => openSet(linkedSet.meta.id)}>
                Analyze in hypothesis mode
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default App;
