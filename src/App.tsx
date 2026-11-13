import { useReducer, useState } from "react";

import Breadcrumb from "./components/Breadcrumb";
import ChecklistCard from "./components/ChecklistCard";
import InfoCard from "./components/InfoCard";
import QuestionCard from "./components/QuestionCard";
import TerminalCard from "./components/TerminalCard";
import HypothesisView from "./components/HypothesisView";

import { crumbs, currentId, currentNode, initialState, reducer } from "./engine/engine";
import type { EngineAction, EngineState } from "./engine/engine";
import { loadKnowledge } from "./services/KnowledgeLoader";
import { loadHypothesisSets } from "./services/HypothesisLoader";

const knowledge = loadKnowledge();
const hypothesisSets = loadHypothesisSets();

function step(state: EngineState, action: EngineAction): EngineState {
  return reducer(state, action, knowledge);
}

function App() {
  const [state, dispatch] = useReducer(step, undefined, initialState);
  const [mode, setMode] = useState<"guided" | "hypothesis">("guided");
  const node = currentNode(state, knowledge);

  const goTo = (to: string): void => dispatch({ type: "navigate", to });

  if (!node) {
    return (
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto", color: "red" }}>
        <h2>Knowledge Base Error</h2>
        <p>No node was found for: {currentId(state)}</p>
      </div>
    );
  }

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

      {mode === "hypothesis" ? (
        hypothesisSets.map((file) => <HypothesisView key={file.meta.id} file={file} />)
      ) : (
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
        </>
      )}
    </div>
  );
}

export default App;
