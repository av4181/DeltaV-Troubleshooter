import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";
import Prose from "./Prose";

type TerminalNode = Extract<Node, { type: "terminal" }>;

interface Props {
  node: TerminalNode;
}

export default function TerminalCard({ node }: Props) {
  return (
    <div className="card">
      <h2>{node.title}</h2>
      {node.description && <Prose text={node.description} />}
      {node.actions && node.actions.length > 0 && (
        <div className="checks">
          <h3>Recommended checks</h3>
          <ol>
            {node.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
      )}
      <NodeMeta node={node} />
    </div>
  );
}
