import { getLog } from "../services/LogCatalog";

interface Props {
  ids: readonly string[] | undefined;
  /** Open by default on final steps, where the evidence is the point. */
  defaultOpen?: boolean;
}

/** Evidence sources (logs, exports, tools) for the current node, from the catalog. */
export default function LogList({ ids, defaultOpen = true }: Props) {
  const logs = (ids ?? []).flatMap((id) => {
    const log = getLog(id);
    return log ? [log] : [];
  });
  if (logs.length === 0) return null;

  return (
    <details className="logs" open={defaultOpen}>
      <summary>
        Logs and tools to check ({logs.length})
        {!defaultOpen && <span className="names">: {logs.map((log) => log.name).join(", ")}</span>}
      </summary>
      {logs.map((log) => (
        <div key={log.id} className="log">
          <strong>{log.name}</strong> <span className="muted">({log.kind})</span>
          {log.location && <code>{log.location}</code>}
          <div>{log.description}</div>
          {log.whenToUse && <div className="muted">Look for: {log.whenToUse}</div>}
          {log.howTo && (
            <ol>
              {log.howTo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {log.caveats?.map((caveat) => (
            <div key={caveat} className="caution">
              Caution: {caveat}
            </div>
          ))}
        </div>
      ))}
    </details>
  );
}
