import { useState } from "react";

import type { Node } from "../models/Node";
import NodeMeta from "./NodeMeta";

type ChecklistNode = Extract<Node, { type: "checklist" }>;

interface Props {
  node: ChecklistNode;
  onContinue: (next: string) => void;
}

export default function ChecklistCard({ node, onContinue }: Props) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());

  function toggle(item: string): void {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  return (
    <div>
      <h2>{node.title}</h2>
      <NodeMeta node={node} />
      {node.description && <p>{node.description}</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {node.items.map((item) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={checked.has(item)}
                onChange={() => toggle(item)}
              />{" "}
              {item}
            </label>
          </li>
        ))}
      </ul>

      <button onClick={() => onContinue(node.next)}>
        {node.nextLabel ?? "Continue"}
      </button>
    </div>
  );
}
