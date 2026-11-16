import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";
import Prose from "./Prose";

type QuestionNode = Extract<Node, { type: "question" | "step" }>;

interface Props {
  node: QuestionNode;
  onAnswer: (next: string) => void;
}

export default function QuestionCard({ node, onAnswer }: Props) {
  return (
    <div className="card">
      <h2>{node.title}</h2>
      {node.description && <Prose text={node.description} />}
      <div className="answers">
        {node.answers.map((answer) => (
          <button key={answer.label} className="answer" onClick={() => onAnswer(answer.next)}>
            <span>{answer.label}</span>
            {answer.sub && <span className="sub">{answer.sub}</span>}
          </button>
        ))}
      </div>
      <NodeMeta node={node} />
    </div>
  );
}
