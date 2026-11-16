import type { Node } from "../models/Node";
import LogList from "./LogList";

interface Props {
  node: Node;
}

/** Risk and verification up front; layer, mechanism and sources one click away; logs open on final steps. */
export default function NodeMeta({ node }: Props) {
  const hasDetails = node.domain || node.layer || node.mechanism || (node.sources?.length ?? 0) > 0;
  return (
    <>
      <div className="chips">
        {node.riskLevel && <span className="chip">Risk: {node.riskLevel}</span>}
        {node.verified === false && <span className="chip warn">Unverified</span>}
      </div>
      {hasDetails && (
        <details className="more">
          <summary>Where this fits and sources</summary>
          <div>
            <div className="chips">
              {node.domain && <span className="chip">{node.domain}</span>}
              {node.layer && <span className="chip">Layer: {node.layer}</span>}
              {node.mechanism && <span className="chip">Mechanism: {node.mechanism}</span>}
            </div>
            {node.sources && node.sources.length > 0 && (
              <ul className="sources">
                {node.sources.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}
      <LogList ids={node.logs} defaultOpen={node.type === "terminal"} />
    </>
  );
}
