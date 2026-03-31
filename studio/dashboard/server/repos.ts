import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getGitBranchAndDirty } from "./git";

export type RepoId = "constitution" | "runtime" | "mind" | "body" | "interface";

export interface RepoDefinition {
  id: RepoId;
  name: string;
  folderName: string;
}

export interface RepoStatus {
  id: RepoId;
  name: string;
  path: string;
  branch: string;
  dirty: boolean;
  hasReadme: boolean;
  hasDocs: boolean;
  hasPackageJson: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.resolve(__dirname, "..");

export const REPO_DEFINITIONS: RepoDefinition[] = [
  { id: "constitution", name: "alive-constitution", folderName: "alive-constitution" },
  { id: "runtime", name: "alive-runtime", folderName: "alive-runtime" },
  { id: "mind", name: "alive-mind", folderName: "alive-mind" },
  { id: "body", name: "alive-body", folderName: "alive-body" },
  { id: "interface", name: "alive-interface", folderName: "alive-interface" },
];

function resolveBaseReposDir(): string {
  const candidates = [
    path.resolve(dashboardDir, "../../.."),
    path.resolve(dashboardDir, "../.."),
  ];

  let bestDir = candidates[0];
  let bestScore = -1;

  for (const candidate of candidates) {
    let score = 0;
    for (const repo of REPO_DEFINITIONS) {
      if (fs.existsSync(path.join(candidate, repo.folderName))) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestDir = candidate;
    }
  }

  return bestDir;
}

const baseReposDir = resolveBaseReposDir();

export function getRepoPath(repoId: RepoId): string {
  const repo = REPO_DEFINITIONS.find((r) => r.id === repoId);
  if (!repo) {
    throw new Error(`Unknown repo id: ${repoId}`);
  }
  return path.join(baseReposDir, repo.folderName);
}

export function getReadmePath(repoId: RepoId): string {
  return path.join(getRepoPath(repoId), "README.md");
}

export function getDocsPath(repoId: RepoId): string {
  return path.join(getRepoPath(repoId), "docs");
}

export async function getReposStatus(): Promise<RepoStatus[]> {
  const rows = await Promise.all(
    REPO_DEFINITIONS.map(async (repo) => {
      const repoPath = getRepoPath(repo.id);
      const hasReadme = fs.existsSync(path.join(repoPath, "README.md"));
      const hasDocs = fs.existsSync(path.join(repoPath, "docs"));
      const hasPackageJson = fs.existsSync(path.join(repoPath, "package.json"));

      const { branch, dirty } = await getGitBranchAndDirty(repoPath);

      return {
        id: repo.id,
        name: repo.name,
        path: repoPath,
        branch,
        dirty,
        hasReadme,
        hasDocs,
        hasPackageJson,
      } satisfies RepoStatus;
    })
  );

  return rows;
}
