import logData from "../knowledge/logs/logs.json";

import { formatIssue } from "../knowledge/validate.ts";
import { validateLogs } from "../logs/validate.ts";
import type { LogCatalog, LogEntry } from "../logs/schema.ts";

function load(): LogCatalog {
  const result = validateLogs(logData);
  if (!result.data) {
    throw new Error(`Invalid log catalog:\n${result.issues.map(formatIssue).join("\n")}`);
  }
  return result.data;
}

export const logCatalog: LogCatalog = load();

const byId = new Map<string, LogEntry>(logCatalog.logs.map((log) => [log.id, log]));

export function getLog(id: string): LogEntry | undefined {
  return byId.get(id);
}

export function knownLogIds(): ReadonlySet<string> {
  return new Set(byId.keys());
}
