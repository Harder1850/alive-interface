import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { getDocsPath, getReadmePath, getRepoPath, type RepoId } from "./repos";
import { getNotesFilePath } from "./notes";
import { getSystemStatus } from "./system";
import { recordRecentTarget } from "./targets";
import { getReposStatus } from "./repos";

export type OpenTarget = "root" | "readme" | "docs";

export interface CommandResult {
  ok: boolean;
  output: string;
  command?: string;
}

export interface IntentRunResult {
  ok: boolean;
  status: "auto-approved" | "pending-approval" | "blocked";
  message: string;
  output?: string;
  threadId: string;
  latestIssue: string;
  timestamp: string;
}

const VS_CODE_BIN = "code";

function runExecFile(command: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || error.message || "Command failed").trim()));
        return;
      }
      resolve({ stdout: String(stdout ?? ""), stderr: String(stderr ?? "") });
    });
  });
}

export async function openTarget(repoId: RepoId, target: OpenTarget): Promise<CommandResult> {
  const repoPath = getRepoPath(repoId);
  let openPath = repoPath;

  if (target === "readme") {
    const readmePath = getReadmePath(repoId);
    openPath = fs.existsSync(readmePath) ? readmePath : repoPath;
  }
  if (target === "docs") {
    const docsPath = getDocsPath(repoId);
    openPath = fs.existsSync(docsPath) ? docsPath : repoPath;
  }

  await runExecFile(VS_CODE_BIN, [openPath]);
  await recordRecentTarget({ repoId, target, path: openPath });
  return {
    ok: true,
    output: `Opened in VS Code: ${openPath}`,
    command: `${VS_CODE_BIN} ${JSON.stringify(openPath)}`,
  };
}

function resolveRunCommand(action: string): string[] {
  if (action === "tests") {
    return ["run", "test", "--", "--passWithNoTests"];
  }
  if (action === "build") {
    return ["run", "build"];
  }

  const trimmed = action.trim();
  const match = trimmed.match(/^[a-zA-Z0-9:_-]+$/);
  if (!match) {
    throw new Error("Only simple npm script names are allowed for custom run commands.");
  }
  return ["run", trimmed];
}

export async function runRepoScript(repoId: RepoId, action: string): Promise<CommandResult> {
  const repoPath = getRepoPath(repoId);
  const packageJsonPath = path.join(repoPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      output: `No package.json found in ${repoPath}.`,
    };
  }

  const npmArgs = resolveRunCommand(action);
  try {
    const { stdout, stderr } = await runExecFile("npm", npmArgs, repoPath);
    const output = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
    return {
      ok: true,
      output: output || `Command completed: npm ${npmArgs.join(" ")}`,
      command: `npm ${npmArgs.join(" ")}`,
    };
  } catch (error) {
    return {
      ok: false,
      output: error instanceof Error ? error.message : "Failed to run command.",
      command: `npm ${npmArgs.join(" ")}`,
    };
  }
}

export async function executeCommandBar(rawCommand: string): Promise<CommandResult> {
  const input = rawCommand.trim();
  if (!input) {
    return { ok: false, output: "Command cannot be empty." };
  }

  if (input === "help") {
    return {
      ok: true,
      output: [
        "Available commands:",
        "- help",
        "- system",
        "- open <repoId> <root|readme|docs>",
        "- run <repoId> <tests|build|scriptName>",
        "- show repo status",
        "- open notes",
        "Repo IDs: constitution, runtime, mind, body, interface",
      ].join("\n"),
    };
  }

  if (input === "system") {
    const status = await getSystemStatus();
    return {
      ok: true,
      output: `CPU ${status.cpuPercent}% | RAM ${status.ramUsedGb}/${status.ramTotalGb} GB | Disk ${status.diskUsedGb}/${status.diskTotalGb} GB`,
    };
  }

  if (input === "show repo status") {
    const repos = await getReposStatus();
    const lines = repos.map((r) => `${r.id}: ${r.branch} | ${r.dirty ? "dirty" : "clean"}`);
    return { ok: true, output: lines.join("\n") };
  }

  if (input === "open notes") {
    const notesPath = await getNotesFilePath();
    await runExecFile(VS_CODE_BIN, [notesPath]);
    return {
      ok: true,
      output: `Opened notes: ${notesPath}`,
      command: `${VS_CODE_BIN} ${JSON.stringify(notesPath)}`,
    };
  }

  const openShortMatch = input.match(/^open\s+(constitution|runtime|mind|body|interface)$/i);
  if (openShortMatch) {
    return openTarget(openShortMatch[1].toLowerCase() as RepoId, "root");
  }

  const openMatch = input.match(/^open\s+(constitution|runtime|mind|body|interface)\s+(root|readme|docs)$/i);
  if (openMatch) {
    const repoId = openMatch[1].toLowerCase() as RepoId;
    const target = openMatch[2].toLowerCase() as OpenTarget;
    return openTarget(repoId, target);
  }

  const openDocsMatch = input.match(/^open\s+(constitution|runtime|mind|body|interface)\s+docs$/i);
  if (openDocsMatch) {
    return openTarget(openDocsMatch[1].toLowerCase() as RepoId, "docs");
  }

  const openReadmeMatch = input.match(/^open\s+(constitution|runtime|mind|body|interface)\s+readme$/i);
  if (openReadmeMatch) {
    return openTarget(openReadmeMatch[1].toLowerCase() as RepoId, "readme");
  }

  const runMatch = input.match(/^run\s+(constitution|runtime|mind|body|interface)\s+([a-zA-Z0-9:_-]+)$/i);
  if (runMatch) {
    const repoId = runMatch[1].toLowerCase() as RepoId;
    const action = runMatch[2];
    return runRepoScript(repoId, action);
  }

  return {
    ok: false,
    output: `Unknown command: ${input}. Try \"help\".`,
  };
}

function normalizeIntent(input: string): string {
  return input.trim().toLowerCase();
}

export async function runPlainLanguageIntent(rawIntent: string): Promise<IntentRunResult> {
  const intent = normalizeIntent(rawIntent);
  const threadId = `thread-${Date.now()}`;
  const timestamp = new Date().toISOString();

  if (!intent) {
    return {
      ok: false,
      status: "blocked",
      message: "Intent cannot be empty.",
      threadId,
      latestIssue: "empty-intent",
      timestamp,
    };
  }

  if (/(delete|drop\s+table|shutdown|format|wipe|destroy|rm\s)/i.test(intent)) {
    return {
      ok: false,
      status: "blocked",
      message: "Blocked by policy: destructive intents require explicit offline approval flow.",
      threadId,
      latestIssue: "blocked-destructive-intent",
      timestamp,
    };
  }

  if (/(write|modify|change|deploy|install|reconfigure)/i.test(intent)) {
    return {
      ok: true,
      status: "pending-approval",
      message: "Intent captured and marked pending approval.",
      threadId,
      latestIssue: "awaiting-human-approval",
      timestamp,
    };
  }

  const runDemoHint = /(run|start).*(demo|scenario)|demo/.test(intent);
  if (runDemoHint) {
    const runRes = await runRepoScript("runtime", "phase1:prove");
    return {
      ok: runRes.ok,
      status: "auto-approved",
      message: runRes.ok
        ? "Intent auto-approved and executed via runtime proving path."
        : "Intent auto-approved but runtime execution failed.",
      output: runRes.output,
      threadId,
      latestIssue: runRes.ok ? "none" : "runtime-execution-failed",
      timestamp,
    };
  }

  return {
    ok: true,
    status: "auto-approved",
    message: "Intent accepted. No direct runtime action required.",
    output: `Intent recorded: ${rawIntent}`,
    threadId,
    latestIssue: "none",
    timestamp,
  };
}
