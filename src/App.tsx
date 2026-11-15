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
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto", color: "red" }}>
        <h2>Knowledge Base Error</h2>
        <p>No node was found for: {currentId(state)}</p>
      </div>
    );
  }

  const linkedSet = node.hypothesisSet
    ? hypothesisSets.find((set) => set.meta.id === node.hypothesisSet)
    : undefined;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto" }}>
      <h1>DeltaV Root Cause Assistant</h1>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setMode("guided")}
          aria-pressed={mode === "guided"}
          style={{ marginRight: "0.5rem", fontWeight: mode === "guided" ? "bold" : "normal" }}
        >
          Guided mode
        </button>
        <button
          onClick={() => setMode("hypothesis")}
          aria-pressed={mode === "hypothesis"}
          style={{ fontWeight: mode === "hypothesis" ? "bold" : "normal" }}
        >
          Hypothesis mode
        </button>
      </div>

      {mode === "hypothesis" && activeSet && (
        <>
          {hypothesisSets.length > 1 && (
            <label style={{ display: "block", marginBottom: "1rem" }}>
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
          <Breadcrumb
            crumbs={crumbs(state, knowledge)}
            onNavigate={(index) => dispatch({ type: "jump", index })}
          />

          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={() => dispatch({ type: "back" })}
              disabled={state.trail.length <= 1}
              style={{ marginRight: "0.5rem" }}
            >
              Back
            </button>
            <button onClick={() => dispatch({ type: "reset" })}>Restart</button>
          </div>

          {(node.type === "question" || node.type === "step") && (
            <QuestionCard node={node} onAnswer={goTo} />
          )}
          {node.type === "info" && <InfoCard node={node} onContinue={goTo} />}
          {node.type === "checklist" && (
            <ChecklistCard key={node.id} node={node} onContinue={goTo} />
          )}
          {node.type === "terminal" && <TerminalCard node={node} />}

          {linkedSet && (
            <div style={{ margin: "1rem 0", padding: "0.75rem", border: "1px solid #2563eb" }}>
              <strong>Narrow it down</strong>
              <p style={{ margin: "0.4rem 0" }}>
                Enter what you find and the tool ranks the likely causes and proposes the next check.
              </p>
              <button onClick={() => openSet(linkedSet.meta.id)}>Analyze in hypothesis mode</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
