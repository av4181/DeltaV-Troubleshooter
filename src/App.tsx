import { useState } from "react";

import QuestionCard from "./components/QuestionCard";
import InfoCard from "./components/InfoCard";
import Breadcrumb from "./components/Breadcrumb";

import { loadKnowledge } from "./services/KnowledgeLoader";
import { DecisionEngine } from "./engine/DecisionEngine";

const knowledge = loadKnowledge();

const engine = new DecisionEngine(knowledge);

function App() {
  const [nodeId, setNodeId] = useState(
    engine.getCurrentNodeId()
  );

  const [, forceUpdate] = useState(0);

  const node = engine.getCurrentNode();

  function handleAnswer(
    nextNode: string
  ): void {
    engine.moveTo(nextNode);

    setNodeId(
      engine.getCurrentNodeId()
    );
  }

  function resetFlow(): void {
    engine.reset();

    setNodeId(
      engine.getCurrentNodeId()
    );

    forceUpdate(
      (value) => value + 1
    );
  }

  if (!node) {
    return (
      <div
        style={{
          padding: "2rem",
          maxWidth: "900px",
          margin: "auto",
          color: "red",
        }}
      >
        <h2>Knowledge Base Error</h2>

        <p>
          No node was found for:
          {" "}
          {nodeId}
        </p>

        <p>
          Verify that the node exists
          in operate.json.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "900px",
        margin: "auto",
      }}
    >
      <h1>
        DeltaV Root Cause Assistant
      </h1>

      <Breadcrumb
        trail={engine.getTrail()}
      />

      <button
        onClick={resetFlow}
        style={{
          marginBottom: "1rem",
        }}
      >
        Restart
      </button>

      <p>
        Current Node: {nodeId}
      </p>

      {node.type === "question" && (
        <QuestionCard
          node={node}
          onAnswer={handleAnswer}
        />
      )}

      {node.type === "info" && (
        <InfoCard
          node={node}
        />
      )}
    </div>
  );
}

export default App;