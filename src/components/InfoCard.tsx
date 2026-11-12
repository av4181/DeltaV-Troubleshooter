import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";

type InfoNode = Extract<Node, { type: "info" }>;

interface Props {
  node: InfoNode;
  onContinue: (next: string) => void;
}

export default function InfoCard({ node, onContinue }: Props) {
  return (
    <div>
      <h2>{node.title}</h2>
      <NodeMeta node={node} />
      {node.description && <p>{node.description}</p>}

      {node.actions && node.actions.length > 0 && (
        <ul>
          {node.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      )}

      <button onClick={() => onContinue(node.next)}>
        {node.nextLabel ?? "Continue"}
      </button>
    </div>
  );
}
