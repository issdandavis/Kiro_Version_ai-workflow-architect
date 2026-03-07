#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const REPO = process.env.AI_WORKFLOW_REPO || "issdandavis/Kiro_Version_ai-workflow-architect";
const REF = process.env.AI_WORKFLOW_REF || "main";
const WORKFLOW = process.env.AI_WORKFLOW_NAME || "AI Agent Runner";
const POLL_MS = Number(process.env.AI_WORKFLOW_POLL_MS || 5000);
const TIMEOUT_MS = Number(process.env.AI_WORKFLOW_TIMEOUT_MS || 180000);

function runGh(args) {
  return execFileSync("gh", args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJson(output) {
  return JSON.parse(output || "null");
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[validate-ai-runner] repo=${REPO} ref=${REF}`);
  console.log(`[validate-ai-runner] dispatching workflow "${WORKFLOW}"...`);

  runGh([
    "workflow",
    "run",
    WORKFLOW,
    "--repo",
    REPO,
    "--ref",
    REF,
    "-f",
    "agent_type=code-reviewer",
    "-f",
    "target_path=.",
    "-f",
    "model=gpt-4",
  ]);

  const deadline = Date.now() + TIMEOUT_MS;
  let run = null;

  while (Date.now() < deadline) {
    const out = runGh([
      "run",
      "list",
      "--repo",
      REPO,
      "--workflow",
      WORKFLOW,
      "--limit",
      "10",
      "--json",
      "databaseId,status,conclusion,url,createdAt,headBranch,event",
    ]);
    const runs = parseJson(out) || [];
    run = runs.find((r) => r.headBranch === REF && r.event === "workflow_dispatch" && r.createdAt >= startedAt) || runs[0];
    if (run && run.status === "completed") break;
    await sleep(POLL_MS);
  }

  if (!run) {
    console.error("[validate-ai-runner] no run discovered after dispatch");
    process.exit(2);
  }

  const detailsOut = runGh([
    "run",
    "view",
    String(run.databaseId),
    "--repo",
    REPO,
    "--json",
    "conclusion,status,url,workflowName,createdAt,jobs",
  ]);
  const details = parseJson(detailsOut);

  console.log(`[validate-ai-runner] run: ${details.url}`);
  console.log(`[validate-ai-runner] status=${details.status} conclusion=${details.conclusion}`);

  if (details.conclusion !== "success") {
    process.exit(1);
  }
}

await main();
