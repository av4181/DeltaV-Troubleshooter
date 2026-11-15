import { getLog } from "../services/LogCatalog";

interface Props {
  ids: readonly string[] | undefined;
  /** Open by default on tree nodes, where the evidence is the point. Collapsed inside long lists. */
  defaultOpen?: boolean;
}

const code = { fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all" } as const;

/** Evidence sources (logs, exports, tools) for the current node, from the catalog. */
export default function LogList({ ids, defaultOpen = true }: Props) {
  const logs = (ids ?? []).flatMap((id) => {
    const log = getLog(id);
    return log ? [log] : [];
  });
  if (logs.length === 0) return null;

  return (
    <details style={{ margin: "0.75rem 0" }} open={defaultOpen}>
      <summary>
        <strong>Logs and tools to check ({logs.length})</strong>
        {!defaultOpen && (
          <span style={{ color: "#666" }}>: {logs.map((log) => log.name).join(", ")}</span>
        )}
      </summary>
      <ul style={{ paddingLeft: "1.2rem" }}>
        {logs.map((log) => (
          <li key={log.id} style={{ marginBottom: "0.6rem" }}>
            <strong>{log.name}</strong> <span style={{ color: "#666" }}>({log.kind})</span>
            {log.location && (
              <div>
                <span style={code}>{log.location}</span>
              </div>
            )}
            <div>{log.description}</div>
            {log.whenToUse && <div>Look for: {log.whenToUse}</div>}
            {log.howTo && (
              <ol style={{ margin: "0.2rem 0" }}>
                {log.howTo.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            {log.caveats?.map((caveat) => (
              <div key={caveat} style={{ color: "#b45309", fontSize: "0.9rem" }}>
                Caution: {caveat}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </details>
  );
}
