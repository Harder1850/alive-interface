import type {
  CommandResult,
  Phase1LoopStatus,
  Phase1MemorySnapshot,
  Phase1RuntimeStatus,
  PriorityItem,
  PrioritiesSnapshot,
  RepoId,
  RepoStatus,
  SystemStatus,
  TargetsState,
} from "../types";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchRepos(): Promise<RepoStatus[]> {
  const res = await fetch("/api/repos");
  return readJson<RepoStatus[]>(res);
}

export async function openRepo(repoId: RepoId, target: "root" | "readme" | "docs"): Promise<CommandResult> {
  const res = await fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoId, target }),
  });
  return readJson<CommandResult>(res);
}

export async function runRepo(repoId: RepoId, action: string): Promise<CommandResult> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoId, action }),
  });
  return readJson<CommandResult>(res);
}

export async function fetchSystem(): Promise<SystemStatus> {
  const res = await fetch("/api/system");
  return readJson<SystemStatus>(res);
}

export async function fetchNotes(): Promise<string> {
  const res = await fetch("/api/notes");
  const payload = await readJson<{ content: string }>(res);
  return payload.content;
}

export async function saveNotes(content: string): Promise<void> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  await readJson<{ ok: boolean }>(res);
}

export async function runCommand(command: string): Promise<CommandResult> {
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  return readJson<CommandResult>(res);
}

export async function fetchTargets(): Promise<TargetsState> {
  const res = await fetch("/api/targets");
  return readJson<TargetsState>(res);
}

export async function setFavorite(targetId: string, pinned: boolean): Promise<TargetsState> {
  const res = await fetch("/api/targets/favorite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId, pinned }),
  });
  return readJson<TargetsState>(res);
}

export async function fetchPriorities(): Promise<PriorityItem[]> {
  const res = await fetch("/api/priorities");
  return readJson<PriorityItem[]>(res);
}

export async function fetchPrioritiesSnapshot(): Promise<PrioritiesSnapshot> {
  const res = await fetch("/api/priorities/snapshot");
  return readJson<PrioritiesSnapshot>(res);
}

export async function fetchPhase1Loop(): Promise<Phase1LoopStatus> {
  const res = await fetch("/api/phase1/loop");
  return readJson<Phase1LoopStatus>(res);
}

export async function fetchPhase1Memory(): Promise<Phase1MemorySnapshot> {
  const res = await fetch("/api/phase1/memory");
  return readJson<Phase1MemorySnapshot>(res);
}

export async function fetchPhase1Runtime(): Promise<Phase1RuntimeStatus> {
  const res = await fetch("/api/phase1/runtime");
  return readJson<Phase1RuntimeStatus>(res);
}
