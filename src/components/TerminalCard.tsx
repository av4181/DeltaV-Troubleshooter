import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";

type TerminalNode = Extract<Node, { type: "terminal" }>;

interface Props {
  node: TerminalNode;
}

export default function TerminalCard({ node }: Props) {
  return (
    <div>
      <h2>{node.title}</h2>
      <NodeMeta node={node} />
      {node.description && <p>{node.description}</p>}

      {node.actions && node.actions.length > 0 && (
        <>
          <h3>Recommended Checks</h3>
          <ul>
            {node.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
