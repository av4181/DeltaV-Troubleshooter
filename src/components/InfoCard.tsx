import type { Node } from "../models/Node";

interface Props {
  node: Node;
}

export default function InfoCard({
  node,
}: Props) {
  return (
    <div>
      <h2>{node.title}</h2>

      <p>
        <strong>Domain:</strong>{" "}
        {node.domain}
      </p>

      <p>
        <strong>Risk Level:</strong>{" "}
        {node.riskLevel}
      </p>

      <p>{node.description}</p>

      {node.actions &&
        node.actions.length > 0 && (
          <>
            <h3>Recommended Checks</h3>

            <ul>
              {node.actions.map((action) => (
                <li key={action}>
                  {action}
                </li>
              ))}
            </ul>
          </>
        )}
    </div>
  );
}