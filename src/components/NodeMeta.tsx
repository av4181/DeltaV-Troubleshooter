import type { Node } from "../models/Node";

interface Props {
  node: Node;
}

const badge = {
  display: "inline-block",
  padding: "0.1rem 0.5rem",
  marginRight: "0.4rem",
  borderRadius: "999px",
  border: "1px solid #aaa",
  fontSize: "0.8rem",
} as const;

/** Domain / layer / mechanism / risk badges plus sources and verification state. */
export default function NodeMeta({ node }: Props) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      {node.domain && <span style={badge}>{node.domain}</span>}
      {node.layer && <span style={badge}>Layer: {node.layer}</span>}
      {node.mechanism && <span style={badge}>Mechanism: {node.mechanism}</span>}
      {node.riskLevel && <span style={badge}>Risk: {node.riskLevel}</span>}
      {node.verified === false && (
        <span style={{ ...badge, borderColor: "#b45309", color: "#b45309" }}>
          Unverified
        </span>
      )}
      {node.sources && node.sources.length > 0 && (
        <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0 0" }}>
          Sources: {node.sources.join(", ")}
        </p>
      )}
    </div>
  );
}
