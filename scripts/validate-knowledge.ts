import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { formatIssue, validateKnowledge } from "../src/knowledge/validate.ts";
import { validateHypotheses } from "../src/hypotheses/validate.ts";
import { validateLogs } from "../src/logs/validate.ts";

const KNOWLEDGE_DIR = join(import.meta.dirname, "..", "src", "knowledge");
const strict = process.argv.includes("--strict");

const LOGS_DIR = join(KNOWLEDGE_DIR, "logs");
const logIds = new Set<string>();
let logErrors = 0;
let logWarnings = 0;
for (const file of readdirSync(LOGS_DIR).filter((name) => name.endsWith(".json"))) {
  const result = validateLogs(JSON.parse(readFileSync(join(LOGS_DIR, file), "utf-8")));
  for (const issue of result.issues) {
    console.error(`logs/${file}: ${formatIssue(issue)}`);
    if (issue.severity === "error") logErrors++;
    else logWarnings++;
  }
  for (const log of result.data?.logs ?? []) logIds.add(log.id);
  if (result.data) console.log(`logs/${file}: ${result.data.logs.length} entries OK`);
}

const files = readdirSync(KNOWLEDGE_DIR).filter((name) => name.endsWith(".json"));

if (files.length === 0) {
  console.error(`No knowledge files found in ${KNOWLEDGE_DIR}`);
  process.exit(1);
}

let errors = logErrors;
let warnings = logWarnings;

for (const file of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(KNOWLEDGE_DIR, file), "utf-8"));
  } catch (error) {
    console.error(`${file}: not valid JSON — ${(error as Error).message}`);
    errors++;
    continue;
  }

  const result = validateKnowledge(raw, { logIds });
  const nodeCount = raw && typeof raw === "object" ? Object.keys(raw).length : 0;

  for (const issue of result.issues) {
    console.error(`${file}: ${formatIssue(issue)}`);
    if (issue.severity === "error") errors++;
    else warnings++;
  }

  if (result.ok) console.log(`${file}: ${nodeCount} nodes OK`);
}

const HYPOTHESES_DIR = join(KNOWLEDGE_DIR, "hypotheses");
for (const file of readdirSync(HYPOTHESES_DIR).filter((name) => name.endsWith(".json"))) {
  const label = `hypotheses/${file}`;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(HYPOTHESES_DIR, file), "utf-8"));
  } catch (error) {
    console.error(`${label}: not valid JSON - ${(error as Error).message}`);
    errors++;
    continue;
  }
  const result = validateHypotheses(raw, { logIds });
  for (const issue of result.issues) {
    console.error(`${label}: ${formatIssue(issue)}`);
    if (issue.severity === "error") errors++;
    else warnings++;
  }
  if (result.data) {
    console.log(`${label}: ${result.data.hypotheses.length} hypotheses, ${result.data.observations.length} observations OK`);
  }
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);

if (errors > 0 || (strict && warnings > 0)) process.exit(1);
