import type {
  CommandResult,
  Phase1LoopStatus,
  Phase1MemorySnapshot,
  Phase1RuntimeStatus,
  PriorityItem,
  PrioritiesSnapshot,
  RepoId,
  RepoStatus,
  StartupReadiness,
  SystemStatus,
  TargetsState,
} from "../types";

const API_BASE = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ?? "http://localhost:4174";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchRepos(): Promise<RepoStatus[]> {
  const res = await fetch(apiUrl("/api/repos"));
  return readJson<RepoStatus[]>(res);
}

export async function openRepo(repoId: RepoId, target: "root" | "readme" | "docs"): Promise<CommandResult> {
  const res = await fetch(apiUrl("/api/open"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoId, target }),
  });
  return readJson<CommandResult>(res);
}

export async function runRepo(repoId: RepoId, action: string): Promise<CommandResult> {
  const res = await fetch(apiUrl("/api/run"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoId, action }),
  });
  return readJson<CommandResult>(res);
}

export async function fetchSystem(): Promise<SystemStatus> {
  const res = await fetch(apiUrl("/api/system"));
  return readJson<SystemStatus>(res);
}

export async function fetchNotes(): Promise<string> {
  const res = await fetch(apiUrl("/api/notes"));
  const payload = await readJson<{ content: string }>(res);
  return payload.content;
}

export async function saveNotes(content: string): Promise<void> {
  const res = await fetch(apiUrl("/api/notes"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  await readJson<{ ok: boolean }>(res);
}

export async function runCommand(command: string): Promise<CommandResult> {
  const res = await fetch(apiUrl("/api/command"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  return readJson<CommandResult>(res);
}

export async function fetchTargets(): Promise<TargetsState> {
  const res = await fetch(apiUrl("/api/targets"));
  return readJson<TargetsState>(res);
}

export async function setFavorite(targetId: string, pinned: boolean): Promise<TargetsState> {
  const res = await fetch(apiUrl("/api/targets/favorite"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId, pinned }),
  });
  return readJson<TargetsState>(res);
}

export async function fetchPriorities(): Promise<PriorityItem[]> {
  const res = await fetch(apiUrl("/api/priorities"));
  return readJson<PriorityItem[]>(res);
}

export async function fetchPrioritiesSnapshot(): Promise<PrioritiesSnapshot> {
  const res = await fetch(apiUrl("/api/priorities/snapshot"));
  return readJson<PrioritiesSnapshot>(res);
}

export async function fetchPhase1Loop(): Promise<Phase1LoopStatus> {
  const res = await fetch(apiUrl("/api/phase1/loop"));
  return readJson<Phase1LoopStatus>(res);
}

export async function fetchPhase1Memory(): Promise<Phase1MemorySnapshot> {
  const res = await fetch(apiUrl("/api/phase1/memory"));
  return readJson<Phase1MemorySnapshot>(res);
}

export async function fetchPhase1Runtime(): Promise<Phase1RuntimeStatus> {
  const res = await fetch(apiUrl("/api/phase1/runtime"));
  return readJson<Phase1RuntimeStatus>(res);
}

export async function fetchStartupReadiness(): Promise<StartupReadiness> {
  const res = await fetch(apiUrl("/api/startup-readiness"));
  return readJson<StartupReadiness>(res);
}
