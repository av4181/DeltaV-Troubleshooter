import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { formatIssue, validateKnowledge } from "../src/knowledge/validate.ts";
import { validateHypotheses } from "../src/hypotheses/validate.ts";

const KNOWLEDGE_DIR = join(import.meta.dirname, "..", "src", "knowledge");
const strict = process.argv.includes("--strict");

const files = readdirSync(KNOWLEDGE_DIR).filter((name) => name.endsWith(".json"));

if (files.length === 0) {
  console.error(`No knowledge files found in ${KNOWLEDGE_DIR}`);
  process.exit(1);
}

let errors = 0;
let warnings = 0;

for (const file of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(KNOWLEDGE_DIR, file), "utf-8"));
  } catch (error) {
    console.error(`${file}: not valid JSON — ${(error as Error).message}`);
    errors++;
    continue;
  }

  const result = validateKnowledge(raw);
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
  const result = validateHypotheses(raw);
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
