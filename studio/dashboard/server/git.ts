import { execFile } from "node:child_process";

function runGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.trim() || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export async function getGitBranchAndDirty(repoPath: string): Promise<{ branch: string; dirty: boolean }> {
  try {
    const branch = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], repoPath);
    const status = await runGit(["status", "--porcelain"], repoPath);
    return {
      branch: branch || "unknown",
      dirty: status.length > 0,
    };
  } catch {
    return { branch: "unknown", dirty: false };
  }
}
