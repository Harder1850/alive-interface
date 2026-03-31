import fs from "node:fs";
import path from "node:path";

import { getRepoPath } from "./repos";

export interface StartupReadiness {
  studioReady: boolean;
  runtimeReady: boolean;
  demoPathReady: boolean;
  details: {
    runtimeRepoPath: string;
    runtimePackageJsonPath: string;
    hasRuntimePackageJson: boolean;
    hasDemoScript: boolean;
    phase1DirPath: string;
    phase1DirReady: boolean;
  };
  timestamp: string;
}

function hasPhase1ProveScript(packageJsonPath: string): boolean {
  if (!fs.existsSync(packageJsonPath)) return false;
  try {
    const raw = fs.readFileSync(packageJsonPath, "utf8");
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
    return Boolean(pkg.scripts?.["phase1:prove"]);
  } catch {
    return false;
  }
}

export function getStartupReadiness(): StartupReadiness {
  const runtimeRepoPath = getRepoPath("runtime");
  const runtimePackageJsonPath = path.join(runtimeRepoPath, "package.json");
  const phase1DirPath = path.join(runtimeRepoPath, ".phase1");

  const hasRuntimePackageJson = fs.existsSync(runtimePackageJsonPath);
  const hasDemoScript = hasPhase1ProveScript(runtimePackageJsonPath);
  let phase1DirReady = fs.existsSync(phase1DirPath);
  if (!phase1DirReady) {
    try {
      fs.mkdirSync(phase1DirPath, { recursive: true });
      phase1DirReady = true;
    } catch {
      phase1DirReady = false;
    }
  }

  return {
    studioReady: true,
    runtimeReady: hasRuntimePackageJson,
    demoPathReady: hasRuntimePackageJson && hasDemoScript && phase1DirReady,
    details: {
      runtimeRepoPath,
      runtimePackageJsonPath,
      hasRuntimePackageJson,
      hasDemoScript,
      phase1DirPath,
      phase1DirReady,
    },
    timestamp: new Date().toISOString(),
  };
}
