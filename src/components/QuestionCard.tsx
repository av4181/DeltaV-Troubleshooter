import type { Node } from "../models/Node";

interface Props {
  node: Node;
  onAnswer: (next: string) => void;
}

export default function QuestionCard({
  node,
  onAnswer,
}: Props) {
  return (
    <div>
      <h2>{node.title}</h2>

      {node.answers?.map((answer) => (
        <div
          key={answer.label}
          style={{ marginBottom: "0.75rem" }}
        >
          <button
            onClick={() => onAnswer(answer.next)}
          >
            {answer.label}
          </button>
        </div>
      ))}
    </div>
  );
}