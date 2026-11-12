import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";

type QuestionNode = Extract<Node, { type: "question" | "step" }>;

interface Props {
  node: QuestionNode;
  onAnswer: (next: string) => void;
}

export default function QuestionCard({ node, onAnswer }: Props) {
  return (
    <div>
      <h2>{node.title}</h2>
      <NodeMeta node={node} />
      {node.description && <p>{node.description}</p>}

      {node.answers.map((answer) => (
        <div key={answer.label} style={{ marginBottom: "0.75rem" }}>
          <button onClick={() => onAnswer(answer.next)}>{answer.label}</button>
          {answer.sub && (
            <span style={{ marginLeft: "0.5rem", color: "#666" }}>{answer.sub}</span>
          )}
        </div>
      ))}
    </div>
  );
}
