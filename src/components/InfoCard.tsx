import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";
import Prose from "./Prose";

type InfoNode = Extract<Node, { type: "info" }>;

interface Props {
  node: InfoNode;
  onContinue: (next: string) => void;
}

export default function InfoCard({ node, onContinue }: Props) {
  return (
    <div className="card">
      <h2>{node.title}</h2>
      {node.description && <Prose text={node.description} limit={420} />}
      {node.actions && node.actions.length > 0 && (
        <ul>
          {node.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      )}
      <button className="primary" onClick={() => onContinue(node.next)}>
        {node.nextLabel ?? "Continue"}
      </button>
      <NodeMeta node={node} />
    </div>
  );
}
