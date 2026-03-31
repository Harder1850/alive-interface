import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { RepoId } from "./repos";

export interface RecentTarget {
  id: string;
  repoId: RepoId;
  target: "root" | "readme" | "docs";
  path: string;
  openedAt: string;
}

export interface TargetsState {
  recent: RecentTarget[];
  favorites: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.resolve(__dirname, "..");
const notesDir = path.join(dashboardDir, "notes");
const targetsFile = path.join(notesDir, "recent-targets.json");

async function ensureState(): Promise<TargetsState> {
  try {
    const raw = await fs.readFile(targetsFile, "utf-8");
    const parsed = JSON.parse(raw) as TargetsState;
    return {
      recent: parsed.recent ?? [],
      favorites: parsed.favorites ?? [],
    };
  } catch {
    const initial: TargetsState = { recent: [], favorites: [] };
    await fs.mkdir(notesDir, { recursive: true });
    await fs.writeFile(targetsFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

async function saveState(state: TargetsState): Promise<void> {
  await fs.mkdir(notesDir, { recursive: true });
  await fs.writeFile(targetsFile, JSON.stringify(state, null, 2), "utf-8");
}

export async function getTargetsState(): Promise<TargetsState> {
  return ensureState();
}

export async function recordRecentTarget(entry: Omit<RecentTarget, "id" | "openedAt">): Promise<RecentTarget> {
  const state = await ensureState();
  const target: RecentTarget = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    openedAt: new Date().toISOString(),
    ...entry,
  };

  state.recent = [target, ...state.recent.filter((r) => !(r.repoId === entry.repoId && r.target === entry.target))].slice(0, 25);
  await saveState(state);
  return target;
}

export async function setFavorite(targetId: string, pinned: boolean): Promise<TargetsState> {
  const state = await ensureState();
  const exists = state.recent.some((r) => r.id === targetId);
  if (!exists) return state;

  const set = new Set(state.favorites);
  if (pinned) set.add(targetId);
  else set.delete(targetId);
  state.favorites = [...set];
  await saveState(state);
  return state;
}
